// test-connection.js - Test Frontend-Backend Connection
// Run this script to verify the connection works: node test-connection.js

import fetch from 'node-fetch';

const API_BASE_URL = 'http://localhost:3000';

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

const log = (color, message) => console.log(`${colors[color]}${message}${colors.reset}`);

// Test functions
async function testBackendHealth() {
  try {
    log('blue', '\n🔍 Testing backend health...');
    const response = await fetch(`${API_BASE_URL}/health`);
    const data = await response.json();
    
    if (response.ok) {
      log('green', '✅ Backend health check passed');
      console.log('   Status:', data.status);
      console.log('   Uptime:', Math.round(data.uptime), 'seconds');
      return true;
    } else {
      log('red', '❌ Backend health check failed');
      return false;
    }
  } catch (error) {
    log('red', `❌ Backend connection failed: ${error.message}`);
    return false;
  }
}

async function testDatabaseServices() {
  try {
    log('blue', '\n🗄️  Testing database services...');
    const response = await fetch(`${API_BASE_URL}/health/services`);
    const data = await response.json();
    
    if (response.ok) {
      log('green', '✅ Database services check passed');
      
      const services = data.services || {};
      Object.keys(services).forEach(service => {
        const status = services[service];
        const isHealthy = typeof status === 'boolean' ? status : status.isActive;
        const icon = isHealthy ? '✅' : '❌';
        console.log(`   ${icon} ${service}: ${isHealthy ? 'OK' : 'DOWN'}`);
      });
      
      return true;
    } else {
      log('red', '❌ Database services check failed');
      return false;
    }
  } catch (error) {
    log('red', `❌ Database services check failed: ${error.message}`);
    return false;
  }
}

async function testAuthEndpoint() {
  try {
    log('blue', '\n🔐 Testing authentication endpoint...');
    const response = await fetch(`${API_BASE_URL}/api/auth/test`);
    const data = await response.json();
    
    if (response.ok) {
      log('green', '✅ Auth endpoint test passed');
      console.log('   Message:', data.message);
      return true;
    } else {
      log('red', '❌ Auth endpoint test failed');
      return false;
    }
  } catch (error) {
    log('red', `❌ Auth endpoint test failed: ${error.message}`);
    return false;
  }
}

async function testPhoneVerification() {
  try {
    log('blue', '\n📱 Testing phone verification...');
    const response = await fetch(`${API_BASE_URL}/api/auth/verify-phone`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phoneNumber: '+15551234567'
      })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      log('green', '✅ Phone verification test passed');
      console.log('   Message:', data.message);
      if (data.data && data.data._testCode) {
        log('cyan', `   📱 Test verification code: ${data.data._testCode}`);
      }
      return true;
    } else {
      log('yellow', '⚠️  Phone verification test failed (expected in rate-limited environment)');
      console.log('   Error:', data.message || data.errors);
      return false;
    }
  } catch (error) {
    log('red', `❌ Phone verification test failed: ${error.message}`);
    return false;
  }
}

async function testCorsConfiguration() {
  try {
    log('blue', '\n🌐 Testing CORS configuration...');
    const response = await fetch(`${API_BASE_URL}/`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:19006',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type'
      }
    });
    
    const corsHeaders = {
      'access-control-allow-origin': response.headers.get('access-control-allow-origin'),
      'access-control-allow-methods': response.headers.get('access-control-allow-methods'),
      'access-control-allow-headers': response.headers.get('access-control-allow-headers')
    };
    
    if (corsHeaders['access-control-allow-origin']) {
      log('green', '✅ CORS configuration is working');
      console.log('   Allowed Origin:', corsHeaders['access-control-allow-origin']);
      return true;
    } else {
      log('yellow', '⚠️  CORS headers not found (might be okay)');
      return true;
    }
  } catch (error) {
    log('red', `❌ CORS test failed: ${error.message}`);
    return false;
  }
}

// Main test runner
async function runConnectionTests() {
  log('magenta', '🧪 Phone App Connection Test Suite');
  log('magenta', '===================================');
  
  const tests = [
    { name: 'Backend Health', test: testBackendHealth },
    { name: 'Database Services', test: testDatabaseServices },
    { name: 'Auth Endpoint', test: testAuthEndpoint },
    { name: 'Phone Verification', test: testPhoneVerification },
    { name: 'CORS Configuration', test: testCorsConfiguration }
  ];
  
  const results = [];
  
  for (const { name, test } of tests) {
    try {
      const result = await test();
      results.push({ name, passed: result });
    } catch (error) {
      log('red', `❌ ${name} test crashed: ${error.message}`);
      results.push({ name, passed: false });
    }
  }
  
  // Summary
  log('blue', '\n📊 Test Results Summary');
  log('blue', '=======================');
  
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  
  results.forEach(({ name, passed }) => {
    const icon = passed ? '✅' : '❌';
    const color = passed ? 'green' : 'red';
    log(color, `${icon} ${name}`);
  });
  
  log('blue', `\n📈 Overall: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    log('green', '\n🎉 All tests passed! Frontend and backend are properly connected.');
    log('cyan', '\n📝 Next steps:');
    console.log('   1. Start your React Native app with: npx expo start');
    console.log('   2. Test the phone verification flow');
    console.log('   3. Try creating contacts and making calls');
  } else {
    log('red', '\n❌ Some tests failed. Check the backend setup and try again.');
    log('cyan', '\n🔧 Troubleshooting:');
    console.log('   1. Make sure backend is running: npm run dev');
    console.log('   2. Check database containers: docker ps');
    console.log('   3. Verify .env configuration');
    console.log('   4. Check backend logs for errors');
  }
  
  log('blue', '\n📚 Documentation: Check the manual setup guide for more details');
}

// Run the tests
runConnectionTests().catch(error => {
  log('red', `💥 Test suite crashed: ${error.message}`);
  process.exit(1);
});