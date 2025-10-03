#!/bin/bash

# Production Deployment Script for Milkat Post
# This script handles the deployment of the application to production

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="milkatpost"
NODE_VERSION="18"
PM2_APP_NAME="milkatpost-api"
BACKUP_DIR="/backups/milkatpost"
LOG_DIR="/var/log/milkatpost"

echo -e "${GREEN}🚀 Starting Milkat Post Production Deployment${NC}"

# Function to print status
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    print_error "Please do not run this script as root"
    exit 1
fi

# Check Node.js version
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed"
    exit 1
fi

NODE_CURRENT=$(node -v | cut -d'v' -f2)
if [[ "$NODE_CURRENT" < "$NODE_VERSION" ]]; then
    print_error "Node.js version $NODE_VERSION or higher is required. Current: $NODE_CURRENT"
    exit 1
fi

print_status "Node.js version check passed: $NODE_CURRENT"

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    print_warning "PM2 is not installed. Installing PM2..."
    npm install -g pm2
fi

# Create necessary directories
print_status "Creating necessary directories..."
mkdir -p $BACKUP_DIR
mkdir -p $LOG_DIR
mkdir -p logs

# Backup current deployment
if [ -d "dist" ] || [ -f "package.json" ]; then
    print_status "Creating backup of current deployment..."
    BACKUP_NAME="backup-$(date +%Y%m%d-%H%M%S)"
    tar -czf "$BACKUP_DIR/$BACKUP_NAME.tar.gz" . --exclude=node_modules --exclude=.git
    print_status "Backup created: $BACKUP_DIR/$BACKUP_NAME.tar.gz"
fi

# Install dependencies
print_status "Installing dependencies..."
npm ci --production

# Build the application
print_status "Building the application..."
npm run build

# Set up environment variables
print_status "Setting up environment variables..."
if [ ! -f ".env" ]; then
    if [ -f "env.production" ]; then
        cp env.production .env
        print_warning "Please update .env file with your production values"
    else
        print_error "No .env or env.production file found"
        exit 1
    fi
fi

# Run database migrations
print_status "Running database migrations..."
npm run migrate

# Stop existing PM2 process
print_status "Stopping existing PM2 process..."
pm2 stop $PM2_APP_NAME 2>/dev/null || true
pm2 delete $PM2_APP_NAME 2>/dev/null || true

# Start the application with PM2
print_status "Starting application with PM2..."
pm2 start server.js --name $PM2_APP_NAME \
    --instances max \
    --exec-mode cluster \
    --max-memory-restart 1G \
    --log-file $LOG_DIR/app.log \
    --error-file $LOG_DIR/error.log \
    --out-file $LOG_DIR/out.log \
    --time

# Save PM2 configuration
pm2 save
pm2 startup

# Health check
print_status "Performing health check..."
sleep 10

if curl -f http://localhost:5000/health > /dev/null 2>&1; then
    print_status "Health check passed"
else
    print_error "Health check failed"
    pm2 logs $PM2_APP_NAME --lines 50
    exit 1
fi

# Setup log rotation
print_status "Setting up log rotation..."
cat > /etc/logrotate.d/milkatpost << EOF
$LOG_DIR/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 $(whoami) $(whoami)
    postrotate
        pm2 reloadLogs
    endscript
}
EOF

# Setup firewall rules (if ufw is available)
if command -v ufw &> /dev/null; then
    print_status "Setting up firewall rules..."
    sudo ufw allow 22/tcp    # SSH
    sudo ufw allow 80/tcp    # HTTP
    sudo ufw allow 443/tcp   # HTTPS
    sudo ufw allow 5000/tcp  # API (if needed)
    sudo ufw --force enable
fi

# Setup SSL with Let's Encrypt (if certbot is available)
if command -v certbot &> /dev/null; then
    print_warning "Certbot is available. To setup SSL, run:"
    echo "sudo certbot --nginx -d yourdomain.com"
fi

# Setup monitoring
print_status "Setting up monitoring..."
pm2 install pm2-logrotate

# Final status
print_status "Deployment completed successfully!"
echo ""
echo -e "${GREEN}📊 Application Status:${NC}"
pm2 status

echo ""
echo -e "${GREEN}🔗 Useful Commands:${NC}"
echo "  View logs: pm2 logs $PM2_APP_NAME"
echo "  Restart: pm2 restart $PM2_APP_NAME"
echo "  Stop: pm2 stop $PM2_APP_NAME"
echo "  Monitor: pm2 monit"
echo "  Health check: curl http://localhost:5000/health"

echo ""
echo -e "${GREEN}🎉 Milkat Post is now running in production!${NC}"
