import express from 'express';
import { body, validationResult } from 'express-validator';
import Society from '../models/Society.js';
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

// Get all societies with filters
router.get('/',
  catchAsync(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    const filters = {
      city: req.query.city,
      state: req.query.state,
      societyType: req.query.societyType,
      status: req.query.status || 'active'
    };

    const societies = await Society.searchSocieties(filters, page, limit);
    const total = await Society.countDocuments(filters);

    res.status(200).json({
      status: 'success',
      data: {
        societies,
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

// Get society by ID
router.get('/:id',
  catchAsync(async (req, res) => {
    const society = await Society.findById(req.params.id)
      .populate('owner', 'phone profile');

    if (!society) {
      return res.status(404).json({
        status: 'error',
        message: 'Society not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: { society }
    });
  })
);

// Create new society
router.post('/',
  authenticate,
  authorize('society_owner'),
  [
    body('name')
      .trim()
      .isLength({ min: 5, max: 200 })
      .withMessage('Society name must be between 5 and 200 characters'),
    body('address')
      .trim()
      .isLength({ min: 5, max: 500 })
      .withMessage('Address must be between 5 and 500 characters'),
    body('city')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('City must be between 2 and 100 characters'),
    body('state')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('State must be between 2 and 100 characters'),
    body('totalFlats')
      .isInt({ min: 1 })
      .withMessage('Total flats must be a positive integer')
  ],
  validateRequest,
  catchAsync(async (req, res) => {
    const societyData = {
      ...req.body,
      owner: req.user._id
    };

    const society = new Society(societyData);
    await society.save();

    res.status(201).json({
      status: 'success',
      message: 'Society created successfully',
      data: { society }
    });
  })
);

// Update society
router.put('/:id',
  authenticate,
  [
    body('name')
      .optional()
      .trim()
      .isLength({ min: 5, max: 200 })
      .withMessage('Society name must be between 5 and 200 characters'),
    body('address')
      .optional()
      .trim()
      .isLength({ min: 5, max: 500 })
      .withMessage('Address must be between 5 and 500 characters')
  ],
  validateRequest,
  catchAsync(async (req, res) => {
    const society = await Society.findById(req.params.id);

    if (!society) {
      return res.status(404).json({
        status: 'error',
        message: 'Society not found'
      });
    }

    // Check ownership or admin role
    if (society.owner.toString() !== req.user._id.toString() && req.profile.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. You can only update your own societies.'
      });
    }

    const allowedUpdates = [
      'name', 'address', 'city', 'state', 'pincode', 'coordinates', 'societyType',
      'totalArea', 'totalFlats', 'numberOfBlocks', 'yearBuilt', 'registrationDate',
      'fsi', 'roadFacing', 'conditionStatus', 'amenities', 'contactPersonName',
      'contactPhone', 'contactEmail', 'status'
    ];

    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const updatedSociety = await Society.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      status: 'success',
      message: 'Society updated successfully',
      data: { society: updatedSociety }
    });
  })
);

// Delete society
router.delete('/:id',
  authenticate,
  catchAsync(async (req, res) => {
    const society = await Society.findById(req.params.id);

    if (!society) {
      return res.status(404).json({
        status: 'error',
        message: 'Society not found'
      });
    }

    // Check ownership or admin role
    if (society.owner.toString() !== req.user._id.toString() && req.profile.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. You can only delete your own societies.'
      });
    }

    await Society.findByIdAndDelete(req.params.id);

    res.status(200).json({
      status: 'success',
      message: 'Society deleted successfully'
    });
  })
);

// Get user's societies
router.get('/my/societies',
  authenticate,
  authorize('society_owner'),
  catchAsync(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const societies = await Society.find({ owner: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Society.countDocuments({ owner: req.user._id });

    res.status(200).json({
      status: 'success',
      data: {
        societies,
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

export default router;
