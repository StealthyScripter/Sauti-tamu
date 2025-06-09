#!/usr/bin/env node

const { exec } = require('child_process');
const chalk = require('chalk');
const path = require('path');

const log = (color, message) => console.log(chalk[color](message));

class ServiceStopper {
  async start() {
    console.log(chalk.yellow.bold('🛑 Stopping CallingApp Services\n'));

    try {
      // Step 1: Stop Node.js processes
      log('cyan', '📱 Stopping Node.js processes...');
      await this.stopNodeProcesses();

      // Step 2: Stop frontend processes
      log('cyan', '🖥️  Stopping frontend processes...');
      await this.stopFrontendProcesses();

      // Step 3: Stop Docker containers
      log('cyan', '🐳 Stopping Docker containers...');
      await this.stopDockerContainers();

      // Step 4: Free up ports
      log('cyan', '🔌 Freeing up ports...');
      await this.freeUpPorts();

      log('green', '\n✅ All services stopped successfully!');
      log('blue', '\nTo restart:');
      log('blue', '  npm run dev    # Development mode');
      log('blue', '  npm run start  # Production mode');

    } catch (error) {
      log('red', `❌ Failed to stop some services: ${error.message}`);
      log('yellow', 'Some services may still be running');
    }
  }

  async stopNodeProcesses() {
    const nodeProcesses = [
      'node.*phone-app-backend',
      'node.*phone-app-frontend',
      'nodemon.*phone-app',
      'npm.*run.*dev'
    ];

    let stoppedCount = 0;
    
    for (const processPattern of nodeProcesses) {
      try {
        const result = await this.execAsync(`pgrep -f "${processPattern}"`);
        if (result.trim()) {
          await this.execAsync(`pkill -TERM -f "${processPattern}"`);
          stoppedCount++;
          log('green', `✅ Stopped: ${processPattern}`);
          
          // Wait a bit for graceful shutdown
          await this.sleep(1000);
          
          // Force kill if still running
          try {
            await this.execAsync(`pkill -KILL -f "${processPattern}"`);
          } catch (error) {
            // Already stopped, that's fine
          }
        }
      } catch (error) {
        // No processes found, that's fine
      }
    }

    if (stoppedCount === 0) {
      log('green', '✅ No Node.js processes were running');
    }
  }

  async stopFrontendProcesses() {
    const frontendProcesses = [
      'expo.*start',
      'metro.*',
      'react-native.*',
      'npx.*expo'
    ];

    let stoppedCount = 0;

    for (const processPattern of frontendProcesses) {
      try {
        const result = await this.execAsync(`pgrep -f "${processPattern}"`);
        if (result.trim()) {
          await this.execAsync(`pkill -TERM -f "${processPattern}"`);
          stoppedCount++;
          log('green', `✅ Stopped: ${processPattern}`);
          
          // Wait for graceful shutdown
          await this.sleep(1000);
          
          // Force kill if needed
          try {
            await this.execAsync(`pkill -KILL -f "${processPattern}"`);
          } catch (error) {
            // Already stopped
          }
        }
      } catch (error) {
        // No processes found
      }
    }

    if (stoppedCount === 0) {
      log('green', '✅ No frontend processes were running');
    }
  }

  async stopDockerContainers() {
    const backendDir = path.join(__dirname, '..', 'phone-app-backend');

    try {
      // Check if docker-compose.yml exists
      const fs = require('fs');
      const dockerComposePath = path.join(backendDir, 'docker-compose.yml');
      
      if (fs.existsSync(dockerComposePath)) {
        await this.execAsync('docker-compose down', { cwd: backendDir });
        log('green', '✅ Docker Compose services stopped');
      } else {
        log('yellow', '⚠️  No docker-compose.yml found');
      }
    } catch (error) {
      log('yellow', '⚠️  Failed to stop Docker Compose services');
    }

    // Also try to stop any running containers
    try {
      const containers = await this.execAsync('docker ps -q');
      if (containers.trim()) {
        await this.execAsync(`docker stop ${containers.trim()}`);
        log('green', '✅ Additional containers stopped');
      }
    } catch (error) {
      // No containers running
    }
  }

  async freeUpPorts() {
    const ports = [3000, 5432, 6379, 27017, 8123, 9000, 19000, 19001, 19002, 19006];
    let freedCount = 0;

    for (const port of ports) {
      try {
        const result = await this.execAsync(`lsof -ti:${port}`);
        if (result.trim()) {
          const pids = result.trim().split('\n');
          for (const pid of pids) {
            try {
              // Try graceful termination first
              await this.execAsync(`kill -TERM ${pid}`);
              await this.sleep(500);
              
              // Force kill if still running
              await this.execAsync(`kill -KILL ${pid}`);
              freedCount++;
            } catch (error) {
              // Process may have already exited
            }
          }
          log('green', `✅ Freed port ${port}`);
        }
      } catch (error) {
        // Port not in use or lsof failed
      }
    }

    if (freedCount === 0) {
      log('green', '✅ All ports were already free');
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

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run if called directly
if (require.main === module) {
  const stopper = new ServiceStopper();
  stopper.start().catch(error => {
    console.error(chalk.red('❌ Failed to stop services:'), error);
    process.exit(1);
  });
}

module.exports = ServiceStopper;