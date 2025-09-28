import express from 'express';
import { body, validationResult } from 'express-validator';
import Share from '../models/Share.js';
import Property from '../models/Property.js';
import Notification from '../models/Notification.js';
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

// Share a property
router.post('/',
  authenticate,
  [
    body('propertyId')
      .isMongoId()
      .withMessage('Invalid property ID'),
    body('shareMethod')
      .isIn(['email', 'whatsapp', 'facebook', 'twitter', 'linkedin', 'copy_link', 'other'])
      .withMessage('Invalid share method'),
    body('sharedWith')
      .optional()
      .trim()
      .isLength({ max: 255 })
      .withMessage('Shared with field too long')
  ],
  validateRequest,
  catchAsync(async (req, res) => {
    const { propertyId, shareMethod, sharedWith } = req.body;
    const userId = req.user._id;

    // Check if property exists
    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({
        status: 'error',
        message: 'Property not found'
      });
    }

    // Create share record
    const share = new Share({
      user: userId,
      property: propertyId,
      shareMethod,
      sharedWith,
      metadata: {
        userAgent: req.get('User-Agent'),
        ipAddress: req.ip,
        referrer: req.get('Referer')
      }
    });
    await share.save();

    // Create notification for property owner (if different from sharer)
    if (property.user.toString() !== userId.toString()) {
      await Notification.createNotification({
        recipient: property.user,
        sender: userId,
        type: 'property_share',
        title: 'Property Shared',
        message: `Your property "${property.title}" was shared via ${shareMethod}`,
        data: {
          propertyId: propertyId,
          metadata: {
            shareMethod,
            sharedWith,
            sharerName: req.profile?.name || 'Anonymous User'
          }
        },
        priority: 'low'
      });
    }

    // Get updated share count
    const shareCount = await Share.getShareCount(propertyId);

    res.status(201).json({
      status: 'success',
      message: 'Property shared successfully',
      data: {
        share,
        shareCount
      }
    });
  })
);

// Get share count for a property
router.get('/count/:propertyId',
  catchAsync(async (req, res) => {
    const { propertyId } = req.params;

    const shareCount = await Share.getShareCount(propertyId);

    res.status(200).json({
      status: 'success',
      data: {
        shareCount
      }
    });
  })
);

// Get share count by method for a property
router.get('/count-by-method/:propertyId',
  catchAsync(async (req, res) => {
    const { propertyId } = req.params;

    const shareCounts = await Share.getShareCountByMethod(propertyId);

    res.status(200).json({
      status: 'success',
      data: {
        shareCounts
      }
    });
  })
);

// Get user's shared properties
router.get('/my-shares',
  authenticate,
  catchAsync(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const userId = req.user._id;

    const shares = await Share.getUserShares(userId, page, limit);
    const total = await Share.countDocuments({ user: userId });

    res.status(200).json({
      status: 'success',
      data: {
        shares,
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
