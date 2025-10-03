#!/usr/bin/env node

// Production Deployment Script for Milkat Post
// This script handles the deployment of the application to production

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const CONFIG = {
  appName: 'milkatpost-api',
  nodeVersion: '18',
  logDir: 'logs',
  backupDir: 'backups',
  healthCheckUrl: 'http://localhost:5000/health',
  healthCheckTimeout: 10000,
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Utility functions
function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logStatus(message) {
  log(`✅ ${message}`, colors.green);
}

function logWarning(message) {
  log(`⚠️  ${message}`, colors.yellow);
}

function logError(message) {
  log(`❌ ${message}`, colors.red);
}

function logInfo(message) {
  log(`ℹ️  ${message}`, colors.blue);
}

// Check if command exists
function commandExists(command) {
  try {
    execSync(`which ${command}`, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

// Execute command with error handling
function executeCommand(command, options = {}) {
  try {
    const result = execSync(command, { 
      stdio: options.silent ? 'pipe' : 'inherit',
      encoding: 'utf8',
      ...options 
    });
    return { success: true, output: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Check prerequisites
function checkPrerequisites() {
  logInfo('Checking prerequisites...');
  
  // Check Node.js
  if (!commandExists('node')) {
    logError('Node.js is not installed');
    process.exit(1);
  }
  
  const nodeVersion = executeCommand('node -v', { silent: true });
  if (nodeVersion.success) {
    logStatus(`Node.js version: ${nodeVersion.output.trim()}`);
  }
  
  // Check npm
  if (!commandExists('npm')) {
    logError('npm is not installed');
    process.exit(1);
  }
  
  const npmVersion = executeCommand('npm -v', { silent: true });
  if (npmVersion.success) {
    logStatus(`npm version: ${npmVersion.output.trim()}`);
  }
  
  // Check PM2
  if (!commandExists('pm2')) {
    logWarning('PM2 is not installed. Installing PM2...');
    const installResult = executeCommand('npm install -g pm2');
    if (!installResult.success) {
      logError('Failed to install PM2');
      process.exit(1);
    }
  }
  
  logStatus('Prerequisites check completed');
}

// Create necessary directories
function createDirectories() {
  logInfo('Creating necessary directories...');
  
  const directories = [CONFIG.logDir, CONFIG.backupDir];
  
  directories.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      logStatus(`Created directory: ${dir}`);
    }
  });
}

// Backup current deployment
function createBackup() {
  logInfo('Creating backup of current deployment...');
  
  if (!fs.existsSync('package.json')) {
    logWarning('No package.json found, skipping backup');
    return;
  }
  
  const backupName = `backup-${new Date().toISOString().replace(/[:.]/g, '-')}`;
  const backupPath = path.join(CONFIG.backupDir, `${backupName}.tar.gz`);
  
  // Create backup excluding node_modules, .git, logs, backups
  const excludeFiles = ['node_modules', '.git', CONFIG.logDir, CONFIG.backupDir];
  const excludeArgs = excludeFiles.map(file => `--exclude=${file}`).join(' ');
  
  const backupResult = executeCommand(`tar -czf "${backupPath}" ${excludeArgs} .`);
  
  if (backupResult.success) {
    logStatus(`Backup created: ${backupPath}`);
  } else {
    logWarning(`Backup failed: ${backupResult.error}`);
  }
}

// Install dependencies
function installDependencies() {
  logInfo('Installing dependencies...');
  
  const installResult = executeCommand('npm ci --production');
  
  if (installResult.success) {
    logStatus('Dependencies installed successfully');
  } else {
    logError(`Failed to install dependencies: ${installResult.error}`);
    process.exit(1);
  }
}

// Setup environment variables
function setupEnvironment() {
  logInfo('Setting up environment variables...');
  
  if (!fs.existsSync('.env')) {
    if (fs.existsSync('env.production')) {
      fs.copyFileSync('env.production', '.env');
      logStatus('Copied env.production to .env');
      logWarning('Please update .env file with your production values');
    } else {
      logError('No .env or env.production file found');
      process.exit(1);
    }
  } else {
    logStatus('.env file already exists');
  }
}

// Run database migrations
function runMigrations() {
  logInfo('Running database migrations...');
  
  const migrateResult = executeCommand('npm run migrate');
  
  if (migrateResult.success) {
    logStatus('Database migrations completed');
  } else {
    logWarning(`Database migration failed: ${migrateResult.error}`);
    logWarning('Continuing deployment...');
  }
}

// Stop existing PM2 process
function stopExistingProcess() {
  logInfo('Stopping existing PM2 process...');
  
  // Stop process (ignore errors if not running)
  executeCommand(`pm2 stop ${CONFIG.appName}`, { stdio: 'ignore' });
  
  // Delete process (ignore errors if not exists)
  executeCommand(`pm2 delete ${CONFIG.appName}`, { stdio: 'ignore' });
  
  logStatus('Existing PM2 process stopped');
}

// Start application with PM2
function startApplication() {
  logInfo('Starting application with PM2...');
  
  const startResult = executeCommand(
    `pm2 start server.js --name ${CONFIG.appName} --instances max --exec-mode cluster`
  );
  
  if (startResult.success) {
    logStatus('Application started with PM2');
  } else {
    logError(`Failed to start application: ${startResult.error}`);
    process.exit(1);
  }
  
  // Save PM2 configuration
  const saveResult = executeCommand('pm2 save');
  if (saveResult.success) {
    logStatus('PM2 configuration saved');
  }
}

// Health check
function performHealthCheck() {
  logInfo('Performing health check...');
  
  // Wait for application to start
  logInfo('Waiting for application to start...');
  await new Promise(resolve => setTimeout(resolve, 10000));
  
  try {
    const response = await fetch(CONFIG.healthCheckUrl, {
      method: 'GET',
      timeout: CONFIG.healthCheckTimeout,
    });
    
    if (response.ok) {
      logStatus('Health check passed');
    } else {
      throw new Error(`Health check failed with status: ${response.status}`);
    }
  } catch (error) {
    logError(`Health check failed: ${error.message}`);
    logInfo('Showing PM2 logs...');
    executeCommand(`pm2 logs ${CONFIG.appName} --lines 50`);
    process.exit(1);
  }
}

// Setup log rotation
function setupLogRotation() {
  logInfo('Setting up log rotation...');
  
  const logrotateResult = executeCommand('pm2 install pm2-logrotate');
  
  if (logrotateResult.success) {
    logStatus('Log rotation configured');
  } else {
    logWarning('Failed to setup log rotation');
  }
}

// Show final status
function showFinalStatus() {
  logStatus('Deployment completed successfully!');
  console.log('');
  
  log('📊 Application Status:', colors.green);
  executeCommand(`pm2 status`);
  
  console.log('');
  log('🔗 Useful Commands:', colors.green);
  console.log(`  View logs: pm2 logs ${CONFIG.appName}`);
  console.log(`  Restart: pm2 restart ${CONFIG.appName}`);
  console.log(`  Stop: pm2 stop ${CONFIG.appName}`);
  console.log(`  Monitor: pm2 monit`);
  console.log(`  Health check: curl ${CONFIG.healthCheckUrl}`);
  
  console.log('');
  log('🎉 Milkat Post is now running in production!', colors.green);
}

// Main deployment function
async function deploy() {
  try {
    log('🚀 Starting Milkat Post Production Deployment', colors.green);
    console.log('');
    
    checkPrerequisites();
    createDirectories();
    createBackup();
    installDependencies();
    setupEnvironment();
    runMigrations();
    stopExistingProcess();
    startApplication();
    await performHealthCheck();
    setupLogRotation();
    showFinalStatus();
    
  } catch (error) {
    logError(`Deployment failed: ${error.message}`);
    process.exit(1);
  }
}

// Run deployment if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  deploy();
}

export { deploy };
