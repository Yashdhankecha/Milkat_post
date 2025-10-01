import express from 'express';
import { body, validationResult } from 'express-validator';
import Developer from '../models/Developer.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { catchAsync } from '../middleware/errorHandler.js';

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

// Get all developers with filters
router.get('/',
  catchAsync(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    const filters = {
      city: req.query.city,
      state: req.query.state,
      specialization: req.query.specialization ? req.query.specialization.split(',') : undefined,
      minExperience: req.query.minExperience ? parseInt(req.query.minExperience) : undefined,
      status: req.query.status || 'active'
    };

    const developers = await Developer.searchDevelopers(filters, page, limit);
    const total = await Developer.countDocuments(filters);

    res.status(200).json({
      status: 'success',
      data: {
        developers,
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

// Get developer by ID
router.get('/:id',
  catchAsync(async (req, res) => {
    const developer = await Developer.findById(req.params.id)
      .populate('user', 'phone email isVerified');

    if (!developer) {
      return res.status(404).json({
        status: 'error',
        message: 'Developer not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: { developer }
    });
  })
);

// Create developer profile
router.post('/',
  authenticate,
  [
    body('companyName')
      .trim()
      .isLength({ min: 2, max: 200 })
      .withMessage('Company name must be between 2 and 200 characters'),
    body('companyDescription')
      .optional()
      .trim()
      .isLength({ max: 2000 })
      .withMessage('Company description must not exceed 2000 characters'),
    body('establishedYear')
      .optional()
      .isInt({ min: 1900, max: new Date().getFullYear() })
      .withMessage('Invalid established year'),
    body('website')
      .optional()
      .isURL()
      .withMessage('Invalid website URL')
  ],
  validateRequest,
  catchAsync(async (req, res) => {
    // Check if developer profile already exists
    const existingDeveloper = await Developer.findOne({ user: req.user._id });
    
    if (existingDeveloper) {
      return res.status(400).json({
        status: 'error',
        message: 'Developer profile already exists'
      });
    }

    // Import Profile model
    const Profile = (await import('../models/Profile.js')).default;
    
    // Check if user has developer role, if not create it
    let profile = await Profile.findOne({ user: req.user._id, role: 'developer' });
    
    if (!profile) {
      // Create developer role for the user
      profile = new Profile({
        user: req.user._id,
        role: 'developer',
        fullName: req.body.companyName || req.user.phone,
        companyName: req.body.companyName,
        status: 'active',
        verificationStatus: 'pending'
      });
      
      await profile.save();
      
      // Update user's current role to developer
      req.user.currentRole = 'developer';
      req.user.activeRole = 'developer';
      await req.user.save();
      
      console.log(`Created developer role for user ${req.user._id}`);
    }

    const developerData = {
      ...req.body,
      user: req.user._id
    };

    const developer = new Developer(developerData);
    await developer.save();

    res.status(201).json({
      status: 'success',
      message: 'Developer profile created successfully',
      data: { developer }
    });
  })
);

// Update developer profile
router.put('/:id',
  authenticate,
  [
    body('companyName')
      .optional()
      .trim()
      .isLength({ min: 2, max: 200 })
      .withMessage('Company name must be between 2 and 200 characters'),
    body('companyDescription')
      .optional()
      .trim()
      .isLength({ max: 2000 })
      .withMessage('Company description must not exceed 2000 characters'),
    body('website')
      .optional()
      .isURL()
      .withMessage('Invalid website URL')
  ],
  validateRequest,
  catchAsync(async (req, res) => {
    const developer = await Developer.findById(req.params.id);

    if (!developer) {
      return res.status(404).json({
        status: 'error',
        message: 'Developer profile not found'
      });
    }

    // Check ownership or admin role
    if (developer.user.toString() !== req.user._id.toString() && req.profile.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. You can only update your own profile.'
      });
    }

    const allowedUpdates = [
      'companyName', 'companyDescription', 'establishedYear', 'website',
      'contactInfo', 'socialMedia', 'businessType', 'registrationNumber',
      'panNumber', 'gstNumber', 'reraRegistration', 'specializations',
      'serviceAreas', 'languages', 'certifications', 'awards', 'team'
    ];

    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const updatedDeveloper = await Developer.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      status: 'success',
      message: 'Developer profile updated successfully',
      data: { developer: updatedDeveloper }
    });
  })
);

// Get my developer profile
router.get('/my/profile',
  authenticate,
  catchAsync(async (req, res) => {
    const developer = await Developer.findOne({ user: req.user._id })
      .populate('user', 'phone email isVerified');

    if (!developer) {
      return res.status(404).json({
        status: 'error',
        message: 'Developer profile not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: { developer }
    });
  })
);

export default router;
