import { logger } from '../utils/logger.js';

// Health check middleware
export const healthCheck = async (req, res) => {
  try {
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version || '1.0.0',
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        external: Math.round(process.memoryUsage().external / 1024 / 1024),
      },
      cpu: process.cpuUsage(),
    };

    // Check database connection
    try {
      // Add database health check here
      healthData.database = 'connected';
    } catch (error) {
      healthData.database = 'disconnected';
      healthData.status = 'unhealthy';
    }

    // Check external services
    healthData.services = {
      twilio: 'connected', // Add actual Twilio health check
      cloudinary: 'connected', // Add actual Cloudinary health check
    };

    const statusCode = healthData.status === 'healthy' ? 200 : 503;
    
    logger.info('Health check performed', healthData);
    res.status(statusCode).json(healthData);
    
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
    });
  }
};

// Performance monitoring middleware
export const performanceMonitor = (req, res, next) => {
  const start = Date.now();
  const startMemory = process.memoryUsage();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const endMemory = process.memoryUsage();
    
    const performanceData = {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      memoryDelta: {
        heapUsed: endMemory.heapUsed - startMemory.heapUsed,
        heapTotal: endMemory.heapTotal - startMemory.heapTotal,
      },
      timestamp: new Date().toISOString(),
    };
    
    // Log slow requests
    if (duration > 1000) {
      logger.warn('Slow request detected:', performanceData);
    }
    
    // Log high memory usage
    if (performanceData.memoryDelta.heapUsed > 10 * 1024 * 1024) { // 10MB
      logger.warn('High memory usage detected:', performanceData);
    }
    
    // Log errors
    if (res.statusCode >= 400) {
      logger.error('Request error:', performanceData);
    }
  });
  
  next();
};

// Database query monitoring
export const queryMonitor = (req, res, next) => {
  const originalSend = res.send;
  
  res.send = function(data) {
    // Log database queries if needed
    if (req.dbQueries) {
      logger.info('Database queries:', {
        url: req.url,
        method: req.method,
        queries: req.dbQueries,
        timestamp: new Date().toISOString(),
      });
    }
    
    originalSend.call(this, data);
  };
  
  next();
};

// Error tracking middleware
export const errorTracker = (error, req, res, next) => {
  const errorData = {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString(),
    statusCode: error.statusCode || 500,
  };
  
  // Log error
  logger.error('Application error:', errorData);
  
  // In production, you might want to send this to an error tracking service
  // like Sentry, Bugsnag, or DataDog
  
  next(error);
};

// Metrics collection middleware
export const metricsCollector = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    // Collect metrics
    const metrics = {
      endpoint: `${req.method} ${req.route?.path || req.url}`,
      statusCode: res.statusCode,
      duration,
      timestamp: new Date().toISOString(),
    };
    
    // Store metrics (in production, send to monitoring service)
    logger.info('Metrics collected:', metrics);
    
    // You can integrate with services like:
    // - Prometheus
    // - DataDog
    // - New Relic
    // - AWS CloudWatch
  });
  
  next();
};

// Security monitoring
export const securityMonitor = (req, res, next) => {
  const suspiciousPatterns = [
    /\.\.\//, // Path traversal
    /<script/i, // XSS attempts
    /union.*select/i, // SQL injection
    /eval\(/i, // Code injection
    /javascript:/i, // JavaScript injection
  ];
  
  const requestString = JSON.stringify({
    url: req.url,
    body: req.body,
    query: req.query,
    headers: req.headers,
  });
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(requestString)) {
      logger.warn('Suspicious request detected:', {
        pattern: pattern.toString(),
        url: req.url,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString(),
      });
      
      // In production, you might want to:
      // - Block the IP
      // - Send alert to security team
      // - Log to security monitoring system
    }
  }
  
  next();
};

// Resource usage monitoring
export const resourceMonitor = () => {
  setInterval(() => {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    const resourceData = {
      memory: {
        rss: Math.round(memoryUsage.rss / 1024 / 1024), // MB
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
        external: Math.round(memoryUsage.external / 1024 / 1024), // MB
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system,
      },
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
    
    // Log high resource usage
    if (resourceData.memory.heapUsed > 500) { // 500MB
      logger.warn('High memory usage detected:', resourceData);
    }
    
    // Log resource usage every 5 minutes
    logger.info('Resource usage:', resourceData);
    
  }, 5 * 60 * 1000); // Every 5 minutes
};
