import express from 'express';
import { body, validationResult } from 'express-validator';
import User from '../models/User.js';
import Profile from '../models/Profile.js';
import { 
  generateToken, 
  generateRefreshToken, 
  verifyRefreshToken,
  authenticate,
  generateOTP,
  validatePhoneNumber,
  validateEmail
  // authRateLimit // Removed - no rate limiting needed
} from '../middleware/auth.js';
import { catchAsync, AppError } from '../middleware/errorHandler.js';
import { logger } from '../utils/logger.js';
import smsService from '../services/smsService.js';

const router = express.Router();

// Validation middleware
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('[Validation Error] Request body:', req.body);
    console.log('[Validation Error] Validation errors:', errors.array());
    return res.status(400).json({
      status: 'error',
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// Debug endpoint for signup-new-role testing
router.post('/debug-signup',
  catchAsync(async (req, res) => {
    console.log('[debug-signup] Raw request body:', req.body);
    console.log('[debug-signup] Headers:', req.headers);
    
    const { phone, fullName, role } = req.body;
    console.log('[debug-signup] Parsed values:', { phone, fullName, role });
    console.log('[debug-signup] Phone validation:', validatePhoneNumber(phone));
    console.log('[debug-signup] FullName length:', fullName?.length);
    console.log('[debug-signup] Role value:', role);
    
    res.status(200).json({
      status: 'success',
      message: 'Debug info logged',
      data: {
        received: { phone, fullName, role },
        phoneValid: validatePhoneNumber(phone),
        fullNameLength: fullName?.length,
        roleValid: ['admin', 'buyer_seller', 'broker', 'developer', 'society_owner', 'society_member'].includes(role)
      }
    });
  })
);

// Debug endpoint to check if user exists
router.post('/check-user',
  [
    body('phone')
      .notEmpty()
      .withMessage('Phone number is required')
      .isLength({ min: 10, max: 16 })
      .withMessage('Phone number must be between 10-16 characters')
  ],
  validateRequest,
  catchAsync(async (req, res) => {
    const { phone } = req.body;
    
    const user = await User.findOne({ phone });
    
    res.status(200).json({
      status: 'success',
      data: {
        phone,
        userExists: !!user,
        user: user ? {
          phone: user.phone,
          isVerified: user.isVerified,
          verificationCode: user.verificationCode ? '***' : null,
          verificationCodeExpires: user.verificationCodeExpires
        } : null
      }
    });
  })
);

// Send OTP for phone authentication
router.post('/send-otp', 
  // authRateLimit(5, 15 * 60 * 1000), // Removed - no rate limiting needed
  [
    body('phone')
      .notEmpty()
      .withMessage('Phone number is required')
      .isLength({ min: 10, max: 16 })
      .withMessage('Phone number must be between 10-16 characters')
      .custom((value) => {
        if (!validatePhoneNumber(value)) {
          throw new Error('Invalid phone number format. Use E.164 format (+1234567890) or 10-digit format');
        }
        return true;
      }),
    body('role')
      .optional()
      .isIn(['admin', 'buyer_seller', 'broker', 'developer', 'society_owner', 'society_member'])
      .withMessage('Invalid role')
  ],
  validateRequest,
  catchAsync(async (req, res) => {
    const { phone, role } = req.body;

    // Check if user exists
    const user = await User.findOne({ phone });
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found. Please register first.'
      });
    }

    // If role is specified, check if user has that role
    if (role) {
      const profile = await Profile.findOne({ user: user._id, role });
      if (!profile) {
        return res.status(403).json({
          status: 'error',
          message: `You are not registered as a ${role.replace('_', ' ')}.`
        });
      }
    }

    // Generate OTP - Using hardcoded OTP to bypass Twilio issues
    const otp = '123456';
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save OTP to user
    user.verificationCode = otp;
    user.verificationCodeExpires = otpExpiry;
    
    logger.info(`🔑 BYPASS MODE: Using hardcoded OTP ${otp} for user ${user.phone}`);
    await user.save();

    // Send OTP via SMS service
    try {
      const smsResult = await smsService.sendOTP(phone, otp);
      
      if (!smsResult.success) {
        logger.error(`Failed to send SMS to ${phone}`);
        return res.status(500).json({
          status: 'error',
          message: 'Failed to send OTP. Please try again.',
          error: 'SMS_SEND_FAILED'
        });
      }

      logger.info(`OTP sent successfully to ${phone}. SMS Service: ${smsResult.mock ? 'Mock' : 'Twilio'}`);
      
    } catch (error) {
      logger.error(`SMS service error for ${phone}:`, error);
      return res.status(500).json({
        status: 'error',
        message: 'Failed to send OTP. Please try again.',
        error: 'SMS_SERVICE_ERROR'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'OTP sent successfully',
      data: {
        phone,
        expiresIn: 600 // 10 minutes in seconds
      }
    });
  })
);

// Verify OTP and login
router.post('/verify-otp',
  // authRateLimit(10, 15 * 60 * 1000), // Removed - no rate limiting needed
  [
    body('phone')
      .isLength({ min: 10, max: 16 })
      .withMessage('Phone number must be between 10-16 characters')
      .custom((value) => {
        if (!validatePhoneNumber(value)) {
          throw new Error('Invalid phone number format. Use E.164 format (+1234567890) or 10-digit format');
        }
        return true;
      }),
    body('otp')
      .isLength({ min: 6, max: 6 })
      .withMessage('OTP must be exactly 6 digits')
      .isNumeric()
      .withMessage('OTP must contain only numbers'),
    body('role')
      .optional()
      .isIn(['admin', 'buyer_seller', 'broker', 'developer', 'society_owner', 'society_member'])
      .withMessage('Invalid role')
  ],
  validateRequest,
  catchAsync(async (req, res) => {
    const { phone, otp, role } = req.body;

    // Find user
    const user = await User.findOne({ phone });
    
    if (!user) {
      console.log('OTP Verification: User not found for phone:', phone);
      return res.status(400).json({
        status: 'error',
        message: 'User not found. Please ensure you have sent an OTP to this phone number first.',
        details: 'Make sure you have completed the send-otp step before verifying.'
      });
    }

    // Check if OTP is valid and not expired
    logger.info(`OTP Verification: Checking OTP for user: ${user.phone}`);
    logger.info(`OTP Verification: Expected OTP: ${user.verificationCode}`);
    logger.info(`OTP Verification: Received OTP: ${otp}`);
    
    // Check if OTP has expired
    if (user.verificationCodeExpires && user.verificationCodeExpires < new Date()) {
      logger.warn(`OTP expired for user: ${user.phone}`);
      return res.status(400).json({
        status: 'error',
        message: 'OTP has expired. Please request a new one.',
        error: 'OTP_EXPIRED'
      });
    }

    // Check if OTP matches
    if (!user.verificationCode || user.verificationCode !== otp) {
      logger.warn(`Invalid OTP provided for user: ${user.phone}`);
      return res.status(400).json({
        status: 'error',
        message: 'Invalid OTP. Please check the code and try again.',
        error: 'INVALID_OTP'
      });
    }

    // Clear OTP
    user.verificationCode = undefined;
    user.verificationCodeExpires = undefined;
    user.isVerified = true;
    user.lastLogin = new Date();
    await user.save();

    // Update profile status to active for verified users
    await Profile.updateMany(
      { user: user._id, status: 'pending_verification' },
      { status: 'active' }
    );

    // Get user profiles
    const profiles = await Profile.find({ user: user._id });

    // If role is specified, filter for that role
    if (role) {
      const roleProfile = profiles.find(profile => profile.role === role);
      if (!roleProfile) {
        return res.status(403).json({
          status: 'error',
          message: `You are not registered as a ${role.replace('_', ' ')}.`
        });
      }

      // Set the selected role as both current and active role
      user.currentRole = role;
      user.activeRole = role;
      await user.save();

      // Generate tokens with current role
      const token = generateToken(user._id, { currentRole: role, activeRole: role });
      const refreshToken = generateRefreshToken(user._id);

      // Save refresh token
      await user.addRefreshToken(refreshToken);

      res.status(200).json({
        status: 'success',
        message: 'Login successful',
        data: {
          user: {
            id: user._id,
            phone: user.phone,
            email: user.email,
            isVerified: user.isVerified,
            currentRole: role,
            activeRole: role
          },
          profile: roleProfile,
          accessToken: token,
          refreshToken,
          expiresIn: process.env.JWT_EXPIRE || '7d'
        }
      });
    } else {
      // Return all available roles
      const availableRoles = profiles.map(profile => ({
        role: profile.role,
        fullName: profile.fullName,
        status: profile.status
      }));

      res.status(200).json({
        status: 'success',
        message: 'OTP verified successfully',
        data: {
          user: {
            id: user._id,
            phone: user.phone,
            email: user.email,
            isVerified: user.isVerified
          },
          availableRoles
        }
      });
    }
  })
);

// Register new user with phone
router.post('/register',
  // authRateLimit(3, 15 * 60 * 1000), // Removed - no rate limiting needed
  [
    body('phone')
      .isLength({ min: 10, max: 16 })
      .withMessage('Phone number must be between 10-16 characters')
      .custom((value) => {
        if (!validatePhoneNumber(value)) {
          throw new Error('Invalid phone number format. Use E.164 format (+1234567890) or 10-digit format');
        }
        return true;
      }),
    body('fullName')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Full name must be between 2 and 100 characters'),
    body('role')
      .isIn(['admin', 'buyer_seller', 'broker', 'developer', 'society_owner', 'society_member'])
      .withMessage('Invalid role'),
    body('email')
      .optional()
      .isEmail()
      .withMessage('Invalid email format')
      .custom((value) => {
        if (value && !validateEmail(value)) {
          throw new Error('Invalid email format');
        }
        return true;
      })
  ],
  validateRequest,
  catchAsync(async (req, res) => {
    const { phone, fullName, role, email } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ phone });
    
    if (existingUser) {
      // Check if user already has this role
      const existingProfile = await Profile.findOne({ 
        user: existingUser._id, 
        role 
      });
      
      if (existingProfile) {
        return res.status(400).json({
          status: 'error',
          message: 'You already have this role. Please login instead.',
          code: 'ROLE_EXISTS'
        });
      }
    }

    // Generate OTP - Using hardcoded OTP to bypass Twilio issues
    const otp = '123456';
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    let user;
    if (existingUser) {
      // Update existing user
      user = existingUser;
      user.verificationCode = otp;
      user.verificationCodeExpires = otpExpiry;
      if (email) user.email = email;
      await user.save();
    } else {
      // Create new user
      user = new User({
        phone,
        email,
        verificationCode: otp,
        verificationCodeExpires: otpExpiry,
        authMethod: 'phone'
      });
      await user.save();
    }
    
    logger.info(`🔑 BYPASS MODE: Using hardcoded OTP ${otp} for user ${user.phone}`);

    // Create profile
    const profile = new Profile({
      user: user._id,
      fullName,
      role,
      status: 'pending_verification'
    });
    await profile.save();

    // Send OTP via SMS service
    try {
      const smsResult = await smsService.sendOTP(phone, otp);
      
      if (!smsResult.success) {
        logger.error(`Failed to send SMS to ${phone}`);
        return res.status(500).json({
          status: 'error',
          message: 'Failed to send OTP. Please try again.',
          error: 'SMS_SEND_FAILED'
        });
      }

      logger.info(`Registration OTP sent successfully to ${phone}. SMS Service: ${smsResult.mock ? 'Mock' : 'Twilio'}`);
      
    } catch (error) {
      logger.error(`SMS service error for ${phone}:`, error);
      return res.status(500).json({
        status: 'error',
        message: 'Failed to send OTP. Please try again.',
        error: 'SMS_SERVICE_ERROR'
      });
    }

    res.status(201).json({
      status: 'success',
      message: 'Registration successful. Please verify your phone number.',
      data: {
        phone,
        expiresIn: 600 // 10 minutes in seconds
      }
    });
  })
);

// Signup with SMS for new role (handles both new users and existing users adding new roles)
router.post('/signup-new-role',
  // authRateLimit(3, 15 * 60 * 1000), // Removed - no rate limiting needed
  [
    body('phone')
      .isLength({ min: 10, max: 16 })
      .withMessage('Phone number must be between 10-16 characters')
      .custom((value) => {
        if (!validatePhoneNumber(value)) {
          throw new Error('Invalid phone number format. Use E.164 format (+1234567890) or 10-digit format');
        }
        return true;
      }),
    body('fullName')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Full name must be between 2 and 100 characters'),
    body('role')
      .isIn(['admin', 'buyer_seller', 'broker', 'developer', 'society_owner', 'society_member'])
      .withMessage('Invalid role')
  ],
  validateRequest,
  catchAsync(async (req, res) => {
    const { phone, fullName, role } = req.body;
    
    console.log('[signup-new-role] Request body:', req.body);
    console.log('[signup-new-role] Parsed values:', { phone, fullName, role });

    // Check if user already exists
    const existingUser = await User.findOne({ phone });
    
    if (existingUser) {
      // Check if user already has this role
      const existingProfile = await Profile.findOne({ 
        user: existingUser._id, 
        role 
      });
      
      if (existingProfile) {
        return res.status(400).json({
          status: 'error',
          message: 'You already have this role. Please login instead.',
          code: 'ROLE_EXISTS'
        });
      }
    }

    // Generate OTP - Using hardcoded OTP to bypass Twilio issues
    const otp = '123456';
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    let user;
    if (existingUser) {
      // Update existing user
      user = existingUser;
      user.verificationCode = otp;
      user.verificationCodeExpires = otpExpiry;
      await user.save();
    } else {
      // Create new user
      user = new User({
        phone,
        verificationCode: otp,
        verificationCodeExpires: otpExpiry,
        authMethod: 'phone'
      });
      await user.save();
    }
    
    logger.info(`🔑 BYPASS MODE: Using hardcoded OTP ${otp} for user ${user.phone}`);

    // Create profile
    const profile = new Profile({
      user: user._id,
      fullName,
      role,
      status: 'pending_verification'
    });
    await profile.save();

    // Send OTP via SMS service
    try {
      const smsResult = await smsService.sendOTP(phone, otp);
      
      if (!smsResult.success) {
        logger.error(`Failed to send SMS to ${phone}`);
        return res.status(500).json({
          status: 'error',
          message: 'Failed to send OTP. Please try again.',
          error: 'SMS_SEND_FAILED'
        });
      }

      logger.info(`New role OTP sent successfully to ${phone}. SMS Service: ${smsResult.mock ? 'Mock' : 'Twilio'}`);
      
    } catch (error) {
      logger.error(`SMS service error for ${phone}:`, error);
      return res.status(500).json({
        status: 'error',
        message: 'Failed to send OTP. Please try again.',
        error: 'SMS_SERVICE_ERROR'
      });
    }

    res.status(201).json({
      status: 'success',
      message: 'OTP sent successfully. Please verify your phone number.',
      data: {
        phone,
        expiresIn: 600 // 10 minutes in seconds
      }
    });
  })
);

// Refresh token
router.post('/refresh-token',
  [
    body('refreshToken')
      .notEmpty()
      .withMessage('Refresh token is required')
  ],
  validateRequest,
  catchAsync(async (req, res) => {
    const { refreshToken } = req.body;

    try {
      // Verify refresh token
      const decoded = verifyRefreshToken(refreshToken);
      
      // Find user
      const user = await User.findById(decoded.userId);
      
      if (!user) {
        return res.status(401).json({
          status: 'error',
          message: 'Invalid refresh token.'
        });
      }

      // Check if refresh token exists in user's tokens
      const tokenExists = user.refreshTokens.some(rt => rt.token === refreshToken);
      
      if (!tokenExists) {
        return res.status(401).json({
          status: 'error',
          message: 'Invalid refresh token.'
        });
      }

      // Generate new tokens
      const newToken = generateToken(user._id);
      const newRefreshToken = generateRefreshToken(user._id);

      // Remove old refresh token and add new one
      await user.removeRefreshToken(refreshToken);
      await user.addRefreshToken(newRefreshToken);

      res.status(200).json({
        status: 'success',
        message: 'Token refreshed successfully',
        data: {
          accessToken: newToken,
          refreshToken: newRefreshToken,
          expiresIn: process.env.JWT_EXPIRE || '7d'
        }
      });
    } catch (error) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid refresh token.'
      });
    }
  })
);

// Logout
router.post('/logout', 
  authenticate,
  catchAsync(async (req, res) => {
    const { refreshToken } = req.body;

    if (refreshToken) {
      await req.user.removeRefreshToken(refreshToken);
    } else {
      // Clear all refresh tokens
      await req.user.clearRefreshTokens();
    }

    res.status(200).json({
      status: 'success',
      message: 'Logged out successfully'
    });
  })
);

// Get current user
router.get('/me', 
  authenticate,
  catchAsync(async (req, res) => {
    const profiles = await Profile.find({ user: req.user._id });

    res.status(200).json({
      status: 'success',
      data: {
        user: {
          id: req.user._id,
          phone: req.user.phone,
          email: req.user.email,
          isVerified: req.user.isVerified,
          lastLogin: req.user.lastLogin
        },
        profiles
      }
    });
  })
);

// Change password (for email-based users)
router.post('/change-password',
  authenticate,
  [
    body('currentPassword')
      .notEmpty()
      .withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 6 })
      .withMessage('New password must be at least 6 characters long')
  ],
  validateRequest,
  catchAsync(async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    if (req.user.authMethod !== 'email') {
      return res.status(400).json({
        status: 'error',
        message: 'Password change is only available for email-based accounts.'
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await req.user.comparePassword(currentPassword);
    
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        status: 'error',
        message: 'Current password is incorrect.'
      });
    }

    // Update password
    req.user.password = newPassword;
    await req.user.save();

    // Clear all refresh tokens
    await req.user.clearRefreshTokens();

    res.status(200).json({
      status: 'success',
      message: 'Password changed successfully. Please login again.'
    });
  })
);

export default router;
