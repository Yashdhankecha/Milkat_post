// server.js
import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import mongoSanitize from "express-mongo-sanitize";
import hpp from "hpp";
import xss from "xss-clean";
import path from "path";
import { fileURLToPath } from "url";
import { createServer } from "http";

// Config
import config from "./config-loader.js";

// Services
import socketService from "./services/socketService.js";
import { initializeVotingScheduler } from "./services/votingScheduler.js";

// Middleware
import { errorHandler } from "./middleware/errorHandler.js";
import { logger } from "./utils/logger.js";
import {
  productionSecurity,
  generalRateLimit,
  authRateLimit,
  smsRateLimit,
  requestLogger,
  sanitizeErrorResponse,
} from "./middleware/security.js";
import {
  healthCheck,
  performanceMonitor,
  errorTracker,
  metricsCollector,
  securityMonitor,
  resourceMonitor,
} from "./middleware/monitoring.js";
import { productionPerformance, memoryMonitor, optimizeDatabase } from "./middleware/performance.js";

// Routes
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import propertyRoutes from "./routes/properties.js";
import projectRoutes from "./routes/projects.js";
import societyRoutes from "./routes/societies.js";
import brokerRoutes from "./routes/brokers.js";
import developerRoutes from "./routes/developers.js";
import inquiryRoutes from "./routes/inquiries.js";
import supportRoutes from "./routes/support.js";
import uploadRoutes from "./routes/upload.js";
import requirementRoutes from "./routes/requirements.js";
import likeRoutes from "./routes/likes.js";
import shareRoutes from "./routes/shares.js";
import notificationRoutes from "./routes/notifications.js";
import userRoleRoutes from "./routes/userRoles.js";
import redevelopmentRoutes from "./routes/redevelopment.js";
import developerProposalRoutes from "./routes/developerProposals.js";
import invitationRoutes from "./routes/invitations.js";
import memberVoteRoutes from "./routes/memberVotes.js";
import queryRoutes from "./routes/queries.js";
import globalRedevelopmentRoutes from "./routes/globalRedevelopment.js";

// Load environment
dotenv.config({ path: new URL("./.env", import.meta.url).pathname });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// --------------------
// Global Error Handlers
// --------------------
process.on("uncaughtException", (err) => {
  console.error("💥 Uncaught Exception:", err.stack || err);
  process.exit(1);
});

process.on("unhandledRejection", (reason, p) => {
  console.error("💥 Unhandled Rejection at promise:", p, "reason:", reason);
  process.exit(1);
});

// --------------------
// Middleware
// --------------------
app.set("trust proxy", 1);

if (config.NODE_ENV === "production") {
  app.use(productionSecurity);
  app.use(generalRateLimit);
  app.use(performanceMonitor);
  app.use(metricsCollector);
  app.use(securityMonitor);
  app.use(requestLogger);
  resourceMonitor();
  memoryMonitor();
} else {
  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
  app.use(
    cors({
      origin: (origin, callback) => {
        const allowedOrigins = config.ALLOWED_ORIGINS.split(",");
        if (!origin || allowedOrigins.includes(origin)) callback(null, true);
        else callback(new Error("Not allowed by CORS"));
      },
      credentials: true,
      optionsSuccessStatus: 200,
    })
  );
}

// Body parser & sanitization
app.use(express.json({ limit: config.MAX_FILE_SIZE || "10mb" }));
app.use(express.urlencoded({ extended: true, limit: config.MAX_FILE_SIZE || "10mb" }));
app.use(mongoSanitize());
app.use(xss());
app.use(hpp());
if (config.NODE_ENV === "production") app.use(productionPerformance);

// Logging
if (config.NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  app.use(
    morgan("combined", {
      stream: { write: (message) => logger.info(message.trim()) },
    })
  );
}

// Serve uploads
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Health check
app.get("/health", healthCheck);

// Rate-limited auth routes
app.use("/api/auth", authRateLimit);
app.use("/api/auth/send-otp", smsRateLimit);
app.use("/api/auth/verify-otp", smsRateLimit);

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/properties", propertyRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/societies", societyRoutes);
app.use("/api/brokers", brokerRoutes);
app.use("/api/developers", developerRoutes);
app.use("/api/inquiries", inquiryRoutes);
app.use("/api/support", supportRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/requirements", requirementRoutes);
app.use("/api/likes", likeRoutes);
app.use("/api/shares", shareRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/user-roles", userRoleRoutes);
app.use("/api/redevelopment-projects", redevelopmentRoutes);
app.use("/api/developer-proposals", developerProposalRoutes);
app.use("/api/invitations", invitationRoutes);
app.use("/api/member-votes", memberVoteRoutes);
app.use("/api/queries", queryRoutes);
app.use("/api/global-redevelopment", globalRedevelopmentRoutes);

// 404 Handler
app.use("*", (req, res) => {
  res.status(404).json({ status: "error", message: `Route ${req.originalUrl} not found` });
});

// Global error handler
app.use(errorHandler);
if (config.NODE_ENV === "production") {
  app.use(errorTracker);
  app.use(sanitizeErrorResponse);
}

// --------------------
// Database Connection
// --------------------
const connectDB = async () => {
  try {
    const mongoURI = config.NODE_ENV === "test" ? config.MONGODB_TEST_URI : config.MONGODB_URI;

    // Ensure optimizeDatabase() returns valid options only
    const options = config.NODE_ENV === "production"
      ? {
          autoIndex: false,
          maxPoolSize: 10,
          serverSelectionTimeoutMS: 5000,
          socketTimeoutMS: 45000,
        }
      : {};

    console.log("🔹 Connecting to MongoDB with URI:", mongoURI);
    console.log("🔹 MongoDB connection options:", options);

    const conn = await mongoose.connect(mongoURI, options);

    console.log("✅ MongoDB connected to host:", conn.connection.host);
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
};

// --------------------
// Graceful Shutdown
// --------------------
const shutdown = async () => {
  logger.info("⚡ Shutting down gracefully...");
  await mongoose.connection.close();
  process.exit(0);
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

// --------------------
// Start Server
// --------------------
const PORT = config.PORT || 5000;
const HOST = config.HOST || "0.0.0.0";

const startServer = async () => {
  await connectDB();
  const server = createServer(app);

  // Socket & schedulers
  socketService.initialize(server);
  initializeVotingScheduler();

  server.listen(PORT, HOST, () => {
    logger.info(`✅ Server running on ${HOST}:${PORT} in ${config.NODE_ENV} mode`);
    logger.info(`🔌 WebSocket server initialized`);
    logger.info(`📊 Voting scheduler initialized`);
  });
};

startServer().catch((error) => {
  logger.error("❌ Failed to start server:", error);
  process.exit(1);
});

export default app;
