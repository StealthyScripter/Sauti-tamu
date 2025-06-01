import pkg from 'pg';
import dotenv from 'dotenv';

const { Pool } = pkg;
dotenv.config();

const pool = new Pool({
  host: process.env.POSTGRES_HOST,
  port: process.env.POSTGRES_PORT,
  database: process.env.POSTGRES_DB,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
});

async function runMigrations() {
  try {
    console.log('Running database migrations...');

    const createSchema = `
      CREATE EXTENSION IF NOT EXISTS "pgcrypto";

      -- Users table
      CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          phone_number VARCHAR(20) UNIQUE NOT NULL,
          display_name VARCHAR(255),
          avatar_url TEXT,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          last_login_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_users_phone_number ON users(phone_number);
      CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active, last_login_at DESC);

      -- User settings table
      CREATE TABLE IF NOT EXISTS user_settings (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          setting_key VARCHAR(100) NOT NULL,
          setting_value JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(user_id, setting_key)
      );

      -- Verification codes table
      CREATE TABLE IF NOT EXISTS verification_codes (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          phone_number VARCHAR(20) NOT NULL,
          code VARCHAR(10) NOT NULL,
          attempts INTEGER DEFAULT 0,
          expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
          used_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_verification_codes_phone ON verification_codes(phone_number);
      CREATE INDEX IF NOT EXISTS idx_verification_codes_expires ON verification_codes(expires_at);

      -- Call sessions table
      CREATE TABLE IF NOT EXISTS call_sessions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          call_id UUID UNIQUE NOT NULL,
          from_user_id UUID NOT NULL REFERENCES users(id),
          to_user_id UUID REFERENCES users(id),
          to_phone_number VARCHAR(20) NOT NULL,
          call_type VARCHAR(10) CHECK (call_type IN ('voice', 'video')) NOT NULL,
          status VARCHAR(20) CHECK (status IN ('initiated', 'ringing', 'active', 'ended', 'failed', 'missed', 'rejected')) DEFAULT 'initiated',
          start_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          end_time TIMESTAMP WITH TIME ZONE,
          duration_seconds INTEGER DEFAULT 0,
          quality_score INTEGER CHECK (quality_score >= 1 AND quality_score <= 5),
          connection_type VARCHAR(20) DEFAULT 'unknown',
          metadata JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_call_sessions_from_user ON call_sessions(from_user_id, start_time DESC);
      CREATE INDEX IF NOT EXISTS idx_call_sessions_to_user ON call_sessions(to_user_id, start_time DESC);
      CREATE INDEX IF NOT EXISTS idx_call_sessions_status ON call_sessions(status, start_time DESC);
      CREATE INDEX IF NOT EXISTS idx_call_sessions_call_id ON call_sessions(call_id);

      -- Function for updating updated_at timestamp
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
      END;
      $$ language 'plpgsql';

      -- Triggers
      CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

      CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

      CREATE TRIGGER update_call_sessions_updated_at BEFORE UPDATE ON call_sessions
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

      -- Analytics view
      CREATE OR REPLACE VIEW call_analytics AS
      SELECT 
          u.id as user_id,
          u.display_name,
          COUNT(*) as total_calls,
          COUNT(*) FILTER (WHERE cs.status = 'ended') as completed_calls,
          COUNT(*) FILTER (WHERE cs.status = 'missed') as missed_calls,
          COUNT(*) FILTER (WHERE cs.status = 'rejected') as rejected_calls,
          AVG(cs.duration_seconds) FILTER (WHERE cs.status = 'ended') as avg_call_duration,
          SUM(cs.duration_seconds) FILTER (WHERE cs.status = 'ended') as total_call_time,
          MAX(cs.start_time) as last_call_time
      FROM users u
      LEFT JOIN call_sessions cs ON u.id = cs.from_user_id
      GROUP BY u.id, u.display_name;
    `;

    await pool.query(createSchema);
    console.log('✅ PostgreSQL schema created successfully');

    await pool.end();
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigrations();
