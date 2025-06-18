#!/usr/bin/env node

const { execSync } = require('child_process');
const chalk = require('chalk');

console.log(chalk.blue('🔧 Fixing React version conflicts...'));

try {
  // Remove conflicting packages
  console.log('1. Removing node_modules and lock file...');
  execSync('rm -rf node_modules package-lock.json', { stdio: 'inherit' });
  
  // Install exact versions
  console.log('2. Installing exact React versions...');
  execSync('npm install --save-exact react@19.1.0 react-dom@19.1.0', { stdio: 'inherit' });
  
  // Fresh install
  console.log('3. Fresh install...');
  execSync('npm install', { stdio: 'inherit' });
  
  // Clear Expo cache
  console.log('4. Clearing Expo cache...');
  execSync('npx expo r -c', { stdio: 'inherit' });
  
  console.log(chalk.green('✅ Dependencies fixed!'));
  
} catch (error) {
  console.log(chalk.red('❌ Fix failed:', error.message));
  process.exit(1);
}