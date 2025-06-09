#!/usr/bin/env node

const { exec, spawn } = require('child_process');
const chalk = require('chalk');
const path = require('path');
const fs = require('fs');
const inquirer = require('inquirer');

const log = (color, message) => console.log(chalk[color](message));

class FullReset {
  constructor() {
    this.force = process.argv.includes('--force');
  }

  async start() {
    console.log(chalk.red.bold('🧹 CallingApp Full Reset\n'));
    
    if (!this.force) {
      const answer = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirm',
          message: 'This will stop all services, remove containers, and clean all data. Continue?',
          default: false
        }
      ]);

      if (!answer.confirm) {
        log('yellow', 'Reset cancelled.');
        return;
      }
    }

    try {
      // Step 1: Stop all running processes
      log('cyan', '🛑 Stopping all running processes...');
      await this.stopAllProcesses();

      // Step 2: Clean up Docker
      log('cyan', '🐳 Cleaning up Docker containers...');
      await this.cleanupDocker();

      // Step 3: Clean up Node.js processes
      log('cyan', '📱 Cleaning up Node.js processes...');
      await this.cleanupNodeProcesses();

      // Step 4: Clean up ports
      log('cyan', '🔌 Freeing up ports...');
      await this.cleanupPorts();

      // Step 5: Clean up cache and temporary files
      log('cyan', '🗑️  Cleaning temporary files...');
      await this.cleanupTempFiles();

      // Step 6: Remove node_modules (optional)
      if (this.force || await this.askToRemoveNodeModules()) {
        log('cyan', '📦 Removing node_modules...');
        await this.removeNodeModules();
      }

      // Step 7: Clean up logs
      log('cyan', '📄 Cleaning log files...');
      await this.cleanupLogs();

      log('green', '\n🎉 Full reset completed successfully!');
      log('blue', '\nTo restart the application:');
      log('blue', '  npm run setup  # Full setup');
      log('blue', '  npm run dev    # Start development');

    } catch (error) {
      log('red', `❌ Reset failed: ${error.message}`);
      process.exit(1);
    }
  }

  async stopAllProcesses() {
    const processes = [
      'node.*phone-app-backend',
      'node.*phone-app-frontend', 
      'expo.*start',
      'nodemon',
      'npx.*expo'
    ];

    for (const processPattern of processes) {
      try {
        await this.execAsync(`pkill -f "${processPattern}"`);
        log('green', `✅ Stopped processes matching: ${processPattern}`);
      } catch (error) {
        // It's OK if no processes are found
        log('yellow', `⚠️  No processes found for: ${processPattern}`);
      }
    }

    // Give processes time to shut down gracefully
    await this.sleep(3000);
  }

  async cleanupDocker() {
    const backendDir = path.join(__dirname, '..', 'phone-app-backend');

    try {
      // Stop Docker Compose services
      await this.execAsync('docker-compose down -v', { cwd: backendDir });
      log('green', '✅ Stopped Docker Compose services');
    } catch (error) {
      log('yellow', '⚠️  No Docker Compose services to stop');
    }

    try {
      // Remove all containers
      const containers = await this.execAsync('docker ps -aq');
      if (containers.trim()) {
        await this.execAsync(`docker rm -f ${containers.trim()}`);
        log('green', '✅ Removed all Docker containers');
      }
    } catch (error) {
      log('yellow', '⚠️  No containers to remove');
    }

    try {
      // Clean up Docker system
      await this.execAsync('docker system prune -af --volumes');
      log('green', '✅ Docker system cleaned');
    } catch (error) {
      log('yellow', '⚠️  Docker system cleanup failed');
    }
  }

  async cleanupNodeProcesses() {
    const nodeProcesses = [
      'postgres',
      'redis-server', 
      'mongod',
      'clickhouse-server'
    ];

    for (const process of nodeProcesses) {
      try {
        await this.execAsync(`pkill -f ${process}`);
        log('green', `✅ Killed ${process} processes`);
      } catch (error) {
        // Process might not be running
      }
    }
  }

  async cleanupPorts() {
    const ports = [3000, 5432, 6379, 27017, 8123, 9000, 19000, 19001, 19002, 19006];

    for (const port of ports) {
      try {
        const result = await this.execAsync(`lsof -ti:${port}`);
        if (result.trim()) {
          await this.execAsync(`kill -9 ${result.trim()}`);
          log('green', `✅ Freed port ${port}`);
        }
      } catch (error) {
        // Port might not be in use
      }
    }
  }

  async cleanupTempFiles() {
    const tempPaths = [
      'phone-app-backend/node_modules/.cache',
      'phone-app-frontend/.expo',
      'phone-app-frontend/dist',
      'phone-app-frontend/web-build',
      '.expo',
      'dist',
      'build'
    ];

    for (const tempPath of tempPaths) {
      const fullPath = path.join(__dirname, '..', tempPath);
      try {
        if (fs.existsSync(fullPath)) {
          await this.execAsync(`rm -rf "${fullPath}"`);
          log('green', `✅ Removed ${tempPath}`);
        }
      } catch (error) {
        log('yellow', `⚠️  Failed to remove ${tempPath}`);
      }
    }

    // Clear Expo cache
    try {
      await this.execAsync('npx expo r -c', { 
        cwd: path.join(__dirname, '..', 'phone-app-frontend') 
      });
      log('green', '✅ Cleared Expo cache');
    } catch (error) {
      log('yellow', '⚠️  Failed to clear Expo cache');
    }
  }

  async askToRemoveNodeModules() {
    const answer = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'removeNodeModules',
        message: 'Remove all node_modules folders? (Will require reinstall)',
        default: false
      }
    ]);
    return answer.removeNodeModules;
  }

  async removeNodeModules() {
    const nodeModulesPaths = [
      'node_modules',
      'phone-app-backend/node_modules',
      'phone-app-frontend/node_modules'
    ];

    for (const nmPath of nodeModulesPaths) {
      const fullPath = path.join(__dirname, '..', nmPath);
      try {
        if (fs.existsSync(fullPath)) {
          await this.execAsync(`rm -rf "${fullPath}"`);
          log('green', `✅ Removed ${nmPath}`);
        }
      } catch (error) {
        log('yellow', `⚠️  Failed to remove ${nmPath}`);
      }
    }

    // Clear npm cache
    try {
      await this.execAsync('npm cache clean --force');
      log('green', '✅ Cleared npm cache');
    } catch (error) {
      log('yellow', '⚠️  Failed to clear npm cache');
    }
  }

  async cleanupLogs() {
    const logPaths = [
      'logs',
      'phone-app-backend/logs',
      'phone-app-frontend/logs'
    ];

    for (const logPath of logPaths) {
      const fullPath = path.join(__dirname, '..', logPath);
      try {
        if (fs.existsSync(fullPath)) {
          await this.execAsync(`rm -rf "${fullPath}"/*.log`);
          log('green', `✅ Cleaned logs in ${logPath}`);
        }
      } catch (error) {
        // Logs might not exist
      }
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
  const reset = new FullReset();
  reset.start().catch(error => {
    console.error(chalk.red('❌ Reset failed:'), error);
    process.exit(1);
  });
}

module.exports = FullReset;