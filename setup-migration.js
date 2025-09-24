#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

console.log('🏠 Nestly Estate Migration Setup');
console.log('================================\n');

// Check if we're in the right directory
if (!fs.existsSync('package.json')) {
  console.error('❌ Error: Please run this script from the project root directory');
  process.exit(1);
}

// Check Node.js version
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);

if (majorVersion < 18) {
  console.error('❌ Error: Node.js version 18 or higher is required');
  console.error(`Current version: ${nodeVersion}`);
  process.exit(1);
}

console.log(`✅ Node.js version: ${nodeVersion}`);

// Create server directory if it doesn't exist
if (!fs.existsSync('server')) {
  console.log('📁 Creating server directory...');
  fs.mkdirSync('server', { recursive: true });
}

// Install server dependencies
console.log('📦 Installing server dependencies...');
try {
  process.chdir('server');
  execSync('npm install', { stdio: 'inherit' });
  process.chdir('..');
  console.log('✅ Server dependencies installed');
} catch (error) {
  console.error('❌ Failed to install server dependencies:', error.message);
  process.exit(1);
}

// Install client dependencies
console.log('📦 Installing client dependencies...');
try {
  process.chdir('client');
  execSync('npm install', { stdio: 'inherit' });
  process.chdir('..');
  console.log('✅ Client dependencies installed');
} catch (error) {
  console.error('❌ Failed to install client dependencies:', error.message);
  process.exit(1);
}

// Create environment files
console.log('⚙️  Setting up environment files...');

// Server .env
const serverEnvPath = 'server/.env';
if (!fs.existsSync(serverEnvPath)) {
  const backendEnvContent = `# Server Configuration
NODE_ENV=development
PORT=5000
HOST=localhost

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/nestly_estate
MONGODB_TEST_URI=mongodb://localhost:27017/nestly_estate_test

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here-change-this-in-production
JWT_EXPIRE=7d
JWT_REFRESH_SECRET=your-super-secret-refresh-key-here-change-this-in-production
JWT_REFRESH_EXPIRE=30d

# File Upload Configuration
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/webp,application/pdf

# Email Configuration (Optional - for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
FROM_EMAIL=noreply@nestlyestate.com
FROM_NAME=Nestly Estate

# SMS Configuration (Twilio)
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=your-twilio-phone-number

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS Configuration
FRONTEND_URL=http://localhost:3000
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

# Security
BCRYPT_ROUNDS=12
SESSION_SECRET=your-session-secret-here

# Logging
LOG_LEVEL=info
LOG_FILE=logs/app.log`;

  fs.writeFileSync(serverEnvPath, backendEnvContent);
  console.log('✅ Created server/.env file');
} else {
  console.log('ℹ️  server/.env already exists');
}

// Client .env.local
const clientEnvPath = 'client/.env.local';
if (!fs.existsSync(clientEnvPath)) {
  const clientEnvContent = `# API Configuration
VITE_API_URL=http://localhost:5000/api

# Development Configuration
VITE_MOCK_OTP=true

# Production Configuration (uncomment for production)
# VITE_MOCK_OTP=false`;

  fs.writeFileSync(clientEnvPath, clientEnvContent);
  console.log('✅ Created client/.env.local file');
} else {
  console.log('ℹ️  client/.env.local already exists');
}

// Create logs directory
const logsDir = 'server/logs';
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
  console.log('✅ Created logs directory');
}

// Create uploads directory
const uploadsDir = 'server/uploads';
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('✅ Created uploads directory');
}

console.log('\n🎉 Setup completed successfully!');
console.log('\n📋 Next steps:');
console.log('1. Configure your environment variables in server/.env');
console.log('2. Set up MongoDB (local or cloud)');
console.log('3. Set up Cloudinary account for file storage');
console.log('4. Set up Twilio account for SMS');
console.log('5. Run the migration script: npm run server:migrate');
console.log('6. Start development: npm run dev');
console.log('\n📖 For detailed instructions, see MIGRATION_GUIDE.md');
console.log('\n🚀 Happy coding!');
