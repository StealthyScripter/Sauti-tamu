import dotenv from 'dotenv';
import admin from 'firebase-admin';
import fetch from 'node-fetch';

dotenv.config();

async function testFirebaseSetup() {
  console.log('🧪 Testing Firebase Setup...\n');
  
  // Test 1: Check environment variables
  console.log('1. Checking environment variables:');
  const webApiKey = process.env.FIREBASE_WEB_API_KEY;
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  
  console.log(`   Web API Key: ${webApiKey ? '✅ Present' : '❌ Missing'}`);
  console.log(`   Project ID: ${projectId ? '✅ Present' : '❌ Missing'}`);
  console.log(`   Client Email: ${clientEmail ? '✅ Present' : '❌ Missing'}`);
  console.log(`   Private Key: ${privateKey ? '✅ Present' : '❌ Missing'}`);
  
  if (!webApiKey || !projectId || !clientEmail || !privateKey) {
    console.log('\n❌ Missing Firebase credentials. Check your .env file');
    return;
  }
  
  // Test 2: Initialize Firebase Admin
  console.log('\n2. Testing Firebase Admin initialization:');
  try {
    if (!admin.apps.length) {
      const firebaseConfig = {
        projectId: projectId,
        clientEmail: clientEmail,
        privateKey: privateKey.replace(/\\n/g, '\n')
      };

      admin.initializeApp({
        credential: admin.credential.cert(firebaseConfig)
      });
    }
    
    // Test admin connection by listing users (just first 1)
    await admin.auth().listUsers(1);
    console.log('   ✅ Firebase Admin SDK connected successfully');
  } catch (error) {
    console.log('   ❌ Firebase Admin SDK failed:', error.message);
    return;
  }
  
  // Test 3: Test Firebase Identity API
  console.log('\n3. Testing Firebase Identity API access:');
  try {
    const testUrl = `https://identitytoolkit.googleapis.com/v1/projects/${projectId}?key=${webApiKey}`;
    const response = await fetch(testUrl);
    
    if (response.ok) {
      console.log('   ✅ Firebase Identity API accessible');
    } else {
      console.log('   ❌ Firebase Identity API failed:', response.status, response.statusText);
    }
  } catch (error) {
    console.log('   ❌ Firebase Identity API error:', error.message);
  }
  
  // Test 4: Test phone auth endpoint (without actually sending SMS)
  console.log('\n4. Testing phone auth configuration:');
  try {
    const authUrl = `https://identitytoolkit.googleapis.com/v1/accounts:sendVerificationCode?key=${webApiKey}`;
    const response = await fetch(authUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        phoneNumber: '+1234567890', // Test number that will fail
        recaptchaToken: 'test'
      })
    });
    
    const data = await response.json();
    
    // We expect this to fail with a specific error about phone auth being enabled
    if (data.error && data.error.message) {
      if (data.error.message.includes('CAPTCHA_CHECK_FAILED') || 
          data.error.message.includes('INVALID_PHONE_NUMBER')) {
        console.log('   ✅ Phone authentication is properly configured');
      } else {
        console.log('   ⚠️ Unexpected error:', data.error.message);
      }
    } else {
      console.log('   ⚠️ Unexpected response:', data);
    }
  } catch (error) {
    console.log('   ❌ Phone auth test failed:', error.message);
  }
  
  console.log('\n🎉 Firebase setup test complete!');
  console.log('\nNext steps:');
  console.log('1. Make sure phone authentication is enabled in Firebase Console');
  console.log('2. Add your real phone number to test numbers in Firebase Console');
  console.log('3. Restart your backend server');
}

testFirebaseSetup().catch(console.error);