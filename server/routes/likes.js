import express from 'express';
import { body, validationResult } from 'express-validator';
import Like from '../models/Like.js';
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

// Like a property
router.post('/',
  authenticate,
  [
    body('propertyId')
      .isMongoId()
      .withMessage('Invalid property ID')
  ],
  validateRequest,
  catchAsync(async (req, res) => {
    const { propertyId } = req.body;
    const userId = req.user._id;

    // Check if property exists
    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({
        status: 'error',
        message: 'Property not found'
      });
    }

    // Check if user already liked this property
    const existingLike = await Like.findOne({ user: userId, property: propertyId });
    if (existingLike) {
      return res.status(400).json({
        status: 'error',
        message: 'Property already liked'
      });
    }

    // Create like
    const like = new Like({
      user: userId,
      property: propertyId
    });
    await like.save();

    // Create notification for property owner (if different from liker)
    if (property.user.toString() !== userId.toString()) {
      await Notification.createNotification({
        recipient: property.user,
        sender: userId,
        type: 'property_like',
        title: 'New Property Like',
        message: `Someone liked your property "${property.title}"`,
        data: {
          propertyId: propertyId,
          metadata: {
            likerName: req.profile?.name || 'Anonymous User'
          }
        },
        priority: 'low'
      });
    }

    // Get updated like count
    const likeCount = await Like.getLikeCount(propertyId);

    res.status(201).json({
      status: 'success',
      message: 'Property liked successfully',
      data: {
        like,
        likeCount
      }
    });
  })
);

// Unlike a property
router.delete('/:propertyId',
  authenticate,
  catchAsync(async (req, res) => {
    const { propertyId } = req.params;
    const userId = req.user._id;

    const like = await Like.findOneAndDelete({ user: userId, property: propertyId });
    
    if (!like) {
      return res.status(404).json({
        status: 'error',
        message: 'Like not found'
      });
    }

    // Get updated like count
    const likeCount = await Like.getLikeCount(propertyId);

    res.status(200).json({
      status: 'success',
      message: 'Property unliked successfully',
      data: {
        likeCount
      }
    });
  })
);

// Check if user liked a property
router.get('/check/:propertyId',
  authenticate,
  catchAsync(async (req, res) => {
    const { propertyId } = req.params;
    const userId = req.user._id;

    const hasLiked = await Like.hasUserLiked(userId, propertyId);

    res.status(200).json({
      status: 'success',
      data: {
        hasLiked: !!hasLiked
      }
    });
  })
);

// Get like count for a property
router.get('/count/:propertyId',
  catchAsync(async (req, res) => {
    const { propertyId } = req.params;

    const likeCount = await Like.getLikeCount(propertyId);

    res.status(200).json({
      status: 'success',
      data: {
        likeCount
      }
    });
  })
);

// Get user's liked properties
router.get('/my-likes',
  authenticate,
  catchAsync(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const userId = req.user._id;

    const likes = await Like.getUserLikes(userId, page, limit);
    const total = await Like.countDocuments({ user: userId });

    res.status(200).json({
      status: 'success',
      data: {
        likes,
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
