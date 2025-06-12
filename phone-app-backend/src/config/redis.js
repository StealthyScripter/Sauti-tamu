import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

const client = createClient({
  socket: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    reconnectStrategy: (retries) => Math.min(retries * 50, 500)
  },
  password: process.env.REDIS_PASSWORD,
  retry_strategy: (options) => {
    if (options.error && options.error.code === 'ECONNREFUSED') {
      console.error('❌ Redis server connection refused');
      return new Error('The Redis server refused the connection');
    }
    if (options.total_retry_time > 1000 * 60 * 60) {
      console.error('❌ Redis retry time exhausted');
      return new Error('Retry time exhausted');
    }
    if (options.attempt > 10) {
      console.error('❌ Redis max retry attempts reached');
      return undefined;
    }
    return Math.min(options.attempt * 100, 3000);
  }
});

client.on('connect', () => {
  console.log('✅ Connected to Redis');
});

client.on('error', (err) => {
  console.error('❌ Redis connection error:', err);
});

client.on('reconnecting', () => {
  console.log('🔄 Reconnecting to Redis...');
});

// Test connection function
async function testRedisConnection() {
  try {
    await client.ping();
    console.log('✅ Redis connection test successful');
    return true;
  } catch (error) {
    console.error('❌ Redis connection test failed:', error);
    throw error;
  }
}

// Connect with error handling
async function connectRedis() {
  try {
    await client.connect();
    await testRedisConnection();
  } catch (error) {
    console.error('❌ Failed to connect to Redis:', error);
    throw error;
  }
}

// Initialize connection
connectRedis().catch(error => {
  console.error('❌ Redis connection failed on startup:', error);
  process.exit(1);
});

export default client;
export { testRedisConnection };