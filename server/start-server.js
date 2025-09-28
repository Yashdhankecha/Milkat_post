import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
const MONGODB_URI = 'mongodb+srv://ansphd17_db_user:ansharshyash@milkatpost.lzhmmp7.mongodb.net/?retryWrites=true&w=majority&appName=Milkatpost';

const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'success',
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Simple send-otp endpoint for testing
app.post('/api/auth/send-otp', (req, res) => {
  const { phone, role } = req.body;
  
  console.log('OTP request received:', { phone, role });
  
  // Basic validation
  if (!phone) {
    return res.status(400).json({
      status: 'error',
      message: 'Phone number is required'
    });
  }
  
  // For development, always return success
  res.status(200).json({
    status: 'success',
    message: 'OTP sent successfully',
    data: {
      phone,
      expiresIn: 600
    }
  });
});

// Start server
const startServer = async () => {
  await connectDB();
  
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`📱 OTP endpoint: http://localhost:${PORT}/api/auth/send-otp`);
  });
};

startServer().catch(console.error);
