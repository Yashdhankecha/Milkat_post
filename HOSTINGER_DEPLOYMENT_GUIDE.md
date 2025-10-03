# Hostinger Deployment Guide - Complete Setup

This guide will help you deploy your Milkat Post application on Hostinger with Nginx, PM2, and SSL certificates.

## Prerequisites

- Hostinger VPS or Shared Hosting with SSH access
- Domain name pointed to your Hostinger server
- Basic knowledge of Linux commands

## Step 1: Connect to Your Hostinger Server

```bash
# Connect via SSH
ssh username@your-domain.com
# or
ssh username@your-server-ip
```

## Step 2: Update System and Install Dependencies

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Node.js (LTS version)
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 globally
sudo npm install -g pm2

# Install Nginx
sudo apt install nginx -y

# Install Certbot for SSL
sudo apt install certbot python3-certbot-nginx -y

# Install Git (if not already installed)
sudo apt install git -y

# Install build tools (for native modules)
sudo apt install build-essential -y
```

## Step 3: Clone Your Repository

```bash
# Navigate to web directory
cd /var/www

# Clone your repository
sudo git clone https://github.com/yourusername/nestly_estate_mine.git milkatpost
# Replace with your actual repository URL

# Set ownership
sudo chown -R $USER:$USER /var/www/milkatpost

# Navigate to project directory
cd /var/www/milkatpost
```

## Step 4: Install Dependencies and Build

```bash
# Install server dependencies
cd server
npm ci --production

# Install client dependencies and build
cd ../client
npm ci
npm run build

# Go back to server directory
cd ../server
```

## Step 5: Configure Environment Variables

```bash
# Create production environment file
nano .env
```

**Add your production environment variables:**

```env
# Production Environment Configuration
NODE_ENV=production

# Server Configuration
PORT=5000
HOST=0.0.0.0

# Database Configuration
MONGODB_URI=mongodb+srv://ansphd17_db_user:ansharshyash@milkatpost.lzhmmp7.mongodb.net/?retryWrites=true&w=majority&appName=Milkatpost

# JWT Configuration (CHANGE THESE!)
JWT_SECRET=your-super-secure-jwt-secret-key-here-make-this-very-long-and-random
JWT_EXPIRE=7d
JWT_REFRESH_SECRET=your-super-secure-refresh-secret-key-here-also-very-long-and-random
JWT_REFRESH_EXPIRE=30d

# Twilio SMS Configuration
TWILIO_ACCOUNT_SID=ACef792d34ee90cb545fa35405269297fc
TWILIO_AUTH_TOKEN=8da686dff6e40e3b69b9d13283cc7543
TWILIO_PHONE_NUMBER=+16416705182

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=dr4rhvgjr
CLOUDINARY_API_KEY=132624366732961
CLOUDINARY_API_SECRET=YTgfcuw1Agnq4h1I7GsTFPVAOs0

# Security Configuration
BCRYPT_ROUNDS=12
SESSION_SECRET=your-session-secret-here-make-this-random
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS Configuration
FRONTEND_URL=https://yourdomain.com
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# File Upload Configuration
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/webp,application/pdf,video/webm,video/mkv,video/mp4

# Logging Configuration
LOG_LEVEL=info
LOG_FILE=logs/production.log
```

**Generate secure secrets:**
```bash
# Generate JWT secrets
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"
node -e "console.log('JWT_REFRESH_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"
node -e "console.log('SESSION_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
```

## Step 6: Start Application with PM2

```bash
# Start the application with PM2
pm2 start server.js --name milkatpost-api --instances max --exec-mode cluster

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Follow the instructions shown by the command

# Check PM2 status
pm2 status
pm2 logs milkatpost-api
```

## Step 7: Configure Nginx

```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/milkatpost
```

**Add this configuration:**

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;
    
    # SSL Configuration (will be added by Certbot)
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript;
    
    # API routes
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
    
    # WebSocket support
    location /socket.io/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Health check
    location /health {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Static files (React build)
    location / {
        root /var/www/milkatpost/client/build;
        index index.html index.htm;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # File upload size limit
    client_max_body_size 10M;
}
```

**Enable the site:**
```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/milkatpost /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

## Step 8: Setup SSL with Certbot

```bash
# Obtain SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Follow the prompts:
# - Enter your email address
# - Agree to terms of service
# - Choose whether to share email with EFF
# - Certbot will automatically configure Nginx

# Test automatic renewal
sudo certbot renew --dry-run

# Setup automatic renewal (usually already configured)
sudo crontab -e
# Add this line if not present:
# 0 12 * * * /usr/bin/certbot renew --quiet
```

## Step 9: Configure Firewall

```bash
# Configure UFW firewall
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable

# Check firewall status
sudo ufw status
```

## Step 10: Setup Log Rotation

```bash
# Create log rotation configuration
sudo nano /etc/logrotate.d/milkatpost
```

**Add this configuration:**

```
/var/www/milkatpost/server/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        pm2 reloadLogs
    endscript
}
```

## Step 11: Setup Monitoring and Health Checks

```bash
# Create monitoring script
nano /var/www/milkatpost/monitor.sh
```

**Add this script:**

```bash
#!/bin/bash

# Health check script
API_URL="https://yourdomain.com/health"
LOG_FILE="/var/www/milkatpost/health.log"

# Check API health
response=$(curl -s -o /dev/null -w "%{http_code}" $API_URL)

if [ $response -eq 200 ]; then
    echo "$(date): API is healthy (HTTP $response)" >> $LOG_FILE
else
    echo "$(date): API is unhealthy (HTTP $response)" >> $LOG_FILE
    # Restart PM2 process
    pm2 restart milkatpost-api
    echo "$(date): Restarted milkatpost-api" >> $LOG_FILE
fi

# Check PM2 status
pm2_status=$(pm2 jlist | jq -r '.[0].pm2_env.status')
if [ "$pm2_status" != "online" ]; then
    echo "$(date): PM2 process is not online, restarting..." >> $LOG_FILE
    pm2 restart milkatpost-api
fi
```

**Make it executable and setup cron:**
```bash
chmod +x /var/www/milkatpost/monitor.sh

# Add to cron for every 5 minutes
crontab -e
# Add this line:
# */5 * * * * /var/www/milkatpost/monitor.sh
```

## Step 12: Final Verification

```bash
# Check PM2 status
pm2 status

# Check Nginx status
sudo systemctl status nginx

# Check SSL certificate
sudo certbot certificates

# Test API endpoint
curl https://yourdomain.com/health

# Check logs
pm2 logs milkatpost-api
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

## Step 13: Setup Backups (Optional but Recommended)

```bash
# Create backup script
nano /var/www/milkatpost/backup.sh
```

**Add this script:**

```bash
#!/bin/bash

# Backup script
BACKUP_DIR="/var/backups/milkatpost"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup application files
tar -czf $BACKUP_DIR/app_$DATE.tar.gz /var/www/milkatpost

# Backup PM2 configuration
pm2 save
cp ~/.pm2/dump.pm2 $BACKUP_DIR/pm2_config_$DATE.json

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
find $BACKUP_DIR -name "*.json" -mtime +7 -delete

echo "$(date): Backup completed" >> $BACKUP_DIR/backup.log
```

**Make it executable and setup daily backup:**
```bash
chmod +x /var/www/milkatpost/backup.sh

# Add to cron for daily backup at 2 AM
crontab -e
# Add this line:
# 0 2 * * * /var/www/milkatpost/backup.sh
```

## Troubleshooting

### Common Issues and Solutions

#### 1. PM2 Process Not Starting
```bash
# Check PM2 logs
pm2 logs milkatpost-api

# Check application logs
tail -f /var/www/milkatpost/server/logs/production.log

# Restart PM2
pm2 restart milkatpost-api
```

#### 2. Nginx Configuration Issues
```bash
# Test Nginx configuration
sudo nginx -t

# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Reload Nginx
sudo systemctl reload nginx
```

#### 3. SSL Certificate Issues
```bash
# Check certificate status
sudo certbot certificates

# Renew certificate manually
sudo certbot renew

# Check certificate expiration
openssl x509 -in /etc/letsencrypt/live/yourdomain.com/cert.pem -text -noout | grep "Not After"
```

#### 4. Database Connection Issues
```bash
# Test MongoDB connection
mongo "mongodb+srv://ansphd17_db_user:ansharshyash@milkatpost.lzhmmp7.mongodb.net/"

# Check network connectivity
ping milkatpost.lzhmmp7.mongodb.net
```

#### 5. File Permission Issues
```bash
# Fix file permissions
sudo chown -R $USER:$USER /var/www/milkatpost
sudo chmod -R 755 /var/www/milkatpost
```

## Useful Commands

### PM2 Management
```bash
# View PM2 status
pm2 status

# View logs
pm2 logs milkatpost-api

# Restart application
pm2 restart milkatpost-api

# Stop application
pm2 stop milkatpost-api

# Delete application
pm2 delete milkatpost-api

# Monitor resources
pm2 monit
```

### Nginx Management
```bash
# Test configuration
sudo nginx -t

# Reload configuration
sudo systemctl reload nginx

# Restart Nginx
sudo systemctl restart nginx

# Check status
sudo systemctl status nginx
```

### SSL Management
```bash
# Check certificates
sudo certbot certificates

# Renew certificates
sudo certbot renew

# Test renewal
sudo certbot renew --dry-run
```

## Security Checklist

- [ ] Firewall configured (UFW)
- [ ] SSL certificate installed and auto-renewal setup
- [ ] Security headers configured in Nginx
- [ ] File permissions set correctly
- [ ] Environment variables secured
- [ ] Database credentials protected
- [ ] Regular backups configured
- [ ] Monitoring and health checks setup
- [ ] Log rotation configured

## Performance Optimization

- [ ] Gzip compression enabled
- [ ] Static file caching configured
- [ ] PM2 cluster mode enabled
- [ ] Nginx worker processes optimized
- [ ] Database connection pooling
- [ ] CDN setup (optional)

## Your Application URLs

After successful deployment:

- **Main Application**: `https://yourdomain.com`
- **API Endpoint**: `https://yourdomain.com/api/`
- **Health Check**: `https://yourdomain.com/health`
- **WebSocket**: `wss://yourdomain.com/socket.io/`

## Support and Maintenance

### Daily Tasks
- Monitor application logs
- Check PM2 status
- Verify SSL certificate status

### Weekly Tasks
- Review error logs
- Check disk space
- Update system packages

### Monthly Tasks
- Review security updates
- Test backup restoration
- Performance monitoring

Your Milkat Post application is now successfully deployed on Hostinger with Nginx, PM2, and SSL! 🚀

## Quick Reference

```bash
# Start application
pm2 start server.js --name milkatpost-api

# Check status
pm2 status

# View logs
pm2 logs milkatpost-api

# Restart application
pm2 restart milkatpost-api

# Test Nginx
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx

# Check SSL
sudo certbot certificates

# Renew SSL
sudo certbot renew
```
