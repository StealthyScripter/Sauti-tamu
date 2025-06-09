#!/usr/bin/env node

const { exec } = require('child_process');
const chalk = require('chalk');

const log = (color, message) => console.log(chalk[color](message));

class HealthChecker {
  constructor() {
    this.results = {
      backend: { status: 'unknown', details: {} },
      frontend: { status: 'unknown', details: {} },
      databases: { status: 'unknown', details: {} },
      overall: { status: 'unknown', score: 0 }
    };
  }

  async start() {
    console.log(chalk.blue.bold('🏥 CallingApp Health Check\n'));

    try {
      // Check backend health
      log('cyan', '🖥️  Checking backend health...');
      await this.checkBackend();

      // Check database services
      log('cyan', '🗄️  Checking database services...');
      await this.checkDatabases();

      // Check frontend (if running)
      log('cyan', '📱 Checking frontend...');
      await this.checkFrontend();

      // Calculate overall health
      this.calculateOverallHealth();

      // Display results
      this.displayResults();

    } catch (error) {
      log('red', `❌ Health check failed: ${error.message}`);
      process.exit(1);
    }
  }

  async checkBackend() {
    try {
      // Basic health endpoint
      const healthResponse = await this.execAsync('curl -s http://localhost:3000/health');
      const healthData = JSON.parse(healthResponse);
      
      this.results.backend.status = 'healthy';
      this.results.backend.details.uptime = healthData.uptime;
      this.results.backend.details.timestamp = healthData.timestamp;

      // Services health endpoint
      try {
        const servicesResponse = await this.execAsync('curl -s http://localhost:3000/health/services');
        const servicesData = JSON.parse(servicesResponse);
        this.results.backend.details.services = servicesData.services;
        this.results.backend.details.statistics = servicesData.statistics;
      } catch (error) {
        this.results.backend.details.servicesError = 'Could not fetch services health';
      }

      log('green', '✅ Backend is healthy');

    } catch (error) {
      this.results.backend.status = 'unhealthy';
      this.results.backend.details.error = error.message;
      log('red', '❌ Backend is not responding');
    }
  }

  async checkDatabases() {
    const databases = [
      { name: 'PostgreSQL', port: 5432, command: 'pg_isready -h localhost -p 5432' },
      { name: 'Redis', port: 6379, command: 'redis-cli -h localhost -p 6379 ping' },
      { name: 'MongoDB', port: 27017, command: 'mongosh --host localhost:27017 --eval "db.runCommand(\'ping\')" --quiet' },
      { name: 'ClickHouse', port: 8123, command: 'curl -s http://localhost:8123/ping' }
    ];

    this.results.databases.details = {};

    for (const db of databases) {
      try {
        // Check if port is open
        await this.execAsync(`nc -z localhost ${db.port}`);
        
        // Run specific health check
        if (db.command) {
          await this.execAsync(db.command);
        }

        this.results.databases.details[db.name] = 'healthy';
        log('green', `✅ ${db.name} is healthy`);

      } catch (error) {
        this.results.databases.details[db.name] = 'unhealthy';
        log('red', `❌ ${db.name} is not responding`);
      }
    }

    // Overall database status
    const healthyDbs = Object.values(this.results.databases.details).filter(status => status === 'healthy');
    if (healthyDbs.length === databases.length) {
      this.results.databases.status = 'healthy';
    } else if (healthyDbs.length > 0) {
      this.results.databases.status = 'partial';
    } else {
      this.results.databases.status = 'unhealthy';
    }
  }

  async checkFrontend() {
    try {
      // Check if frontend development server is running
      const frontendResponse = await this.execAsync('curl -s http://localhost:19006');
      
      if (frontendResponse.includes('Expo') || frontendResponse.includes('React')) {
        this.results.frontend.status = 'healthy';
        this.results.frontend.details.server = 'running';
        log('green', '✅ Frontend development server is running');
      } else {
        throw new Error('Unexpected response');
      }

    } catch (error) {
      this.results.frontend.status = 'not_running';
      this.results.frontend.details.error = 'Development server not accessible';
      log('yellow', '⚠️  Frontend development server not running');
    }
  }

  calculateOverallHealth() {
    let score = 0;
    const maxScore = 3;

    // Backend (most important)
    if (this.results.backend.status === 'healthy') score += 1.5;
    
    // Databases (important)
    if (this.results.databases.status === 'healthy') score += 1;
    else if (this.results.databases.status === 'partial') score += 0.5;
    
    // Frontend (less critical for backend-only health)
    if (this.results.frontend.status === 'healthy') score += 0.5;

    this.results.overall.score = score;
    
    if (score >= 2.5) {
      this.results.overall.status = 'healthy';
    } else if (score >= 1.5) {
      this.results.overall.status = 'partial';
    } else {
      this.results.overall.status = 'unhealthy';
    }
  }

  displayResults() {
    console.log('\n' + chalk.blue.bold('📊 Health Check Results'));
    console.log('========================\n');

    // Overall status
    const overallColor = this.results.overall.status === 'healthy' ? 'green' : 
                        this.results.overall.status === 'partial' ? 'yellow' : 'red';
    
    log(overallColor, `🎯 Overall Status: ${this.results.overall.status.toUpperCase()}`);
    log('blue', `📈 Health Score: ${this.results.overall.score}/3.0\n`);

    // Backend details
    console.log(chalk.cyan.bold('🖥️  Backend Service'));
    const backendColor = this.results.backend.status === 'healthy' ? 'green' : 'red';
    log(backendColor, `   Status: ${this.results.backend.status}`);
    
    if (this.results.backend.details.uptime) {
      log('blue', `   Uptime: ${Math.round(this.results.backend.details.uptime)} seconds`);
    }
    
    if (this.results.backend.details.services) {
      console.log('   Services:');
      Object.entries(this.results.backend.details.services).forEach(([service, status]) => {
        const serviceColor = (typeof status === 'boolean' ? status : status.isActive) ? 'green' : 'red';
        const serviceStatus = (typeof status === 'boolean' ? status : status.isActive) ? 'OK' : 'DOWN';
        console.log(chalk[serviceColor](`     ${service}: ${serviceStatus}`));
      });
    }
    console.log();

    // Database details  
    console.log(chalk.cyan.bold('🗄️  Database Services'));
    log(this.getStatusColor(this.results.databases.status), `   Status: ${this.results.databases.status}`);
    Object.entries(this.results.databases.details).forEach(([db, status]) => {
      const color = status === 'healthy' ? 'green' : 'red';
      log(color, `   ${db}: ${status}`);
    });
    console.log();

    // Frontend details
    console.log(chalk.cyan.bold('📱 Frontend Service'));
    const frontendColor = this.results.frontend.status === 'healthy' ? 'green' : 'yellow';
    log(frontendColor, `   Status: ${this.results.frontend.status}`);
    console.log();

    // Recommendations
    this.displayRecommendations();

    // Exit with appropriate code
    if (this.results.overall.status === 'unhealthy') {
      process.exit(1);
    }
  }

  displayRecommendations() {
    console.log(chalk.yellow.bold('💡 Recommendations'));
    
    if (this.results.backend.status !== 'healthy') {
      log('yellow', '   • Start the backend: npm run backend:dev');
    }
    
    if (this.results.databases.status !== 'healthy') {
      log('yellow', '   • Start databases: npm run db:start');
      log('yellow', '   • Check Docker: docker ps');
    }
    
    if (this.results.frontend.status !== 'healthy') {
      log('yellow', '   • Start frontend: npm run frontend:start');
    }

    if (this.results.overall.status === 'healthy') {
      log('green', '   🎉 Everything looks good!');
      log('blue', '   • API: http://localhost:3000');
      log('blue', '   • Frontend: http://localhost:19006');
    }
    
    console.log();
  }

  getStatusColor(status) {
    switch (status) {
      case 'healthy': return 'green';
      case 'partial': return 'yellow';
      case 'unhealthy': return 'red';
      default: return 'gray';
    }
  }

  execAsync(command, options = {}) {
    return new Promise((resolve, reject) => {
      exec(command, { timeout: 10000, ...options }, (error, stdout, stderr) => {
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
  const checker = new HealthChecker();
  checker.start().catch(error => {
    console.error(chalk.red('❌ Health check failed:'), error);
    process.exit(1);
  });
}

module.exports = HealthChecker;