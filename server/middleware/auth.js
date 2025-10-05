import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Profile from '../models/Profile.js';
import config from '../config-loader.js';

// ================= JWT FUNCTIONS ================= //
export const generateToken = (userId, additionalPayload = {}) => {
  return jwt.sign({ userId, ...additionalPayload }, config.JWT_SECRET, {
    expiresIn: config.JWT_EXPIRE,
  });
};

export const generateRefreshToken = (userId) => {
  return jwt.sign({ userId }, config.JWT_REFRESH_SECRET, {
    expiresIn: config.JWT_REFRESH_EXPIRE,
  });
};

export const verifyToken = (token) => jwt.verify(token, config.JWT_SECRET);
export const verifyRefreshToken = (token) => jwt.verify(token, config.JWT_REFRESH_SECRET);

// ================= RATE LIMITING ================= //
const authAttempts = new Map(); // key = phone, value = [timestamps]
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

export const authRateLimit = (req, res, next) => {
  const phone = req.body.phone;
  if (!phone) return next();

  const now = Date.now();
  if (!authAttempts.has(phone)) authAttempts.set(phone, []);

  // clean old attempts
  const attempts = authAttempts.get(phone).filter((t) => t > now - WINDOW_MS);
  authAttempts.set(phone, attempts);

  if (attempts.length >= MAX_ATTEMPTS) {
    return res.status(429).json({
      status: 'error',
      message: 'Too many authentication attempts. Try again later.',
    });
  }

  // record this attempt
  authAttempts.get(phone).push(now);
  next();
};

// ================= OTP GENERATION ================= //
export const generateOTP = (length = 6) => {
  let otp = '';
  const digits = '0123456789';
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * 10)];
  }
  return otp;
};

// ================= VALIDATION ================= //
export const validatePhoneNumber = (phone) => {
  const e164Regex = /^\+[1-9]\d{7,14}$/;
  const tenDigitRegex = /^\d{10}$/;
  return e164Regex.test(phone) || tenDigitRegex.test(phone);
};

export const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// ================= AUTHENTICATION ================= //
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer')) {
      return res.status(401).json({ status: 'error', message: 'Access denied. No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) return res.status(401).json({ status: 'error', message: 'User not found.' });
    if (!user.isActive) return res.status(401).json({ status: 'error', message: 'Account deactivated.' });
    if (user.isSuspended) return res.status(401).json({ status: 'error', message: 'Account suspended.', suspensionReason: user.suspensionReason });
    if (user.isLocked) return res.status(401).json({ status: 'error', message: 'Account temporarily locked due to multiple failed attempts.' });

    const profiles = await Profile.find({ user: user._id, status: 'active' });

    // prioritize profile based on request
    const isDevRequest = req.originalUrl.includes('/projects') || req.originalUrl.includes('/developers') || req.headers['x-requested-role'] === 'developer';
    let profile = isDevRequest
      ? profiles.find(p => p.role === 'developer') || profiles[0] || null
      : profiles.find(p => p.role === 'society_owner') || profiles[0] || null;

    req.user = user;
    req.profile = profile;
    req.allProfiles = profiles;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') return res.status(401).json({ status: 'error', message: 'Invalid token.' });
    if (error.name === 'TokenExpiredError') return res.status(401).json({ status: 'error', message: 'Token expired.' });
    return res.status(500).json({ status: 'error', message: 'Server error during authentication.' });
  }
};

// Optional auth (doesn’t block if no token)
export const optionalAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return next();

    const decoded = verifyToken(token);
    const user = await User.findById(decoded.userId).select('-password');
    if (user && user.isActive && !user.isSuspended && !user.isLocked) {
      const profile = await Profile.findOne({ user: user._id });
      req.user = user;
      req.profile = profile;
    }
    next();
  } catch (err) {
    next();
  }
};

// ================= AUTHORIZATION ================= //
export const authorize = (...roles) => (req, res, next) => {
  if (!req.profile) return res.status(401).json({ status: 'error', message: 'User profile not found.' });
  const flatRoles = roles.flat();
  if (!flatRoles.includes(req.profile.role)) {
    return res.status(403).json({
      status: 'error',
      message: `Access denied. Required role: ${flatRoles.join(' or ')}, but user has role: ${req.profile.role}`,
      debug: { userProfiles: req.allProfiles, currentProfile: req.profile },
    });
  }
  next();
};

// ================= RESOURCE OWNERSHIP ================= //
export const checkOwnership = (resourceUserIdField = 'owner') => (req, res, next) => {
  if (!req.user) return res.status(401).json({ status: 'error', message: 'Authentication required.' });
  const resourceUserId = req.resource ? req.resource[resourceUserIdField] : req.params.userId;
  if (req.user._id.toString() !== resourceUserId.toString() && req.profile.role !== 'admin') {
    return res.status(403).json({ status: 'error', message: 'Access denied. You can only access your own resources.' });
  }
  next();
};
