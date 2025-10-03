import compression from 'compression';
import { logger } from '../utils/logger.js';

// Response compression middleware
export const responseCompression = compression({
  level: 6, // Compression level (1-9, 6 is good balance)
  threshold: 1024, // Only compress responses larger than 1KB
  filter: (req, res) => {
    // Don't compress if the request includes a no-transform directive
    if (req.headers['cache-control'] && req.headers['cache-control'].includes('no-transform')) {
      return false;
    }
    
    // Use compression for all other responses
    return compression.filter(req, res);
  },
});

// Cache control middleware
export const cacheControl = (req, res, next) => {
  // Set cache headers based on route
  if (req.path.startsWith('/api/')) {
    // API responses should not be cached
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  } else if (req.path.match(/\.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/)) {
    // Static assets can be cached for 1 year
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  } else {
    // HTML pages should be cached for 1 hour
    res.setHeader('Cache-Control', 'public, max-age=3600');
  }
  
  next();
};

// Database query optimization middleware
export const queryOptimizer = (req, res, next) => {
  const originalSend = res.send;
  
  res.send = function(data) {
    // Log slow database queries
    if (req.dbQueries && req.dbQueries.length > 0) {
      const slowQueries = req.dbQueries.filter(query => query.duration > 100); // 100ms
      
      if (slowQueries.length > 0) {
        logger.warn('Slow database queries detected:', {
          url: req.url,
          method: req.method,
          slowQueries,
          timestamp: new Date().toISOString(),
        });
      }
    }
    
    originalSend.call(this, data);
  };
  
  next();
};

// Request size limiting
export const requestSizeLimit = (maxSize = '10mb') => {
  return (req, res, next) => {
    const contentLength = parseInt(req.get('Content-Length') || '0');
    const maxSizeBytes = parseSize(maxSize);
    
    if (contentLength > maxSizeBytes) {
      return res.status(413).json({
        status: 'error',
        message: 'Request entity too large',
        maxSize: maxSize,
      });
    }
    
    next();
  };
};

// Parse size string to bytes
function parseSize(size) {
  const units = {
    b: 1,
    kb: 1024,
    mb: 1024 * 1024,
    gb: 1024 * 1024 * 1024,
  };
  
  const match = size.match(/^(\d+(?:\.\d+)?)\s*(b|kb|mb|gb)$/i);
  if (!match) {
    throw new Error('Invalid size format');
  }
  
  const value = parseFloat(match[1]);
  const unit = match[2].toLowerCase();
  
  return Math.floor(value * units[unit]);
}

// Response time optimization
export const responseTimeOptimizer = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    // Log slow responses
    if (duration > 1000) { // 1 second
      logger.warn('Slow response detected:', {
        url: req.url,
        method: req.method,
        duration: `${duration}ms`,
        timestamp: new Date().toISOString(),
      });
    }
    
    // Set response time header
    res.setHeader('X-Response-Time', `${duration}ms`);
  });
  
  next();
};

// Memory usage monitoring
export const memoryMonitor = () => {
  setInterval(() => {
    const memoryUsage = process.memoryUsage();
    const memoryMB = {
      rss: Math.round(memoryUsage.rss / 1024 / 1024),
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      external: Math.round(memoryUsage.external / 1024 / 1024),
    };
    
    // Log high memory usage
    if (memoryMB.heapUsed > 500) { // 500MB
      logger.warn('High memory usage detected:', {
        memory: memoryMB,
        timestamp: new Date().toISOString(),
      });
    }
    
    // Force garbage collection if memory usage is very high
    if (memoryMB.heapUsed > 1000 && global.gc) { // 1GB
      logger.info('Forcing garbage collection due to high memory usage');
      global.gc();
    }
    
  }, 60000); // Check every minute
};

// Connection pooling optimization
export const optimizeConnections = (req, res, next) => {
  // Set keep-alive headers
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Keep-Alive', 'timeout=5, max=1000');
  
  next();
};

// ETag generation for caching
export const etagGenerator = (req, res, next) => {
  const originalSend = res.send;
  
  res.send = function(data) {
    // Generate ETag for GET requests
    if (req.method === 'GET' && data) {
      const crypto = require('crypto');
      const etag = crypto.createHash('md5').update(JSON.stringify(data)).digest('hex');
      res.setHeader('ETag', `"${etag}"`);
      
      // Check if client has the same version
      const clientETag = req.get('If-None-Match');
      if (clientETag === `"${etag}"`) {
        return res.status(304).end();
      }
    }
    
    originalSend.call(this, data);
  };
  
  next();
};

// Database connection optimization
export const optimizeDatabase = () => {
  // Set optimal MongoDB connection options
  const mongoose = require('mongoose');
  
  mongoose.set('bufferCommands', false);
  mongoose.set('bufferMaxEntries', 0);
  
  // Optimize connection pool
  const options = {
    maxPoolSize: 10, // Maintain up to 10 socket connections
    serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
    socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    bufferMaxEntries: 0, // Disable mongoose buffering
    bufferCommands: false, // Disable mongoose buffering
  };
  
  return options;
};

// Performance middleware for production
export const productionPerformance = [
  responseCompression,
  cacheControl,
  responseTimeOptimizer,
  optimizeConnections,
  etagGenerator,
];
