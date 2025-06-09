#!/usr/bin/env node

const { exec } = require('child_process');
const chalk = require('chalk');

const log = (color, message) => console.log(chalk[color](message));

class PrerequisitesChecker {
  async start() {
    log('blue', '📋 Checking CallingApp Prerequisites\n');

    const requirements = [
      {
        name: 'Node.js',
        command: 'node --version',
        minVersion: '18.0.0',
        required: true,
        installUrl: 'https://nodejs.org/'
      },
      {
        name: 'npm',
        command: 'npm --version',
        minVersion: '8.0.0', 
        required: true,
        installUrl: 'https://nodejs.org/'
      },
      {
        name: 'Docker',
        command: 'docker --version',
        required: true,
        installUrl: 'https://docker.com/get-started'
      },
      {
        name: 'Docker Compose',
        command: 'docker-compose --version',
        required: true,
        installUrl: 'https://docs.docker.com/compose/install/'
      },
      {
        name: 'curl',
        command: 'curl --version',
        required: false,
        note: 'Used for API testing'
      },
      {
        name: 'jq',
        command: 'jq --version',
        required: false,
        note: 'Used for JSON parsing in health checks'
      }
    ];

    let allRequiredMet = true;
    const results = [];

    for (const req of requirements) {
      try {
        const output = await this.execAsync(req.command);
        const version = this.extractVersion(output);
        
        let status = 'installed';
        let meetsRequirement = true;

        if (req.minVersion && version) {
          meetsRequirement = this.compareVersions(version, req.minVersion) >= 0;
          status = meetsRequirement ? 'ok' : 'outdated';
        }

        results.push({
          ...req,
          status,
          version,
          meetsRequirement
        });

        const icon = meetsRequirement ? '✅' : req.required ? '❌' : '⚠️';
        const color = meetsRequirement ? 'green' : req.required ? 'red' : 'yellow';
        
        log(color, `${icon} ${req.name}: ${version || 'installed'}`);
        
        if (req.minVersion && !meetsRequirement) {
          log('red', `   Required: ${req.minVersion}+, Found: ${version}`);
          if (req.required) allRequiredMet = false;
        }

      } catch (error) {
        results.push({
          ...req,
          status: 'missing',
          meetsRequirement: false
        });

        const icon = req.required ? '❌' : '⚠️';
        const color = req.required ? 'red' : 'yellow';
        
        log(color, `${icon} ${req.name}: not found`);
        
        if (req.required) {
          allRequiredMet = false;
          log('blue', `   Install from: ${req.installUrl}`);
        } else if (req.note) {
          log('blue', `   Note: ${req.note}`);
        }
      }
    }

    console.log();

    // System information
    this.showSystemInfo();

    // Summary
    if (allRequiredMet) {
      log('green', '🎉 All required prerequisites are met!');
      log('blue', 'You can now run: npm run dev');
    } else {
      log('red', '❌ Some required prerequisites are missing.');
      log('yellow', 'Please install the missing requirements and try again.');
    }

    console.log();
    this.showNextSteps(allRequiredMet);

    return allRequiredMet;
  }

  async showSystemInfo() {
    log('cyan', '💻 System Information:');
    
    try {
      const platform = process.platform;
      const arch = process.arch;
      const nodeVersion = process.version;
      
      log('blue', `   Platform: ${platform} (${arch})`);
      log('blue', `   Node.js: ${nodeVersion}`);
      
      // Available memory
      const totalMem = Math.round(require('os').totalmem() / 1024 / 1024 / 1024);
      log('blue', `   Memory: ${totalMem} GB`);

      // Docker info
      try {
        const dockerInfo = await this.execAsync('docker info --format "{{.ServerVersion}}"');
        log('blue', `   Docker: ${dockerInfo.trim()}`);
      } catch (error) {
        log('yellow', '   Docker: not accessible');
      }

    } catch (error) {
      log('yellow', '   Could not retrieve system information');
    }
    
    console.log();
  }

  showNextSteps(allMet) {
    log('cyan', '📋 Next Steps:');
    
    if (allMet) {
      log('green', '   1. npm run setup     # Full project setup');
      log('green', '   2. npm run dev       # Start development environment');
      log('green', '   3. npm run test      # Load test data and verify');
      log('blue', '\nOptional commands:');
      log('blue', '   • npm run health     # Check system health');
      log('blue', '   • npm run reset      # Reset everything');
    } else {
      log('red', '   1. Install missing prerequisites');
      log('red', '   2. Run this check again: npm run preinstall');
      log('blue', '\nInstallation guides:');
      log('blue', '   • Node.js: https://nodejs.org/');
      log('blue', '   • Docker: https://docs.docker.com/get-docker/');
    }
  }

  extractVersion(output) {
    // Extract version number from command output
    const versionMatch = output.match(/v?(\d+\.\d+\.\d+)/);
    return versionMatch ? versionMatch[1] : null;
  }

  compareVersions(version1, version2) {
    const v1Parts = version1.split('.').map(Number);
    const v2Parts = version2.split('.').map(Number);
    
    for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
      const v1Part = v1Parts[i] || 0;
      const v2Part = v2Parts[i] || 0;
      
      if (v1Part > v2Part) return 1;
      if (v1Part < v2Part) return -1;
    }
    
    return 0;
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
}

// Run if called directly
if (require.main === module) {
  const checker = new PrerequisitesChecker();
  checker.start().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error(chalk.red('❌ Prerequisites check failed:'), error);
    process.exit(1);
  });
}

module.exports = PrerequisitesChecker;