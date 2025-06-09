import pkg from 'pg';
import dotenv from 'dotenv';

const { Pool } = pkg;
dotenv.config();

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DB || 'phoneapp',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'password',
});

async function runMigrations() {
  try {
    console.log('Running database migrations...');

    // Enable UUID extension
    await pool.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto";');
    console.log('✅ Extensions created');

    // Users table
    await pool.query(`
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
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_users_phone_number ON users(phone_number);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active, last_login_at DESC);
    `);
    console.log('✅ Users table created');

    // User settings table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_settings (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          setting_key VARCHAR(100) NOT NULL,
          setting_value JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(user_id, setting_key)
      );
    `);
    console.log('✅ User settings table created');

    // Verification codes table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS verification_codes (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          phone_number VARCHAR(20) NOT NULL,
          code VARCHAR(10) NOT NULL,
          attempts INTEGER DEFAULT 0,
          expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
          used_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_verification_codes_phone ON verification_codes(phone_number);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_verification_codes_expires ON verification_codes(expires_at);
    `);
    console.log('✅ Verification codes table created');

    // Call sessions table
    await pool.query(`
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
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_call_sessions_from_user ON call_sessions(from_user_id, start_time DESC);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_call_sessions_to_user ON call_sessions(to_user_id, start_time DESC);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_call_sessions_status ON call_sessions(status, start_time DESC);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_call_sessions_call_id ON call_sessions(call_id);
    `);
    console.log('✅ Call sessions table created');

    // Call recordings table (simplified)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS call_recordings (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          recording_id VARCHAR(100) UNIQUE NOT NULL,
          call_id UUID NOT NULL,
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          start_time TIMESTAMP WITH TIME ZONE NOT NULL,
          end_time TIMESTAMP WITH TIME ZONE,
          duration_seconds INTEGER DEFAULT 0,
          file_size_bytes BIGINT DEFAULT 0,
          file_urls JSONB,
          agora_response JSONB,
          status VARCHAR(20) CHECK (status IN ('recording', 'stopped', 'failed', 'processing')) DEFAULT 'recording',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_call_recordings_user_id ON call_recordings(user_id, created_at DESC);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_call_recordings_call_id ON call_recordings(call_id);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_call_recordings_status ON call_recordings(status, created_at DESC);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_call_recordings_recording_id ON call_recordings(recording_id);
    `);
    console.log('✅ Call recordings table created');

    // Create update function for timestamps
    await pool.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS
      'BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
      END;'
      LANGUAGE 'plpgsql';
    `);
    console.log('✅ Update function created');

    // Create triggers
    await pool.query(`
      DROP TRIGGER IF EXISTS update_users_updated_at ON users;
      CREATE TRIGGER update_users_updated_at 
      BEFORE UPDATE ON users
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `);

    await pool.query(`
      DROP TRIGGER IF EXISTS update_user_settings_updated_at ON user_settings;
      CREATE TRIGGER update_user_settings_updated_at 
      BEFORE UPDATE ON user_settings
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `);

    await pool.query(`
      DROP TRIGGER IF EXISTS update_call_sessions_updated_at ON call_sessions;
      CREATE TRIGGER update_call_sessions_updated_at 
      BEFORE UPDATE ON call_sessions
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `);

    await pool.query(`
      DROP TRIGGER IF EXISTS update_call_recordings_updated_at ON call_recordings;
      CREATE TRIGGER update_call_recordings_updated_at 
      BEFORE UPDATE ON call_recordings
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `);
    console.log('✅ Triggers created');

    console.log('✅ All database migrations completed successfully!');
    await pool.end();
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigrations();