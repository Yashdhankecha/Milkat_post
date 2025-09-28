import express from 'express';
import jwt from 'jsonwebtoken';
import Profile from '../models/Profile.js';
import User from '../models/User.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { catchAsync, AppError } from '../middleware/errorHandler.js';
import config from '../config-loader.js';

const router = express.Router();

// Get all available roles for a user
router.get('/my-roles',
  authenticate,
  catchAsync(async (req, res) => {
    const userId = req.user._id;
    
    const profiles = await Profile.find({ user: userId })
      .select('role status verificationStatus createdAt')
      .sort({ createdAt: -1 });

    const roles = profiles.map(profile => ({
      role: profile.role,
      status: profile.status,
      verificationStatus: profile.verificationStatus,
      createdAt: profile.createdAt
    }));

    res.status(200).json({
      status: 'success',
      data: {
        roles,
        totalRoles: roles.length
      }
    });
  })
);

// Get available roles for a phone number (for login page)
router.post('/available-roles',
  catchAsync(async (req, res) => {
    const { phone } = req.body;
    
    if (!phone) {
      return res.status(400).json({
        status: 'error',
        message: 'Phone number is required'
      });
    }

    // Find user by phone
    const user = await User.findOne({ phone }).select('_id');
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'No user found with this phone number'
      });
    }

    // Get all profiles for this user
    const profiles = await Profile.find({ user: user._id })
      .select('role status verificationStatus createdAt')
      .sort({ createdAt: -1 });

    const roles = profiles.map(profile => ({
      role: profile.role,
      status: profile.status,
      verificationStatus: profile.verificationStatus,
      createdAt: profile.createdAt
    }));

    res.status(200).json({
      status: 'success',
      data: {
        userId: user._id,
        roles,
        totalRoles: roles.length
      }
    });
  })
);

// Switch to a specific role
router.post('/switch-role',
  authenticate,
  catchAsync(async (req, res) => {
    const { role } = req.body;
    const userId = req.user._id;
    
    if (!role) {
      return res.status(400).json({
        status: 'error',
        message: 'Role is required'
      });
    }

    // Check if user has this role
    const profile = await Profile.findOne({ user: userId, role });
    
    if (!profile) {
      return res.status(404).json({
        status: 'error',
        message: 'You do not have access to this role'
      });
    }

    // Update the user's active role in the database
    const user = await User.findByIdAndUpdate(
      userId,
      { 
        currentRole: role,
        activeRole: role 
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Role switched successfully',
      data: {
        profile,
        activeRole: role,
        user: {
          id: user._id,
          activeRole: user.activeRole,
          currentRole: user.currentRole
        }
      }
    });
  })
);

// Create a new role for the user
router.post('/create-role',
  authenticate,
  catchAsync(async (req, res) => {
    const { role, fullName, companyName, businessType, bio, website } = req.body;
    const userId = req.user._id;
    
    if (!role) {
      return res.status(400).json({
        status: 'error',
        message: 'Role is required'
      });
    }

    // Check if user already has this role
    const existingProfile = await Profile.findOne({ user: userId, role });
    
    if (existingProfile) {
      return res.status(400).json({
        status: 'error',
        message: 'You already have this role'
      });
    }

    // Create new profile for this role
    const newProfile = new Profile({
      user: userId,
      role,
      fullName: fullName || req.user.phone, // Use phone as fallback
      companyName,
      businessType,
      bio,
      website,
      status: 'pending_verification',
      verificationStatus: 'unverified'
    });

    await newProfile.save();

    res.status(201).json({
      status: 'success',
      message: 'New role created successfully',
      data: {
        profile: newProfile
      }
    });
  })
);

// Get role statistics
router.get('/statistics',
  authenticate,
  catchAsync(async (req, res) => {
    const userId = req.user._id;
    
    const stats = await Profile.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 },
          latestCreated: { $max: '$createdAt' },
          status: { $first: '$status' },
          verificationStatus: { $first: '$verificationStatus' }
        }
      },
      {
        $project: {
          role: '$_id',
          count: 1,
          latestCreated: 1,
          status: 1,
          verificationStatus: 1,
          _id: 0
        }
      }
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        statistics: stats,
        totalRoles: stats.length
      }
    });
  })
);

export default router;
