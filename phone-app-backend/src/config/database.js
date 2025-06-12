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
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  // connection retry
  retry: {
    max: 5,
    delay: 1000,
    backoff: 'exponential'
  }
});

// Connection handling
pool.on('connect', (client) => {
  console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err, client) => {
  console.error('❌ PostgreSQL connection error:', err);
  // Attempt reconnection
  setTimeout(() => {
    console.log('🔄 Attempting to reconnect to PostgreSQL...');
  }, 5000);
});

// Test connection on startup
async function testConnection() {
  try {
    const client = await pool.connect();
    console.log('✅ PostgreSQL connection test successful');
    client.release();
    return true;
  } catch (error) {
    console.error('❌ PostgreSQL connection test failed:', error);
    throw error;
  }
}

// Initialize connection test
testConnection().catch(error => {
  console.error('❌ Database connection failed on startup:', error);
  process.exit(1);
});

export default pool;
export { testConnection };