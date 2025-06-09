#!/usr/bin/env node

const { exec } = require('child_process');
const chalk = require('chalk');
const path = require('path');

const log = (color, message) => console.log(chalk[color](message));

class TestDataSetup {
  constructor() {
    this.backendDir = path.join(__dirname, '..', 'phone-app-backend');
  }

  async start() {
    console.log(chalk.blue.bold('🧪 Setting up test data for CallingApp\n'));

    try {
      // Step 1: Ensure backend is running
      log('cyan', '🔍 Checking backend status...');
      await this.checkBackend();

      // Step 2: Run database migrations
      log('cyan', '🗃️  Running database migrations...');
      await this.runMigrations();

      // Step 3: Add test contacts
      log('cyan', '👥 Adding test contacts...');
      await this.addTestContacts();

      // Step 4: Test API endpoints
      log('cyan', '🧪 Testing API endpoints...');
      await this.testApiEndpoints();

      // Step 5: Show test data summary
      log('cyan', '📊 Showing test data summary...');
      await this.showTestDataSummary();

      log('green', '\n🎉 Test data setup completed successfully!');
      log('blue', '\nTest users available:');
      log('blue', '  • +15551234567 (John Doe)');
      log('blue', '  • +15551234568 (Jane Smith)');
      log('blue', '  • +1234567890 (Test User)');
      log('yellow', '\nUse verification code "123456" for demo users in development');

    } catch (error) {
      log('red', `❌ Test data setup failed: ${error.message}`);
      process.exit(1);
    }
  }

  async checkBackend() {
    try {
      const response = await this.execAsync('curl -f http://localhost:3000/health');
      const healthData = JSON.parse(response);
      log('green', `✅ Backend is running (uptime: ${Math.round(healthData.uptime)}s)`);
    } catch (error) {
      throw new Error('Backend is not running. Please start with: npm run backend:dev');
    }
  }

  async runMigrations() {
    try {
      await this.execAsync('npm run migrate', { cwd: this.backendDir });
      log('green', '✅ Database migrations completed');
    } catch (error) {
      log('yellow', '⚠️  Migration warnings (continuing...)');
      // Don't fail on migration warnings
    }
  }

  async addTestContacts() {
    try {
      await this.execAsync('node scripts/add-test-contacts.js', { cwd: this.backendDir });
      log('green', '✅ Test contacts added');
    } catch (error) {
      log('yellow', '⚠️  Test contacts may already exist or MongoDB not available');
    }
  }

  async testApiEndpoints() {
    const tests = [
      {
        name: 'Health Check',
        command: 'curl -f http://localhost:3000/health',
        expectJson: true
      },
      {
        name: 'Services Health',
        command: 'curl -f http://localhost:3000/health/services',
        expectJson: true
      },
      {
        name: 'Auth Test Endpoint',
        command: 'curl -f http://localhost:3000/api/auth/test',
        expectJson: true
      }
    ];

    for (const test of tests) {
      try {
        const response = await this.execAsync(test.command);
        
        if (test.expectJson) {
          JSON.parse(response); // Validate JSON
        }
        
        log('green', `✅ ${test.name} - OK`);
      } catch (error) {
        log('red', `❌ ${test.name} - Failed`);
        throw new Error(`API test failed: ${test.name}`);
      }
    }
  }

  async showTestDataSummary() {
    try {
      // Try to get demo users from backend
      const demoUsers = [
        { phone: '+15551234567', name: 'John Doe' },
        { phone: '+15551234568', name: 'Jane Smith' },
        { phone: '+1234567890', name: 'Test User' }
      ];

      console.log(chalk.cyan.bold('\n📋 Available Test Data:'));
      console.log('========================');
      
      console.log(chalk.yellow.bold('\n👥 Demo Users:'));
      demoUsers.forEach((user, index) => {
        log('blue', `   ${index + 1}. ${user.name} (${user.phone})`);
      });

      console.log(chalk.yellow.bold('\n🔐 Authentication:'));
      log('blue', '   • Use any demo phone number above');
      log('blue', '   • Verification code: 123456 (development mode)');
      log('blue', '   • Codes are logged in backend console');

      console.log(chalk.yellow.bold('\n📞 Test Call Flow:'));
      log('blue', '   1. Login with demo phone number');
      log('blue', '   2. Add contacts or call demo numbers');
      log('blue', '   3. Check call history and analytics');

      console.log(chalk.yellow.bold('\n🌐 API Endpoints:'));
      log('blue', '   • Health: http://localhost:3000/health');
      log('blue', '   • Services: http://localhost:3000/health/services');
      log('blue', '   • Auth: http://localhost:3000/api/auth/*');
      log('blue', '   • Calls: http://localhost:3000/api/calls/*');
      log('blue', '   • Contacts: http://localhost:3000/api/contacts');

    } catch (error) {
      log('yellow', '⚠️  Could not retrieve detailed test data summary');
    }
  }

  execAsync(command, options = {}) {
    return new Promise((resolve, reject) => {
      exec(command, { timeout: 30000, ...options }, (error, stdout, stderr) => {
        if (error) {
          reject(error);
        } else {
          resolve(stdout);
        }
      });
    });
  }
}

// Run if called directly
if (require.main === module) {
  const setup = new TestDataSetup();
  setup.start().catch(error => {
    console.error(chalk.red('❌ Test data setup failed:'), error);
    process.exit(1);
  });
}

module.exports = TestDataSetup;