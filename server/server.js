import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';
import xss from 'xss-clean';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
// Import config loader (handles environment variables)
import config from './config-loader.js';
// Import WebSocket service
import socketService from './services/socketService.js';
// Import voting scheduler
import { initializeVotingScheduler } from './services/votingScheduler.js';
// Import production middleware
import { 
  productionSecurity, 
  generalRateLimit, 
  authRateLimit, 
  smsRateLimit,
  requestLogger,
  sanitizeErrorResponse 
} from './middleware/security.js';
import { 
  healthCheck, 
  performanceMonitor, 
  errorTracker, 
  metricsCollector, 
  securityMonitor, 
  resourceMonitor 
} from './middleware/monitoring.js';
import { 
  productionPerformance, 
  memoryMonitor, 
  optimizeDatabase 
} from './middleware/performance.js';

// Import routes
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import propertyRoutes from './routes/properties.js';
import projectRoutes from './routes/projects.js';
import societyRoutes from './routes/societies.js';
import brokerRoutes from './routes/brokers.js';
import developerRoutes from './routes/developers.js';
import inquiryRoutes from './routes/inquiries.js';
import supportRoutes from './routes/support.js';
import uploadRoutes from './routes/upload.js';
import requirementRoutes from './routes/requirements.js';
import likeRoutes from './routes/likes.js';
import shareRoutes from './routes/shares.js';
import notificationRoutes from './routes/notifications.js';
import userRoleRoutes from './routes/userRoles.js';
import redevelopmentRoutes from './routes/redevelopment.js';
import developerProposalRoutes from './routes/developerProposals.js';
import invitationRoutes from './routes/invitations.js';
import memberVoteRoutes from './routes/memberVotes.js';
import queryRoutes from './routes/queries.js';
import globalRedevelopmentRoutes from './routes/globalRedevelopment.js';

// Import middleware
import { errorHandler } from './middleware/errorHandler.js';
import { logger } from './utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Trust proxy for rate limiting behind reverse proxy
app.set('trust proxy', 1);

// Production security middleware
if (config.NODE_ENV === 'production') {
  app.use(productionSecurity);
  app.use(generalRateLimit);
  app.use(performanceMonitor);
  app.use(metricsCollector);
  app.use(securityMonitor);
  app.use(requestLogger);
  
  // Start resource monitoring
  resourceMonitor();
  memoryMonitor();
} else {
  // Development middleware
  app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
  }));
  
  // CORS configuration for development
  const corsOptions = {
    origin: function (origin, callback) {
      const allowedOrigins = config.ALLOWED_ORIGINS.split(',');
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    optionsSuccessStatus: 200
  };
  
  app.use(cors(corsOptions));
}

// Body parsing middleware
app.use(express.json({ limit: config.MAX_FILE_SIZE || '10mb' }));
app.use(express.urlencoded({ extended: true, limit: config.MAX_FILE_SIZE || '10mb' }));

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Prevent parameter pollution
app.use(hpp());

// Production performance middleware
if (config.NODE_ENV === 'production') {
  app.use(productionPerformance);
}

// Logging middleware
if (config.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', {
    stream: {
      write: (message) => logger.info(message.trim())
    }
  }));
}

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check endpoint
app.get('/health', healthCheck);

// Rate limiting for specific routes
app.use('/api/auth', authRateLimit);
app.use('/api/auth/send-otp', smsRateLimit);
app.use('/api/auth/verify-otp', smsRateLimit);

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/societies', societyRoutes);
app.use('/api/brokers', brokerRoutes);
app.use('/api/developers', developerRoutes);
app.use('/api/inquiries', inquiryRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/requirements', requirementRoutes);
app.use('/api/likes', likeRoutes);
app.use('/api/shares', shareRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/user-roles', userRoleRoutes);
app.use('/api/redevelopment-projects', redevelopmentRoutes);
app.use('/api/developer-proposals', developerProposalRoutes);
app.use('/api/invitations', invitationRoutes);
app.use('/api/member-votes', memberVoteRoutes);
app.use('/api/queries', queryRoutes);
app.use('/api/global-redevelopment', globalRedevelopmentRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    status: 'error',
    message: `Route ${req.originalUrl} not found`
  });
});

// Global error handler
app.use(errorHandler);

// Production error handling
if (config.NODE_ENV === 'production') {
  app.use(errorTracker);
  app.use(sanitizeErrorResponse);
}

// Database connection
const connectDB = async () => {
  try {
    const mongoURI = config.NODE_ENV === 'test' 
      ? config.MONGODB_TEST_URI 
      : config.MONGODB_URI;

    const options = config.NODE_ENV === 'production' ? optimizeDatabase() : {};
    
    await mongoose.connect(mongoURI, options);

    logger.info('MongoDB connected successfully');
  } catch (error) {
    logger.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  await mongoose.connection.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received. Shutting down gracefully...');
  await mongoose.connection.close();
  process.exit(0);
});

// Start server
const PORT = config.PORT;
const HOST = config.HOST;

const startServer = async () => {
  await connectDB();
  
  // Create HTTP server
  const server = createServer(app);
  
  // Initialize WebSocket service
  socketService.initialize(server);
  
  // Initialize voting scheduler
  initializeVotingScheduler();
  
  server.listen(PORT, HOST, () => {
    logger.info(`Server running on ${HOST}:${PORT} in ${config.NODE_ENV} mode`);
    logger.info(`WebSocket server initialized for real-time notifications`);
    logger.info(`Voting scheduler initialized for automatic vote processing`);
  });
};

startServer().catch((error) => {
  logger.error('Failed to start server:', error);
  process.exit(1);
});

export default app;
