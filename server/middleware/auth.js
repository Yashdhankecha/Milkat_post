import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Profile from '../models/Profile.js';
import config from '../config-loader.js';

// Generate JWT token
export const generateToken = (userId, additionalPayload = {}) => {
  const payload = { userId, ...additionalPayload };
  return jwt.sign(payload, config.JWT_SECRET, {
    expiresIn: config.JWT_EXPIRE
  });
};

// Generate refresh token
export const generateRefreshToken = (userId) => {
  return jwt.sign({ userId }, config.JWT_REFRESH_SECRET, {
    expiresIn: config.JWT_REFRESH_EXPIRE
  });
};

// Verify JWT token
export const verifyToken = (token) => {
  return jwt.verify(token, config.JWT_SECRET);
};

// Verify refresh token
export const verifyRefreshToken = (token) => {
  return jwt.verify(token, config.JWT_REFRESH_SECRET);
};

// Authentication middleware
export const authenticate = async (req, res, next) => {
  try {
    let token;

    // Get token from header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Check if token exists
    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'Access denied. No token provided.'
      });
    }

    // Verify token
    const decoded = verifyToken(token);
    
    // Get user from database
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Token is invalid. User not found.'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        status: 'error',
        message: 'Account is deactivated.'
      });
    }

    // Check if user is suspended
    if (user.isSuspended) {
      return res.status(401).json({
        status: 'error',
        message: 'Account is suspended.',
        suspensionReason: user.suspensionReason
      });
    }

    // Check if user is locked
    if (user.isLocked) {
      return res.status(401).json({
        status: 'error',
        message: 'Account is temporarily locked due to multiple failed login attempts.'
      });
    }

    // Get user profiles - prioritize society_owner profile
    const profiles = await Profile.find({ user: user._id, status: 'active' });
    const societyOwnerProfile = profiles.find(p => p.role === 'society_owner');
    const profile = societyOwnerProfile || profiles[0] || null;
    
    req.user = user;
    req.profile = profile;
    req.allProfiles = profiles;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid token.'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        status: 'error',
        message: 'Token expired.'
      });
    }

    return res.status(500).json({
      status: 'error',
      message: 'Server error during authentication.'
    });
  }
};

// Authorization middleware for specific roles
export const authorize = (...roles) => {
  return (req, res, next) => {
    console.log('Authorization check - User:', req.user._id);
    console.log('Authorization check - Current profile:', req.profile);
    console.log('Authorization check - All profiles:', req.allProfiles);
    console.log('Authorization check - Required roles:', roles);
    
    if (!req.profile) {
      return res.status(401).json({
        status: 'error',
        message: 'User profile not found.'
      });
    }

    // Flatten roles array in case it's nested
    const flatRoles = roles.flat();
    
    if (!flatRoles.includes(req.profile.role)) {
      return res.status(403).json({
        status: 'error',
        message: `Access denied. Required role: ${flatRoles.join(' or ')}, but user has role: ${req.profile.role}`,
        debug: {
          userProfiles: req.allProfiles.map(p => ({
            role: p.role,
            companyName: p.companyName,
            status: p.status
          })),
          currentProfile: req.profile ? {
            role: req.profile.role,
            companyName: req.profile.companyName,
            status: req.profile.status
          } : null
        }
      });
    }

    next();
  };
};

// Optional authentication middleware (doesn't fail if no token)
export const optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      const decoded = verifyToken(token);
      const user = await User.findById(decoded.userId).select('-password');
      
      if (user && user.isActive && !user.isSuspended && !user.isLocked) {
        const profile = await Profile.findOne({ user: user._id });
        req.user = user;
        req.profile = profile;
      }
    }

    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};

// Check if user owns resource
export const checkOwnership = (resourceUserIdField = 'owner') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required.'
      });
    }

    const resourceUserId = req.resource ? req.resource[resourceUserIdField] : req.params.userId;
    
    if (req.user._id.toString() !== resourceUserId.toString() && req.profile.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. You can only access your own resources.'
      });
    }

    next();
  };
};

// Rate limiting for authentication endpoints - REMOVED
// export const authRateLimit = (maxAttempts = 5, windowMs = 15 * 60 * 1000) => {
//   const attempts = new Map();

//   return (req, res, next) => {
//     const key = req.ip + req.body.phone;
//     const now = Date.now();
//     const windowStart = now - windowMs;

//     // Clean old attempts
//     if (attempts.has(key)) {
//       const userAttempts = attempts.get(key).filter(time => time > windowStart);
//       attempts.set(key, userAttempts);
//     }

//     // Check if limit exceeded
//     if (attempts.has(key) && attempts.get(key).length >= maxAttempts) {
//       return res.status(429).json({
//         status: 'error',
//         message: 'Too many authentication attempts. Please try again later.'
//       });
//     }

//     // Record attempt
//     if (!attempts.has(key)) {
//       attempts.set(key, []);
//     }
//     attempts.get(key).push(now);

//     next();
//   };
// };

// Generate OTP
export const generateOTP = (length = 6) => {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * 10)];
  }
  return otp;
};

// Validate phone number - E.164 format
export const validatePhoneNumber = (phone) => {
  // E.164 format: +[country code][number] (max 15 digits total including country code)
  const e164Regex = /^\+[1-9]\d{7,14}$/;
  
  // Also allow 10-digit numbers for backward compatibility
  const tenDigitRegex = /^\d{10}$/;
  
  return e164Regex.test(phone) || tenDigitRegex.test(phone);
};

// Validate email
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};
    ` `