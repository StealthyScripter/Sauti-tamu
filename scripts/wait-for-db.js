#!/usr/bin/env node

const { exec } = require('child_process');
const chalk = require('chalk');

const log = (color, message) => console.log(chalk[color](message));

class DatabaseWaiter {
  async start() {
    console.log(chalk.blue.bold('🗄️  Waiting for databases to be ready...\n'));

    const databases = [
      {
        name: 'PostgreSQL',
        check: () => this.execAsync('docker exec phone-app-backend_postgres_1 pg_isready -U postgres'),
        port: 5432
      },
      {
        name: 'Redis',  
        check: () => this.execAsync('docker exec phone-app-backend_redis_1 redis-cli ping'),
        port: 6379
      },
      {
        name: 'MongoDB',
        check: () => this.execAsync('docker exec phone-app-backend_mongodb_1 mongosh --eval "db.runCommand(\'ping\')" --quiet'),
        port: 27017
      },
      {
        name: 'ClickHouse',
        check: () => this.execAsync('curl -s http://localhost:8123/ping'),
        port: 8123
      }
    ];

    let allReady = false;
    let attempts = 0;
    const maxAttempts = 60; // 2 minutes total

    while (!allReady && attempts < maxAttempts) {
      attempts++;
      log('cyan', `Attempt ${attempts}/${maxAttempts} - Checking database readiness...`);

      const results = [];
      
      for (const db of databases) {
        try {
          await db.check();
          results.push({ name: db.name, ready: true });
          log('green', `✅ ${db.name} is ready`);
        } catch (error) {
          results.push({ name: db.name, ready: false });
          log('yellow', `⏳ ${db.name} not ready yet...`);
        }
      }

      allReady = results.every(r => r.ready);

      if (!allReady) {
        log('blue', 'Waiting 2 seconds before next check...');
        await this.sleep(2000);
      }
    }

    if (allReady) {
      log('green', '\n🎉 All databases are ready!');
      log('blue', 'You can now run migrations: npm run db:migrate');
      return true;
    } else {
      log('red', '\n❌ Some databases failed to become ready');
      log('yellow', 'Try restarting Docker containers: npm run db:stop && npm run db:start');
      return false;
    }
  }

  execAsync(command, options = {}) {
    return new Promise((resolve, reject) => {
      exec(command, { timeout: 5000, ...options }, (error, stdout, stderr) => {
        if (error) {
          reject(error);
        } else {
          resolve(stdout);
        }
      });
    });
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run if called directly
if (require.main === module) {
  const waiter = new DatabaseWaiter();
  waiter.start().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error(chalk.red('❌ Database check failed:'), error);
    process.exit(1);
  });
}

module.exports = DatabaseWaiter;