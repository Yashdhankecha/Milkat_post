import express from 'express';
import { body, validationResult } from 'express-validator';
import Property from '../models/Property.js';
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

// Get all properties with filters
router.get('/',
  optionalAuth,
  catchAsync(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    const filters = {
      city: req.query.city,
      state: req.query.state,
      country: req.query.country,
      propertyType: req.query.propertyType,
      listingType: req.query.listingType,
      minPrice: req.query.minPrice ? parseInt(req.query.minPrice) : undefined,
      maxPrice: req.query.maxPrice ? parseInt(req.query.maxPrice) : undefined,
      minArea: req.query.minArea ? parseInt(req.query.minArea) : undefined,
      maxArea: req.query.maxArea ? parseInt(req.query.maxArea) : undefined,
      amenities: req.query.amenities ? req.query.amenities.split(',') : undefined,
      search: req.query.search,
      sort: req.query.sort,
      order: req.query.order,
      status: req.query.status || 'active',
      owner_id: req.query.owner_id
    };

    const properties = await Property.searchProperties(filters, page, limit);
    const total = await Property.countProperties(filters);

    res.status(200).json({
      status: 'success',
      data: {
        properties,
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

// Get property by ID
router.get('/:id',
  optionalAuth,
  catchAsync(async (req, res) => {
    const property = await Property.findById(req.params.id)
      .populate('owner', 'phone profile')
      .populate('broker', 'phone profile');

    if (!property) {
      return res.status(404).json({
        status: 'error',
        message: 'Property not found'
      });
    }

    // Increment views
    await property.incrementViews();

    res.status(200).json({
      status: 'success',
      data: { property }
    });
  })
);

// Create new property
router.post('/',
  authenticate,
  authorize('buyer_seller', 'broker', 'developer', 'society_owner'),
  [
    body('title')
      .trim()
      .isLength({ min: 5, max: 200 })
      .withMessage('Title must be between 5 and 200 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 2000 })
      .withMessage('Description must not exceed 2000 characters'),
    body('propertyType')
      .isIn(['apartment', 'villa', 'house', 'plot', 'commercial', 'office', 'shop', 'warehouse', 'other'])
      .withMessage('Invalid property type'),
    body('listingType')
      .isIn(['sale', 'rent', 'lease'])
      .withMessage('Invalid listing type'),
    body('price')
      .isNumeric()
      .isFloat({ min: 0 })
      .withMessage('Price must be a positive number'),
    body('area')
      .isNumeric()
      .isFloat({ min: 0 })
      .withMessage('Area must be a positive number'),
    body('location.address')
      .trim()
      .isLength({ min: 5, max: 500 })
      .withMessage('Address must be between 5 and 500 characters'),
    body('location.city')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('City must be between 2 and 100 characters'),
    body('location.state')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('State must be between 2 and 100 characters')
  ],
  validateRequest,
  catchAsync(async (req, res) => {
    const propertyData = {
      ...req.body,
      owner: req.user._id
    };

    const property = new Property(propertyData);
    await property.save();

    res.status(201).json({
      status: 'success',
      message: 'Property created successfully',
      data: { property }
    });
  })
);

// Update property
router.put('/:id',
  authenticate,
  [
    body('title')
      .optional()
      .trim()
      .isLength({ min: 5, max: 200 })
      .withMessage('Title must be between 5 and 200 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 2000 })
      .withMessage('Description must not exceed 2000 characters'),
    body('price')
      .optional()
      .isNumeric()
      .isFloat({ min: 0 })
      .withMessage('Price must be a positive number'),
    body('area')
      .optional()
      .isNumeric()
      .isFloat({ min: 0 })
      .withMessage('Area must be a positive number')
  ],
  validateRequest,
  catchAsync(async (req, res) => {
    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({
        status: 'error',
        message: 'Property not found'
      });
    }

    // Check ownership or admin role
    if (property.owner.toString() !== req.user._id.toString() && req.profile.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. You can only update your own properties.'
      });
    }

    const allowedUpdates = [
      'title', 'description', 'propertyType', 'listingType', 'price', 'monthlyRent',
      'securityDeposit', 'maintenanceCost', 'area', 'builtUpArea', 'carpetArea',
      'location', 'amenities', 'furnishedStatus', 'floorNumber', 'totalFloors',
      'facing', 'age', 'availableFrom', 'leaseTerm', 'minLeasePeriod', 'status'
    ];

    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const updatedProperty = await Property.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      status: 'success',
      message: 'Property updated successfully',
      data: { property: updatedProperty }
    });
  })
);

// Delete property
router.delete('/:id',
  authenticate,
  catchAsync(async (req, res) => {
    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({
        status: 'error',
        message: 'Property not found'
      });
    }

    // Check ownership or admin role
    if (property.owner.toString() !== req.user._id.toString() && req.profile.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. You can only delete your own properties.'
      });
    }

    await Property.findByIdAndDelete(req.params.id);

    res.status(200).json({
      status: 'success',
      message: 'Property deleted successfully'
    });
  })
);

// Get user's properties
router.get('/my/properties',
  authenticate,
  catchAsync(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const properties = await Property.find({ owner: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Property.countDocuments({ owner: req.user._id });

    res.status(200).json({
      status: 'success',
      data: {
        properties,
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

// Add image to property
router.post('/:id/images',
  authenticate,
  catchAsync(async (req, res) => {
    const { url, caption, isPrimary } = req.body;

    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({
        status: 'error',
        message: 'Property not found'
      });
    }

    // Check ownership
    if (property.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. You can only add images to your own properties.'
      });
    }

    await property.addImage(url, caption, isPrimary);

    res.status(200).json({
      status: 'success',
      message: 'Image added successfully',
      data: { property }
    });
  })
);

// Set primary image
router.put('/:id/images/:imageId/primary',
  authenticate,
  catchAsync(async (req, res) => {
    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({
        status: 'error',
        message: 'Property not found'
      });
    }

    // Check ownership
    if (property.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. You can only modify your own properties.'
      });
    }

    await property.setPrimaryImage(req.params.imageId);

    res.status(200).json({
      status: 'success',
      message: 'Primary image updated successfully',
      data: { property }
    });
  })
);

// Remove image from property
router.delete('/:id/images/:imageId',
  authenticate,
  catchAsync(async (req, res) => {
    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({
        status: 'error',
        message: 'Property not found'
      });
    }

    // Check ownership
    if (property.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. You can only modify your own properties.'
      });
    }

    await property.removeImage(req.params.imageId);

    res.status(200).json({
      status: 'success',
      message: 'Image removed successfully',
      data: { property }
    });
  })
);

export default router;
