# Production Deployment Script for Milkat Post (Windows)
# This script handles the deployment of the application to production

param(
    [string]$Environment = "production",
    [switch]$SkipTests = $false,
    [switch]$SkipBackup = $false
)

# Configuration
$AppName = "milkatpost"
$NodeVersion = "18"
$LogDir = "logs"
$BackupDir = "backups"

Write-Host "🚀 Starting Milkat Post Production Deployment" -ForegroundColor Green

# Function to print status
function Write-Status {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "⚠️  $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

# Check Node.js version
try {
    $nodeVersion = node -v
    Write-Status "Node.js version check passed: $nodeVersion"
} catch {
    Write-Error "Node.js is not installed or not in PATH"
    exit 1
}

# Check npm
try {
    $npmVersion = npm -v
    Write-Status "npm version check passed: $npmVersion"
} catch {
    Write-Error "npm is not installed or not in PATH"
    exit 1
}

# Create necessary directories
Write-Status "Creating necessary directories..."
New-Item -ItemType Directory -Force -Path $LogDir | Out-Null
New-Item -ItemType Directory -Force -Path $BackupDir | Out-Null

# Backup current deployment
if (-not $SkipBackup) {
    if (Test-Path "package.json") {
        Write-Status "Creating backup of current deployment..."
        $backupName = "backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
        $backupPath = "$BackupDir\$backupName.zip"
        
        # Create backup excluding node_modules and .git
        $filesToBackup = Get-ChildItem -Path . -Exclude node_modules, .git, logs, backups
        Compress-Archive -Path $filesToBackup -DestinationPath $backupPath -Force
        Write-Status "Backup created: $backupPath"
    }
}

# Install dependencies
Write-Status "Installing dependencies..."
npm ci --production

if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to install dependencies"
    exit 1
}

# Run tests (if not skipped)
if (-not $SkipTests) {
    Write-Status "Running tests..."
    npm test
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Tests failed"
        exit 1
    }
}

# Set up environment variables
Write-Status "Setting up environment variables..."
if (-not (Test-Path ".env")) {
    if (Test-Path "env.production") {
        Copy-Item "env.production" ".env"
        Write-Warning "Please update .env file with your production values"
    } else {
        Write-Error "No .env or env.production file found"
        exit 1
    }
}

# Run database migrations
Write-Status "Running database migrations..."
npm run migrate

if ($LASTEXITCODE -ne 0) {
    Write-Warning "Database migration failed, but continuing..."
}

# Check if PM2 is installed
try {
    pm2 -v | Out-Null
    Write-Status "PM2 is available"
} catch {
    Write-Warning "PM2 is not installed. Installing PM2..."
    npm install -g pm2
}

# Stop existing PM2 process
Write-Status "Stopping existing PM2 process..."
pm2 stop $AppName 2>$null
pm2 delete $AppName 2>$null

# Start the application with PM2
Write-Status "Starting application with PM2..."
pm2 start server.js --name $AppName --instances max --exec-mode cluster

# Save PM2 configuration
pm2 save

# Health check
Write-Status "Performing health check..."
Start-Sleep -Seconds 10

try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/health" -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Status "Health check passed"
    } else {
        throw "Health check failed with status: $($response.StatusCode)"
    }
} catch {
    Write-Error "Health check failed: $_"
    Write-Status "Showing PM2 logs..."
    pm2 logs $AppName --lines 50
    exit 1
}

# Setup log rotation
Write-Status "Setting up log rotation..."
pm2 install pm2-logrotate

# Final status
Write-Status "Deployment completed successfully!"
Write-Host ""
Write-Host "📊 Application Status:" -ForegroundColor Green
pm2 status

Write-Host ""
Write-Host "🔗 Useful Commands:" -ForegroundColor Green
Write-Host "  View logs: pm2 logs $AppName"
Write-Host "  Restart: pm2 restart $AppName"
Write-Host "  Stop: pm2 stop $AppName"
Write-Host "  Monitor: pm2 monit"
Write-Host "  Health check: Invoke-WebRequest http://localhost:5000/health"

Write-Host ""
Write-Host "🎉 Milkat Post is now running in production!" -ForegroundColor Green
