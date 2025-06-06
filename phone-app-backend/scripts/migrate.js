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

      -- Call recordings table
      CREATE TABLE IF NOT EXISTS call_recordings (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          recording_id VARCHAR(100) UNIQUE NOT NULL,
          call_id UUID NOT NULL,
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          start_time TIMESTAMP WITH TIME ZONE NOT NULL,
          end_time TIMESTAMP WITH TIME ZONE,
          duration_seconds INTEGER DEFAULT 0,
          file_size_bytes BIGINT DEFAULT 0,
          file_urls JSONB, -- Array of file URLs/paths
          agora_response JSONB, -- Full Agora API response
          status VARCHAR(20) CHECK (status IN ('recording', 'stopped', 'failed', 'processing')) DEFAULT 'recording',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      -- Indexes for efficient queries
      CREATE INDEX IF NOT EXISTS idx_call_recordings_user_id ON call_recordings(user_id, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_call_recordings_call_id ON call_recordings(call_id);
      CREATE INDEX IF NOT EXISTS idx_call_recordings_status ON call_recordings(status, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_call_recordings_recording_id ON call_recordings(recording_id);

      -- Add recording support to existing call_sessions table
      ALTER TABLE call_sessions 
      ADD COLUMN IF NOT EXISTS recording_enabled BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS recording_id VARCHAR(100),
      ADD COLUMN IF NOT EXISTS recording_status VARCHAR(20) CHECK (recording_status IN ('none', 'recording', 'stopped', 'failed'));

      -- Update triggers for call_recordings
      CREATE TRIGGER update_call_recordings_updated_at 
      BEFORE UPDATE ON call_recordings
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

      -- View for call recordings with user info
      CREATE OR REPLACE VIEW call_recordings_with_users AS
      SELECT 
          cr.*,
          u.display_name as user_name,
          u.phone_number as user_phone,
          cs.from_user_id,
          cs.to_user_id,
          cs.to_phone_number,
          cs.call_type
      FROM call_recordings cr
      JOIN users u ON cr.user_id = u.id
      LEFT JOIN call_sessions cs ON cr.call_id = cs.call_id;

      -- Function to get recording statistics
      CREATE OR REPLACE FUNCTION get_recording_stats(user_uuid UUID)
      RETURNS TABLE (
          total_recordings BIGINT,
          total_duration_seconds BIGINT,
          total_file_size_bytes BIGINT,
          avg_duration_seconds NUMERIC,
          recordings_this_month BIGINT
      ) AS $
      BEGIN
          RETURN QUERY
          SELECT 
              COUNT(*)::BIGINT as total_recordings,
              COALESCE(SUM(duration_seconds), 0)::BIGINT as total_duration_seconds,
              COALESCE(SUM(file_size_bytes), 0)::BIGINT as total_file_size_bytes,
              COALESCE(AVG(duration_seconds), 0)::NUMERIC as avg_duration_seconds,
              COUNT(*) FILTER (WHERE created_at >= date_trunc('month', CURRENT_TIMESTAMP))::BIGINT as recordings_this_month
          FROM call_recordings 
          WHERE user_id = user_uuid AND status = 'stopped';
      END;
      $ LANGUAGE plpgsql;
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
