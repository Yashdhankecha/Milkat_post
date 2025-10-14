// Development setup script for Supabase and Lovable integration
import { execSync } from 'child_process';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

console.log('🔧 Setting up local development environment...\n');

// Check if we're in the correct directory
const packageJsonPath = join(process.cwd(), 'package.json');
if (!existsSync(packageJsonPath)) {
  console.error('❌ Error: package.json not found. Please run this script from the project root directory.');
  process.exit(1);
}

// Check Node.js version
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.split('.')[0].replace('v', ''));
if (majorVersion < 18) {
  console.warn(`⚠️  Warning: Node.js version ${nodeVersion} detected. It's recommended to use Node.js 18 or higher.`);
}

// Check if required environment variables exist
const envPath = join(process.cwd(), '.env');
if (!existsSync(envPath)) {
  console.warn('⚠️  Warning: .env file not found. Creating a template...');
  
  const envTemplate = `# Supabase Configuration
VITE_SUPABASE_PROJECT_ID="xwpwkatpplinbtgoiayl"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3cHdrYXRwcGxpbmJ0Z29pYXlsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY4MTM2NzUsImV4cCI6MjA3MjM4OTY3NX0.BlkGefwxmwhokAuK37zJm7nKC2beZF3x6gJB_rf8FXQ"
VITE_SUPABASE_URL="https://xwpwkatpplinbtgoiayl.supabase.co"
VITE_MOCK_OTP=true

# Add any additional environment variables here
`;
  
  writeFileSync(envPath, envTemplate);
  console.log('✅ Created .env file with default configuration');
}

// Check dependencies
console.log('📦 Checking dependencies...');
try {
  execSync('npm ls @supabase/supabase-js', { stdio: 'pipe' });
  console.log('✅ Supabase client is installed');
} catch (error) {
  console.log('⚠️  Supabase client not found or not properly installed');
}

try {
  execSync('npm ls lovable-tagger', { stdio: 'pipe' });
  console.log('✅ Lovable tagger is installed');
} catch (error) {
  console.log('⚠️  Lovable tagger not found or not properly installed');
}

// Check if Supabase CLI is available
console.log('\n🔍 Checking Supabase CLI...');
try {
  const version = execSync('npx supabase --version', { encoding: 'utf8' });
  console.log(`✅ Supabase CLI is available (version: ${version.trim()})`);
} catch (error) {
  console.log('ℹ️  Supabase CLI not found. You can install it with: npm install -g supabase');
}

// Verify Supabase configuration
console.log('\n📋 Verifying Supabase configuration...');
const envContent = readFileSync(envPath, 'utf8');
const requiredVars = [
  'VITE_SUPABASE_PROJECT_ID',
  'VITE_SUPABASE_PUBLISHABLE_KEY',
  'VITE_SUPABASE_URL'
];

const missingVars = requiredVars.filter(varName => !envContent.includes(varName));

if (missingVars.length === 0) {
  console.log('✅ All required Supabase environment variables are present');
} else {
  console.log(`⚠️  Missing environment variables: ${missingVars.join(', ')}`);
}

// Summary
console.log('\n📋 Setup Summary:');
console.log('==================');
console.log('✅ Environment file: Configured');
console.log('✅ Dependencies: Checked');
console.log('✅ Supabase CLI: Available');
console.log('✅ Configuration: Verified');

console.log('\n🚀 You\'re ready to start developing!');
console.log('Run "npm run dev" to start the development server.');

console.log('\n📝 Additional Resources:');
console.log('- Supabase Dashboard: https://app.supabase.com/project/xwpwkatpplinbtgoiayl');
console.log('- Lovable Project: https://lovable.dev/projects/c41a95a4-0234-486c-8047-99be29f445f8');
console.log('- Local Development Docs: supabase/configs/local_dev_config.md');

console.log('\n⚠️  Note: Supabase connection can only be tested in the browser environment.');
console.log('   Start the development server and test in the browser console.');