import mongoose from 'mongoose';
import Contact from '../src/models/Contact.js'; // Fixed import path

// Connect to MongoDB
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/phoneapp';
await mongoose.connect(mongoUri);

// Test Contacts Data
const testContacts = [
  {
    userId: '550e8400-e29b-41d4-a716-446655440001', // Test User 1
    phoneNumber: '+15551234568',
    displayName: 'Demo User',
    isFavorite: true,
    tags: ['friend'],
    metadata: {
      importSource: 'manual',
      callCount: 3
    }
  },
  {
    userId: '550e8400-e29b-41d4-a716-446655440001', // Test User 1
    phoneNumber: '+15559876543',
    displayName: 'Sarah Wilson',
    isFavorite: false,
    tags: ['work'],
    metadata: {
      importSource: 'manual',
      callCount: 1
    }
  },
  {
    userId: '550e8400-e29b-41d4-a716-446655440001', // Test User 1
    phoneNumber: '+15555551234',
    displayName: 'Ahmed Kofi',
    isFavorite: false,
    tags: ['international'],
    metadata: {
      importSource: 'manual',
      callCount: 0
    }
  },
  {
    userId: '550e8400-e29b-41d4-a716-446655440002', // Demo User
    phoneNumber: '+15551234567',
    displayName: 'Test User 1',
    isFavorite: true,
    tags: ['friend'],
    metadata: {
      importSource: 'manual',
      callCount: 2
    }
  }
];

// Insert test contacts
try {
  // Clear existing test contacts
  await Contact.deleteMany({ 
    userId: { $in: ['550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002'] }
  });
  
  // Insert new test contacts
  const inserted = await Contact.insertMany(testContacts);
  console.log(`✅ Inserted ${inserted.length} test contacts`);
  
  // Verify
  const count = await Contact.countDocuments();
  console.log(`📊 Total contacts in database: ${count}`);
  
} catch (error) {
  console.error('❌ Error adding test contacts:', error);
} finally {
  await mongoose.disconnect();
}

/* 
To run this script:
1. Save as phone-app-backend/add-test-contacts.js
2. Run: node add-test-contacts.js
*/