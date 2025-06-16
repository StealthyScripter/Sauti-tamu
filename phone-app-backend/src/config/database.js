import pkg from 'pg';
import dotenv from 'dotenv';

const { Pool } = pkg;
dotenv.config();

class DatabaseConnection {
  constructor() {
    this.pool = null;
    this.connectionAttempts = 0;
    this.maxRetries = 5;
    this.retryDelay = 2000; // Start with 2 seconds
    this.isConnected = false;
  }

  async connect() {
    if (this.pool && this.isConnected) {
      return this.pool;
    }

    while (this.connectionAttempts < this.maxRetries) {
      try {
        console.log(`🔄 Database connection attempt ${this.connectionAttempts + 1}/${this.maxRetries}`);
        
        this.pool = new Pool({
          host: process.env.POSTGRES_HOST || 'localhost',
          port: process.env.POSTGRES_PORT || 5432,
          database: process.env.POSTGRES_DB || 'phoneapp',
          user: process.env.POSTGRES_USER || 'postgres',
          password: process.env.POSTGRES_PASSWORD || 'password',
          max: 20,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 10000,
          // FIX: Add connection retry options
          retryDelay: this.retryDelay,
          retryDelayMultiplier: 2,
          retryMaxDelay: 30000,
        });

        // Test the connection
        await this.testConnection();
        
        // Set up event handlers
        this.setupEventHandlers();
        
        this.isConnected = true;
        console.log('✅ Database connected successfully');
        return this.pool;
        
      } catch (error) {
        this.connectionAttempts++;
        console.error(`❌ Database connection attempt ${this.connectionAttempts} failed:`, error.message);
        
        if (this.connectionAttempts >= this.maxRetries) {
          console.error('💥 Max database connection attempts reached. Shutting down.');
          process.exit(1);
        }
        
        // Exponential backoff
        const delay = this.retryDelay * Math.pow(2, this.connectionAttempts - 1);
        console.log(`⏳ Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  setupEventHandlers() {
    this.pool.on('connect', (client) => {
      console.log('✅ New database client connected');
    });

    this.pool.on('error', (err, client) => {
      console.error('❌ Database connection error:', err);
      this.isConnected = false;
      
      // Attempt to reconnect
      setTimeout(() => {
        console.log('🔄 Attempting to reconnect to database...');
        this.connectionAttempts = 0; // Reset attempts for reconnection
        this.connect();
      }, 5000);
    });
  }

  async testConnection() {
    if (!this.pool) {
      throw new Error('No database pool available');
    }
    
    const client = await this.pool.connect();
    try {
      await client.query('SELECT 1');
      console.log('✅ Database connection test successful');
    } finally {
      client.release();
    }
  }

  async query(text, params) {
    if (!this.isConnected) {
      await this.connect();
    }
    return this.pool.query(text, params);
  }

  async getClient() {
    if (!this.isConnected) {
      await this.connect();
    }
    return this.pool.connect();
  }

  async end() {
    if (this.pool) {
      await this.pool.end();
      this.isConnected = false;
      console.log('✅ Database connection closed');
    }
  }
}

const dbConnection = new DatabaseConnection();

// Initialize connection on module load
dbConnection.connect().catch(error => {
  console.error('❌ Failed to initialize database connection:', error);
});

export default dbConnection.pool;
export { dbConnection as database };