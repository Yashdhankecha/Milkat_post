import express from 'express';
import { body, validationResult } from 'express-validator';
import User from '../models/User.js';
import Profile from '../models/Profile.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { catchAsync, AppError } from '../middleware/errorHandler.js';

const router = express.Router();

// Validation middleware
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: 'error',
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// Get user profile
router.get('/profile',
  authenticate,
  catchAsync(async (req, res) => {
    const profile = await Profile.findOne({ user: req.user._id })
      .populate('user', 'phone email isVerified lastLogin');

    if (!profile) {
      return res.status(404).json({
        status: 'error',
        message: 'Profile not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: { profile }
    });
  })
);

// Update user profile
router.put('/profile',
  authenticate,
  [
    body('fullName')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Full name must be between 2 and 100 characters'),
    body('bio')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Bio must not exceed 500 characters'),
    body('businessType')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Business type must not exceed 100 characters'),
    body('companyName')
      .optional()
      .trim()
      .isLength({ max: 200 })
      .withMessage('Company name must not exceed 200 characters'),
    body('website')
      .optional()
      .isURL()
      .withMessage('Invalid website URL'),
    body('socialMedia.facebook')
      .optional()
      .isURL()
      .withMessage('Invalid Facebook URL'),
    body('socialMedia.twitter')
      .optional()
      .isURL()
      .withMessage('Invalid Twitter URL'),
    body('socialMedia.linkedin')
      .optional()
      .isURL()
      .withMessage('Invalid LinkedIn URL'),
    body('socialMedia.instagram')
      .optional()
      .isURL()
      .withMessage('Invalid Instagram URL'),
    body('socialMedia.youtube')
      .optional()
      .isURL()
      .withMessage('Invalid YouTube URL')
  ],
  validateRequest,
  catchAsync(async (req, res) => {
    const allowedUpdates = [
      'fullName', 'bio', 'businessType', 'companyName', 'website', 'socialMedia'
    ];
    
    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const profile = await Profile.findOneAndUpdate(
      { user: req.user._id },
      updates,
      { new: true, runValidators: true }
    );

    if (!profile) {
      return res.status(404).json({
        status: 'error',
        message: 'Profile not found'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Profile updated successfully',
      data: { profile }
    });
  })
);

// Get all user profiles (for multi-role users)
router.get('/profiles',
  authenticate,
  catchAsync(async (req, res) => {
    const profiles = await Profile.find({ user: req.user._id })
      .populate('user', 'phone email isVerified lastLogin');

    res.status(200).json({
      status: 'success',
      data: { profiles }
    });
  })
);

// Switch to specific role
router.post('/switch-role',
  authenticate,
  [
    body('role')
      .isIn(['admin', 'buyer_seller', 'broker', 'developer', 'society_owner', 'society_member'])
      .withMessage('Invalid role')
  ],
  validateRequest,
  catchAsync(async (req, res) => {
    const { role } = req.body;

    const profile = await Profile.findOne({ 
      user: req.user._id, 
      role 
    });

    if (!profile) {
      return res.status(404).json({
        status: 'error',
        message: `You don't have the ${role.replace('_', ' ')} role`
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Role switched successfully',
      data: { profile }
    });
  })
);

// Add verification document
router.post('/verification-documents',
  authenticate,
  [
    body('type')
      .isIn(['pan_card', 'aadhar_card', 'driving_license', 'passport', 'business_license', 'other'])
      .withMessage('Invalid document type'),
    body('url')
      .isURL()
      .withMessage('Invalid document URL')
  ],
  validateRequest,
  catchAsync(async (req, res) => {
    const { type, url } = req.body;

    const profile = await Profile.findOne({ user: req.user._id });
    
    if (!profile) {
      return res.status(404).json({
        status: 'error',
        message: 'Profile not found'
      });
    }

    await profile.addVerificationDocument(type, url);

    res.status(201).json({
      status: 'success',
      message: 'Verification document added successfully',
      data: { profile }
    });
  })
);

// Update notification preferences
router.put('/preferences/notifications',
  authenticate,
  [
    body('email')
      .optional()
      .isBoolean()
      .withMessage('Email preference must be boolean'),
    body('sms')
      .optional()
      .isBoolean()
      .withMessage('SMS preference must be boolean'),
    body('push')
      .optional()
      .isBoolean()
      .withMessage('Push preference must be boolean')
  ],
  validateRequest,
  catchAsync(async (req, res) => {
    const { email, sms, push } = req.body;

    const profile = await Profile.findOne({ user: req.user._id });
    
    if (!profile) {
      return res.status(404).json({
        status: 'error',
        message: 'Profile not found'
      });
    }

    if (email !== undefined) profile.preferences.notifications.email = email;
    if (sms !== undefined) profile.preferences.notifications.sms = sms;
    if (push !== undefined) profile.preferences.notifications.push = push;

    await profile.save();

    res.status(200).json({
      status: 'success',
      message: 'Notification preferences updated successfully',
      data: { profile }
    });
  })
);

// Update privacy preferences
router.put('/preferences/privacy',
  authenticate,
  [
    body('showPhone')
      .optional()
      .isBoolean()
      .withMessage('Show phone preference must be boolean'),
    body('showEmail')
      .optional()
      .isBoolean()
      .withMessage('Show email preference must be boolean'),
    body('showProfile')
      .optional()
      .isBoolean()
      .withMessage('Show profile preference must be boolean')
  ],
  validateRequest,
  catchAsync(async (req, res) => {
    const { showPhone, showEmail, showProfile } = req.body;

    const profile = await Profile.findOne({ user: req.user._id });
    
    if (!profile) {
      return res.status(404).json({
        status: 'error',
        message: 'Profile not found'
      });
    }

    if (showPhone !== undefined) profile.preferences.privacy.showPhone = showPhone;
    if (showEmail !== undefined) profile.preferences.privacy.showEmail = showEmail;
    if (showProfile !== undefined) profile.preferences.privacy.showProfile = showProfile;

    await profile.save();

    res.status(200).json({
      status: 'success',
      message: 'Privacy preferences updated successfully',
      data: { profile }
    });
  })
);

// Deactivate account
router.post('/deactivate',
  authenticate,
  catchAsync(async (req, res) => {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    user.isActive = false;
    await user.save();

    // Clear all refresh tokens
    await user.clearRefreshTokens();

    res.status(200).json({
      status: 'success',
      message: 'Account deactivated successfully'
    });
  })
);

// Admin routes
router.get('/admin/users',
  authenticate,
  authorize('admin'),
  catchAsync(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const users = await User.find()
      .select('-password -refreshTokens')
      .populate('profiles')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments();

    res.status(200).json({
      status: 'success',
      data: {
        users,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  })
);

// Suspend user
router.post('/admin/suspend/:userId',
  authenticate,
  authorize('admin'),
  [
    body('reason')
      .notEmpty()
      .withMessage('Suspension reason is required'),
    body('expiresAt')
      .optional()
      .isISO8601()
      .withMessage('Invalid expiration date')
  ],
  validateRequest,
  catchAsync(async (req, res) => {
    const { userId } = req.params;
    const { reason, expiresAt } = req.body;

    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    user.isSuspended = true;
    user.suspensionReason = reason;
    if (expiresAt) {
      user.suspensionExpires = new Date(expiresAt);
    }
    
    await user.save();

    // Clear all refresh tokens
    await user.clearRefreshTokens();

    res.status(200).json({
      status: 'success',
      message: 'User suspended successfully',
      data: { user }
    });
  })
);

// Unsuspend user
router.post('/admin/unsuspend/:userId',
  authenticate,
  authorize('admin'),
  catchAsync(async (req, res) => {
    const { userId } = req.params;

    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    user.isSuspended = false;
    user.suspensionReason = undefined;
    user.suspensionExpires = undefined;
    
    await user.save();

    res.status(200).json({
      status: 'success',
      message: 'User unsuspended successfully',
      data: { user }
    });
  })
);

export default router;
