#!/usr/bin/env node

const { spawn, exec } = require('child_process');
const chalk = require('chalk');
const path = require('path');

const log = (color, message) => console.log(chalk[color](message));

class DevelopmentStarter {
  constructor() {
    this.processes = [];
    this.isShuttingDown = false;
  }

  async start() {
    console.log(chalk.blue.bold('🚀 Starting CallingApp Development Environment\n'));

    try {
      // Step 1: Check prerequisites
      log('cyan', '📋 Checking prerequisites...');
      await this.checkPrerequisites();

      // Step 2: Start databases
      log('cyan', '🗄️  Starting database services...');
      await this.startDatabases();

      // Step 3: Install dependencies
      log('cyan', '📦 Installing dependencies...');
      await this.installDependencies();

      // Step 4: Run migrations
      log('cyan', '🗃️  Running database migrations...');
      await this.runMigrations();

      // Step 5: Start backend
      log('cyan', '🖥️  Starting backend server...');
      await this.startBackend();

      // Step 6: Wait for backend health
      log('cyan', '⏳ Waiting for backend to be ready...');
      await this.waitForBackend();

      // Step 7: Start frontend
      log('cyan', '📱 Starting frontend application...');
      await this.startFrontend();

      log('green', '\n🎉 Development environment started successfully!');
      log('blue', '📊 Backend API: http://localhost:3000');
      log('blue', '🔍 Health Check: http://localhost:3000/health');
      log('blue', '📱 Frontend: Use QR code or http://localhost:19006');
      log('yellow', '\nPress Ctrl+C to stop all services');

      // Handle graceful shutdown
      this.setupGracefulShutdown();

    } catch (error) {
      log('red', `❌ Setup failed: ${error.message}`);
      await this.cleanup();
      process.exit(1);
    }
  }

  async checkPrerequisites() {
    const requirements = [
      { command: 'node --version', name: 'Node.js' },
      { command: 'npm --version', name: 'npm' },
      { command: 'docker --version', name: 'Docker' },
      { command: 'docker-compose --version', name: 'Docker Compose' }
    ];

    for (const req of requirements) {
      try {
        await this.execAsync(req.command);
        log('green', `✅ ${req.name} is installed`);
      } catch (error) {
        throw new Error(`${req.name} is not installed or not in PATH`);
      }
    }
  }

  async startDatabases() {
    const backendDir = path.join(__dirname, '..', 'phone-app-backend');
    await this.execAsync('docker-compose up -d', { cwd: backendDir });
    
    // Wait for databases to be ready
    log('yellow', '   Waiting for databases to initialize...');
    await this.sleep(15000); // 15 seconds

    // Check database health
    try {
      await this.execAsync('docker-compose ps', { cwd: backendDir });
      log('green', '✅ Database services are running');
    } catch (error) {
      throw new Error('Database services failed to start');
    }
  }

  async installDependencies() {
    const backendDir = path.join(__dirname, '..', 'phone-app-backend');
    const frontendDir = path.join(__dirname, '..', 'phone-app-frontend');

    // Install backend dependencies
    if (!require('fs').existsSync(path.join(backendDir, 'node_modules'))) {
      log('yellow', '   Installing backend dependencies...');
      await this.execAsync('npm install', { cwd: backendDir });
    } else {
      log('green', '✅ Backend dependencies already installed');
    }

    // Install frontend dependencies
    if (!require('fs').existsSync(path.join(frontendDir, 'node_modules'))) {
      log('yellow', '   Installing frontend dependencies...');
      await this.execAsync('npm install', { cwd: frontendDir });
    } else {
      log('green', '✅ Frontend dependencies already installed');
    }
  }

  async runMigrations() {
    const backendDir = path.join(__dirname, '..', 'phone-app-backend');
    try {
      await this.execAsync('npm run migrate', { cwd: backendDir });
      log('green', '✅ Database migrations completed');
    } catch (error) {
      log('yellow', '⚠️  Migration failed, continuing anyway...');
    }
  }

  async startBackend() {
    const backendDir = path.join(__dirname, '..', 'phone-app-backend');
    
    const backendProcess = spawn('npm', ['run', 'dev'], {
      cwd: backendDir,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    this.processes.push({ name: 'backend', process: backendProcess });

    backendProcess.stdout.on('data', (data) => {
      const output = data.toString().trim();
      if (output) {
        console.log(chalk.blue('[Backend]'), output);
      }
    });

    backendProcess.stderr.on('data', (data) => {
      const output = data.toString().trim();
      if (output) {
        console.log(chalk.red('[Backend Error]'), output);
      }
    });

    backendProcess.on('close', (code) => {
      if (!this.isShuttingDown) {
        log('red', `❌ Backend process exited with code ${code}`);
      }
    });

    // Give backend time to start
    await this.sleep(5000);
  }

  async waitForBackend() {
    const maxAttempts = 30;
    let attempts = 0;

    while (attempts < maxAttempts) {
      try {
        await this.execAsync('curl -f http://localhost:3000/health');
        log('green', '✅ Backend is ready');
        return;
      } catch (error) {
        attempts++;
        log('yellow', `   Attempt ${attempts}/${maxAttempts} - waiting for backend...`);
        await this.sleep(2000);
      }
    }

    throw new Error('Backend failed to start within timeout');
  }

  async startFrontend() {
    const frontendDir = path.join(__dirname, '..', 'phone-app-frontend');
    
    const frontendProcess = spawn('npx', ['expo', 'start', '--clear'], {
      cwd: frontendDir,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    this.processes.push({ name: 'frontend', process: frontendProcess });

    frontendProcess.stdout.on('data', (data) => {
      const output = data.toString().trim();
      if (output) {
        console.log(chalk.green('[Frontend]'), output);
      }
    });

    frontendProcess.stderr.on('data', (data) => {
      const output = data.toString().trim();
      if (output) {
        console.log(chalk.yellow('[Frontend Info]'), output);
      }
    });

    frontendProcess.on('close', (code) => {
      if (!this.isShuttingDown) {
        log('red', `❌ Frontend process exited with code ${code}`);
      }
    });

    // Give frontend time to start
    await this.sleep(3000);
    log('green', '✅ Frontend started');
  }

  setupGracefulShutdown() {
    process.on('SIGINT', async () => {
      log('yellow', '\n🧹 Shutting down gracefully...');
      this.isShuttingDown = true;
      await this.cleanup();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      log('yellow', '\n🧹 Shutting down gracefully...');
      this.isShuttingDown = true;
      await this.cleanup();
      process.exit(0);
    });
  }

  async cleanup() {
    // Kill all spawned processes
    for (const proc of this.processes) {
      try {
        log('yellow', `🔄 Stopping ${proc.name}...`);
        proc.process.kill('SIGTERM');
        
        // Force kill after 5 seconds if not stopped
        setTimeout(() => {
          if (!proc.process.killed) {
            proc.process.kill('SIGKILL');
          }
        }, 5000);
      } catch (error) {
        // Ignore errors during cleanup
      }
    }

    // Stop Docker containers
    try {
      const backendDir = path.join(__dirname, '..', 'phone-app-backend');
      await this.execAsync('docker-compose down', { cwd: backendDir });
      log('green', '✅ Database services stopped');
    } catch (error) {
      log('yellow', '⚠️  Failed to stop database services');
    }
  }

  execAsync(command, options = {}) {
    return new Promise((resolve, reject) => {
      exec(command, options, (error, stdout, stderr) => {
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
  const starter = new DevelopmentStarter();
  starter.start().catch(error => {
    console.error(chalk.red('❌ Failed to start development environment:'), error);
    process.exit(1);
  });
}

module.exports = DevelopmentStarter;