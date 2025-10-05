import compression from 'compression';
import { logger } from '../utils/logger.js';
import crypto from 'crypto';
import mongoose from 'mongoose';

// Response compression middleware
export const responseCompression = compression({
  level: 6,
  threshold: 1024,
  filter: (req, res) => {
    if (req.headers['cache-control'] && req.headers['cache-control'].includes('no-transform')) {
      return false;
    }
    return compression.filter(req, res);
  },
});

// Cache control middleware
export const cacheControl = (req, res, next) => {
  if (req.path.startsWith('/api/')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  } else if (req.path.match(/\.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/)) {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  } else {
    res.setHeader('Cache-Control', 'public, max-age=3600');
  }
  next();
};

// Response time logging (fixed)
export const responseTimeOptimizer = (req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (duration > 1000) {
      logger.warn('Slow response detected:', {
        url: req.url,
        method: req.method,
        duration: `${duration}ms`,
        timestamp: new Date().toISOString(),
      });
    }
  });
  res.setHeader('X-Response-Time', `${Date.now() - start}ms`); // set early
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

    if (memoryMB.heapUsed > 500) {
      logger.warn('High memory usage detected:', {
        memory: memoryMB,
        timestamp: new Date().toISOString(),
      });
    }

    if (memoryMB.heapUsed > 1000 && global.gc) {
      logger.info('Forcing garbage collection due to high memory usage');
      global.gc();
    }
  }, 60000);
};

// Connection pooling optimization
export const optimizeConnections = (req, res, next) => {
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Keep-Alive', 'timeout=5, max=1000');
  next();
};

// ETag generation for caching
export const etagGenerator = (req, res, next) => {
  const originalSend = res.send;
  res.send = function(data) {
    if (req.method === 'GET' && data) {
      const etag = crypto.createHash('md5').update(JSON.stringify(data)).digest('hex');
      res.setHeader('ETag', `"${etag}"`);

      const clientETag = req.get('If-None-Match');
      if (clientETag === `"${etag}"`) {
        return res.status(304).end();
      }
    }
    originalSend.call(this, data);
  };
  next();
};

// Database connection optimization (fixed)
export const optimizeDatabase = () => {
  mongoose.set('bufferCommands', false); // valid
  // Removed bufferMaxEntries entirely

  return {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  };
};

// Performance middleware for production
export const productionPerformance = [
  responseCompression,
  cacheControl,
  responseTimeOptimizer,
  optimizeConnections,
  etagGenerator,
];
