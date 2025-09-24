import express from 'express';
import { body, validationResult } from 'express-validator';
import Broker from '../models/Broker.js';
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

// Get all brokers with filters
router.get('/',
  catchAsync(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    const filters = {
      city: req.query.city,
      state: req.query.state,
      specialization: req.query.specialization ? req.query.specialization.split(',') : undefined,
      minExperience: req.query.minExperience ? parseInt(req.query.minExperience) : undefined,
      maxExperience: req.query.maxExperience ? parseInt(req.query.maxExperience) : undefined,
      status: req.query.status || 'active'
    };

    const brokers = await Broker.searchBrokers(filters, page, limit);
    const total = await Broker.countDocuments(filters);

    res.status(200).json({
      status: 'success',
      data: {
        brokers,
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

// Get broker by ID
router.get('/:id',
  catchAsync(async (req, res) => {
    const broker = await Broker.findById(req.params.id)
      .populate('user', 'phone email isVerified');

    if (!broker) {
      return res.status(404).json({
        status: 'error',
        message: 'Broker not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: { broker }
    });
  })
);

// Create broker profile
router.post('/',
  authenticate,
  authorize('broker'),
  [
    body('licenseNumber')
      .optional()
      .trim()
      .isLength({ min: 5, max: 50 })
      .withMessage('License number must be between 5 and 50 characters'),
    body('yearsExperience')
      .optional()
      .isInt({ min: 0, max: 50 })
      .withMessage('Years of experience must be between 0 and 50'),
    body('commissionRate')
      .optional()
      .isFloat({ min: 0, max: 100 })
      .withMessage('Commission rate must be between 0 and 100')
  ],
  validateRequest,
  catchAsync(async (req, res) => {
    // Check if broker profile already exists
    const existingBroker = await Broker.findOne({ user: req.user._id });
    
    if (existingBroker) {
      return res.status(400).json({
        status: 'error',
        message: 'Broker profile already exists'
      });
    }

    const brokerData = {
      ...req.body,
      user: req.user._id
    };

    const broker = new Broker(brokerData);
    await broker.save();

    res.status(201).json({
      status: 'success',
      message: 'Broker profile created successfully',
      data: { broker }
    });
  })
);

// Update broker profile
router.put('/:id',
  authenticate,
  [
    body('yearsExperience')
      .optional()
      .isInt({ min: 0, max: 50 })
      .withMessage('Years of experience must be between 0 and 50'),
    body('commissionRate')
      .optional()
      .isFloat({ min: 0, max: 100 })
      .withMessage('Commission rate must be between 0 and 100')
  ],
  validateRequest,
  catchAsync(async (req, res) => {
    const broker = await Broker.findById(req.params.id);

    if (!broker) {
      return res.status(404).json({
        status: 'error',
        message: 'Broker profile not found'
      });
    }

    // Check ownership or admin role
    if (broker.user.toString() !== req.user._id.toString() && req.profile.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. You can only update your own profile.'
      });
    }

    const allowedUpdates = [
      'licenseNumber', 'yearsExperience', 'specialization', 'commissionRate',
      'officeAddress', 'contactInfo', 'workingHours', 'serviceAreas',
      'languages', 'certifications', 'achievements'
    ];

    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const updatedBroker = await Broker.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      status: 'success',
      message: 'Broker profile updated successfully',
      data: { broker: updatedBroker }
    });
  })
);

// Get my broker profile
router.get('/my/profile',
  authenticate,
  authorize('broker'),
  catchAsync(async (req, res) => {
    const broker = await Broker.findOne({ user: req.user._id })
      .populate('user', 'phone email isVerified');

    if (!broker) {
      return res.status(404).json({
        status: 'error',
        message: 'Broker profile not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: { broker }
    });
  })
);

export default router;
