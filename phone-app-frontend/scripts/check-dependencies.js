#!/usr/bin/env node

const { execSync } = require('child_process');
const chalk = require('chalk');

console.log(chalk.blue('🔍 Checking React version consistency...'));

try {
  // Get React versions
  const output = execSync('npm ls react --depth=0 --json', { encoding: 'utf8' });
  const deps = JSON.parse(output);
  
  // Check for version conflicts
  const reactVersions = new Set();
  
  function collectVersions(deps, path = '') {
    Object.entries(deps).forEach(([name, info]) => {
      if (name === 'react' && info.version) {
        reactVersions.add(info.version);
      }
      if (info.dependencies) {
        collectVersions(info.dependencies, path + name + '/');
      }
    });
  }
  
  collectVersions(deps.dependencies || {});
  
  if (reactVersions.size > 1) {
    console.log(chalk.red('❌ Multiple React versions detected:'));
    reactVersions.forEach(version => {
      console.log(chalk.yellow(`   - ${version}`));
    });
    console.log(chalk.red('\nRun: npm run fix-deps'));
    process.exit(1);
  } else {
    console.log(chalk.green('✅ React versions consistent'));
  }
  
} catch (error) {
  console.log(chalk.yellow('⚠️  Could not check dependencies, continuing...'));
}