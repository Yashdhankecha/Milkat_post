import express from 'express';
import { body, validationResult } from 'express-validator';
import Requirement from '../models/Requirement.js';
import { authenticate, authorize, optionalAuth } from '../middleware/auth.js';
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

// Get all requirements with filters
router.get('/',
  optionalAuth,
  catchAsync(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    const filters = {
      city: req.query.city,
      state: req.query.state,
      propertyType: req.query.propertyType,
      purpose: req.query.purpose,
      minBudget: req.query.minBudget ? parseInt(req.query.minBudget) : undefined,
      maxBudget: req.query.maxBudget ? parseInt(req.query.maxBudget) : undefined,
      status: req.query.status || 'active'
    };

    const requirements = await Requirement.searchRequirements(filters, page, limit);
    const total = await Requirement.countDocuments(filters);

    res.status(200).json({
      status: 'success',
      data: {
        requirements,
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

// Get requirement by ID
router.get('/:id',
  optionalAuth,
  catchAsync(async (req, res) => {
    const requirement = await Requirement.findById(req.params.id)
      .populate('user', 'phone profile')
      .populate('matches.property', 'title price location images');

    if (!requirement) {
      return res.status(404).json({
        status: 'error',
        message: 'Requirement not found'
      });
    }

    // Increment views
    await requirement.incrementViews();

    res.status(200).json({
      status: 'success',
      data: { requirement }
    });
  })
);

// Create new requirement
router.post('/',
  authenticate,
  [
    body('purpose')
      .isIn(['buy', 'rent', 'lease', 'invest', 'other'])
      .withMessage('Invalid purpose'),
    body('propertyType')
      .isIn(['apartment', 'villa', 'house', 'plot', 'commercial', 'office', 'shop', 'warehouse', 'other'])
      .withMessage('Invalid property type'),
    body('location.city')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('City must be between 2 and 100 characters'),
    body('location.state')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('State must be between 2 and 100 characters'),
    body('contact.phone')
      .trim()
      .isLength({ min: 10, max: 15 })
      .withMessage('Phone number must be between 10 and 15 characters'),
    body('contact.email')
      .optional()
      .isEmail()
      .withMessage('Invalid email format'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Description must not exceed 1000 characters')
  ],
  validateRequest,
  catchAsync(async (req, res) => {
    try {
      console.log('📝 Creating requirement with data:', JSON.stringify(req.body, null, 2));
      
      // Transform flat field names to nested structure if needed
      const requirementData = {
        user: req.user._id,
        purpose: req.body.purpose,
        propertyType: req.body.propertyType,
        location: {
          city: req.body['location.city'] || req.body.location?.city || req.body.city,
          state: req.body['location.state'] || req.body.location?.state || req.body.state,
          area: req.body['location.area'] || req.body.location?.area || '',
          pincode: req.body['location.pincode'] || req.body.location?.pincode || ''
        },
        contact: {
          phone: req.body['contact.phone'] || req.body.contact?.phone || req.body.phone,
          email: req.body['contact.email'] || req.body.contact?.email || req.body.email,
          preferredTime: req.body['contact.preferredTime'] || req.body.contact?.preferredTime || req.body.preferredTime
        },
        budget: req.body.budget || {},
        area: req.body.area || {},
        description: req.body.description,
        preferences: req.body.preferences || {},
        amenities: req.body.amenities || [],
        status: req.body.status || 'active',
        priority: req.body.priority || 'medium',
        timeline: req.body.timeline || 'flexible'
      };

      console.log('📝 Transformed requirement data:', JSON.stringify(requirementData, null, 2));

      const requirement = new Requirement(requirementData);
      await requirement.save();

      console.log('✅ Requirement created successfully:', requirement._id);

      res.status(201).json({
        status: 'success',
        message: 'Requirement created successfully',
        data: { requirement }
      });
    } catch (error) {
      console.error('❌ Error creating requirement:', error);
      
      if (error.name === 'ValidationError') {
        const validationErrors = Object.values(error.errors).map(err => ({
          field: err.path,
          message: err.message,
          value: err.value
        }));
        
        console.error('📋 Validation errors:', validationErrors);
        
        return res.status(400).json({
          status: 'error',
          message: 'Validation failed',
          errors: validationErrors,
          details: error.message
        });
      }
      
      throw error;
    }
  })
);

// Update requirement
router.put('/:id',
  authenticate,
  [
    body('purpose')
      .optional()
      .isIn(['buy', 'rent', 'lease', 'invest', 'other'])
      .withMessage('Invalid purpose'),
    body('propertyType')
      .optional()
      .isIn(['apartment', 'villa', 'house', 'plot', 'commercial', 'office', 'shop', 'warehouse', 'other'])
      .withMessage('Invalid property type'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Description must not exceed 1000 characters')
  ],
  validateRequest,
  catchAsync(async (req, res) => {
    const requirement = await Requirement.findById(req.params.id);

    if (!requirement) {
      return res.status(404).json({
        status: 'error',
        message: 'Requirement not found'
      });
    }

    // Check ownership
    if (requirement.user.toString() !== req.user._id.toString() && req.profile.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. You can only update your own requirements.'
      });
    }

    const allowedUpdates = [
      'purpose', 'budget', 'propertyType', 'location', 'area', 'description',
      'preferences', 'amenities', 'contact', 'status', 'priority', 'timeline'
    ];

    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const updatedRequirement = await Requirement.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      status: 'success',
      message: 'Requirement updated successfully',
      data: { requirement: updatedRequirement }
    });
  })
);

// Delete requirement
router.delete('/:id',
  authenticate,
  catchAsync(async (req, res) => {
    const requirement = await Requirement.findById(req.params.id);

    if (!requirement) {
      return res.status(404).json({
        status: 'error',
        message: 'Requirement not found'
      });
    }

    // Check ownership
    if (requirement.user.toString() !== req.user._id.toString() && req.profile.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. You can only delete your own requirements.'
      });
    }

    await Requirement.findByIdAndDelete(req.params.id);

    res.status(200).json({
      status: 'success',
      message: 'Requirement deleted successfully'
    });
  })
);

// Get user's requirements
router.get('/my/requirements',
  authenticate,
  catchAsync(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const requirements = await Requirement.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Requirement.countDocuments({ user: req.user._id });

    res.status(200).json({
      status: 'success',
      data: {
        requirements,
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

// Add match to requirement
router.post('/:id/matches',
  authenticate,
  authorize('broker', 'developer', 'admin'),
  [
    body('propertyId')
      .isMongoId()
      .withMessage('Invalid property ID'),
    body('score')
      .isInt({ min: 0, max: 100 })
      .withMessage('Score must be between 0 and 100')
  ],
  validateRequest,
  catchAsync(async (req, res) => {
    const requirement = await Requirement.findById(req.params.id);

    if (!requirement) {
      return res.status(404).json({
        status: 'error',
        message: 'Requirement not found'
      });
    }

    await requirement.addMatch(req.body.propertyId, req.body.score);

    res.status(200).json({
      status: 'success',
      message: 'Match added successfully',
      data: { requirement }
    });
  })
);

export default router;
