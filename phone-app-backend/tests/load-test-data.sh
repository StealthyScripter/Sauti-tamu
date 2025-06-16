#!/bin/bash

# Clean and Load Test Data Script
# This script completely cleans the databases and loads fresh test data

echo "🧹 Clean and Load Test Data Script"
echo "=================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

BASE_URL="http://localhost:3000"

# Check server
echo "🔍 Checking server..."
if ! curl -s "$BASE_URL/health" >/dev/null 2>&1; then
    echo -e "${RED}❌ Server not running on localhost:3000${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Server is running${NC}"
echo ""

# Ask for confirmation
echo -e "${YELLOW}⚠️ This will COMPLETELY CLEAN all test data in your databases!${NC}"
echo "Are you sure you want to continue? (y/N)"
read -r confirmation

if [[ ! "$confirmation" =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 0
fi

echo ""
echo "🧹 Cleaning and loading fresh test data..."

# Create comprehensive clean and load script
cat > clean-and-load.js << 'EOF'
import pkg from 'pg';
import mongoose from 'mongoose';
import { createClient } from 'redis';

const { Pool } = pkg;

// Database connections
const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DB || 'phoneapp',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'password',
});

const redis = createClient({
  socket: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
  }
});

// Normalize phone numbers
function normalizePhoneNumber(phoneNumber) {
  let cleaned = phoneNumber.replace(/[^\d+]/g, '');
  if (!cleaned.startsWith('+')) {
    if (cleaned.length === 10) {
      cleaned = '+1' + cleaned;
    } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
      cleaned = '+' + cleaned;
    }
  }
  return cleaned;
}

// Test users
const testUsers = [
  { phone_number: '+15551234567', display_name: 'John Doe' },
  { phone_number: '+15551234568', display_name: 'Jane Smith' },
  { phone_number: '+15559876543', display_name: 'Bob Johnson' },
];

async function cleanAndLoadPostgreSQL() {
  console.log('🐘 Cleaning and loading PostgreSQL...');
  
  try {
    // Clean ALL data (be very careful in production!)
    console.log('🧹 Cleaning all data...');
    await pool.query('TRUNCATE TABLE call_recordings CASCADE');
    await pool.query('TRUNCATE TABLE call_sessions CASCADE');
    await pool.query('TRUNCATE TABLE user_settings CASCADE');
    await pool.query('TRUNCATE TABLE verification_codes CASCADE');
    await pool.query('TRUNCATE TABLE users CASCADE');
    
    console.log('✅ All tables cleaned');
    
    // Insert fresh test users
    const insertedUsers = [];
    for (const user of testUsers) {
      const result = await pool.query(
        'INSERT INTO users (phone_number, display_name, created_at, updated_at) VALUES ($1, $2, NOW(), NOW()) RETURNING id, phone_number, display_name',
        [user.phone_number, user.display_name]
      );
      insertedUsers.push(result.rows[0]);
      console.log(`✅ Inserted user: ${result.rows[0].display_name} (${result.rows[0].phone_number}) - ID: ${result.rows[0].id}`);
    }
    
    // Add a test call session
    if (insertedUsers.length >= 2) {
      const john = insertedUsers.find(u => u.phone_number === '+15551234567');
      const jane = insertedUsers.find(u => u.phone_number === '+15551234568');
      
      if (john && jane) {
        await pool.query(`
          INSERT INTO call_sessions (
            call_id, from_user_id, to_user_id, to_phone_number,
            call_type, status, start_time, end_time, duration_seconds,
            quality_score, connection_type, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
        `, [
          '750e8400-e29b-41d4-a716-446655440001',
          john.id,
          jane.id,
          '+15551234568',
          'voice',
          'ended',
          new Date(Date.now() - 3600000).toISOString(),
          new Date(Date.now() - 3300000).toISOString(),
          300,
          4,
          'wifi'
        ]);
        
        console.log('✅ Added test call session');
      }
    }
    
    return insertedUsers;
    
  } catch (error) {
    console.error('❌ PostgreSQL error:', error.message);
    throw error;
  }
}

async function cleanAndLoadRedis() {
  console.log('🔴 Cleaning and loading Redis...');
  
  try {
    await redis.connect();
    
    // Clean all verification and call data
    await redis.flushDb();
    console.log('✅ Redis database cleaned');
    
    // Load verification codes
    for (const user of testUsers) {
      const normalizedPhone = normalizePhoneNumber(user.phone_number);
      const verificationData = {
        code: '123456',
        attempts: 0,
        createdAt: Date.now()
      };
      
      await redis.setEx(
        `verification:${normalizedPhone}`,
        600,
        JSON.stringify(verificationData)
      );
      
      console.log(`✅ Code for ${user.phone_number} → ${normalizedPhone} : 123456`);
    }
    
    await redis.disconnect();
    
  } catch (error) {
    console.error('❌ Redis error:', error.message);
    throw error;
  }
}

async function cleanAndLoadMongoDB(insertedUsers) {
  console.log('🍃 Cleaning and loading MongoDB...');
  
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/phoneapp';
    await mongoose.connect(mongoUri);
    
    // Clean all collections
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    
    for (const collection of collections) {
      await db.collection(collection.name).deleteMany({});
      console.log(`✅ Cleaned collection: ${collection.name}`);
    }
    
    // Load test contacts
    const ContactSchema = new mongoose.Schema({
      userId: String,
      phoneNumber: String,
      displayName: String,
      isFavorite: Boolean,
      tags: [String],
      metadata: Object
    }, { timestamps: true });
    
    const Contact = mongoose.model('Contact', ContactSchema);
    
    if (insertedUsers.length >= 2) {
      const john = insertedUsers.find(u => u.phone_number === '+15551234567');
      const jane = insertedUsers.find(u => u.phone_number === '+15551234568');
      
      if (john && jane) {
        const testContacts = [
          {
            userId: john.id,
            phoneNumber: '+15551234568',
            displayName: 'Jane Smith',
            isFavorite: true,
            tags: ['friend'],
            metadata: { callCount: 5, importSource: 'test' }
          },
          {
            userId: jane.id,
            phoneNumber: '+15551234567',
            displayName: 'John Doe',
            isFavorite: true,
            tags: ['colleague'],
            metadata: { callCount: 3, importSource: 'test' }
          }
        ];
        
        await Contact.insertMany(testContacts);
        console.log(`✅ Loaded ${testContacts.length} contacts`);
      }
    }
    
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('❌ MongoDB error:', error.message);
    throw error;
  }
}

async function main() {
  try {
    const insertedUsers = await cleanAndLoadPostgreSQL();
    await cleanAndLoadRedis();
    await cleanAndLoadMongoDB(insertedUsers);
    
    console.log('\n🎉 Clean and fresh test data loaded successfully!');
    console.log('\nFresh test users:');
    insertedUsers.forEach(user => {
      console.log(`  📱 ${user.phone_number} (${user.display_name}) - Code: 123456 - ID: ${user.id}`);
    });
    
  } catch (error) {
    console.error('\n💥 Clean and load failed:', error);
    process.exit(1);
  }
}

main();
EOF

echo "🔄 Running clean and load operation..."
node clean-and-load.js

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Clean and load completed successfully!${NC}"
    echo ""
    
    echo -e "${BLUE}ℹ️ Data loading complete - skipping auth test to avoid rate limiting${NC}"
    echo -e "${YELLOW}Use simple-auth-test.sh or test-api.sh to test authentication${NC}"
    
    echo ""
    echo -e "${GREEN}🎯 Clean test environment is ready!${NC}"
    echo "You can now run your comprehensive API tests."
    echo ""
    echo "Available test users:"
    echo "  📱 +15551234567 (John Doe) - For simple-auth-test.sh"
    echo "  📱 +15551234568 (Jane Smith) - For manual testing"
    echo "  📱 +15559876543 (Bob Johnson) - For comprehensive test-api.sh"
    echo ""
    echo -e "${BLUE}💡 TIP: Each script uses different users to avoid rate limiting!${NC}"
    
else
    echo -e "${RED}❌ Clean and load failed${NC}"
    exit 1
fi

# Cleanup
rm -f clean-and-load.js