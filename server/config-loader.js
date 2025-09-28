// Configuration loader that handles environment variables properly
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.join(process.cwd(), '.env') });

// Also try loading from the current directory if the above doesn't work
if (!process.env.MONGODB_URI) {
  dotenv.config();
}

// If still no MONGODB_URI, set it directly for development
if (!process.env.MONGODB_URI) {
  process.env.MONGODB_URI = 'mongodb+srv://ansphd17_db_user:ansharshyash@milkatpost.lzhmmp7.mongodb.net/?retryWrites=true&w=majority&appName=Milkatpost';
  process.env.NODE_ENV = 'development';
}

// Debug: Check if environment variables are loaded
console.log('Environment check:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('MONGODB_URI exists:', !!process.env.MONGODB_URI);
console.log('MONGODB_URI value:', process.env.MONGODB_URI ? 'Set' : 'Not set');
console.log('Working directory:', process.cwd());

const config = {
  // Server Configuration
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 5000,
  HOST: process.env.HOST || 'localhost',

  // Database Configuration
  MONGODB_URI: process.env.MONGODB_URI,
  MONGODB_TEST_URI: process.env.MONGODB_TEST_URI || process.env.MONGODB_URI,

  // JWT Configuration
  JWT_SECRET: process.env.JWT_SECRET || 'your-super-secret-jwt-key-here-make-this-very-long-and-random-change-this-in-production',
  JWT_EXPIRE: process.env.JWT_EXPIRE || '7d',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key-here-also-very-long-and-random-change-this-in-production',
  JWT_REFRESH_EXPIRE: process.env.JWT_REFRESH_EXPIRE || '30d',

  // File Upload Configuration
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || 'your-cloudinary-cloud-name',
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || 'your-cloudinary-api-key',
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || 'your-cloudinary-api-secret',
  MAX_FILE_SIZE: process.env.MAX_FILE_SIZE || 10485760,
  ALLOWED_FILE_TYPES: process.env.ALLOWED_FILE_TYPES || 'image/jpeg,image/png,image/webp,application/pdf',

  // Email Configuration (Optional - for notifications)
  SMTP_HOST: process.env.SMTP_HOST || 'smtp.gmail.com',
  SMTP_PORT: process.env.SMTP_PORT || 587,
  SMTP_USER: process.env.SMTP_USER || 'your-email@gmail.com',
  SMTP_PASS: process.env.SMTP_PASS || 'your-app-password',
  FROM_EMAIL: process.env.FROM_EMAIL || 'noreply@nestlyestate.com',
  FROM_NAME: process.env.FROM_NAME || 'Nestly Estate',

  // SMS Configuration (Twilio)
  TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID || 'your-twilio-account-sid',
  TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN || 'your-twilio-auth-token',
  TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER || 'your-twilio-phone-number',

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,

  // CORS Configuration
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://localhost:3001,http://localhost:3002,http://localhost:3003,http://localhost:5173',

  // Security
  BCRYPT_ROUNDS: parseInt(process.env.BCRYPT_ROUNDS) || 12,
  SESSION_SECRET: process.env.SESSION_SECRET || 'your-session-secret-here-make-this-random-change-this-in-production',

  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  LOG_FILE: process.env.LOG_FILE || 'logs/app.log'
};

// Validate required environment variables
if (!config.MONGODB_URI) {
  console.error('❌ MONGODB_URI environment variable is not set!');
  console.error('Please create a .env file in the server directory with your MongoDB URI');
  process.exit(1);
}

export default config;
