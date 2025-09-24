import express from 'express';
import { body, validationResult } from 'express-validator';
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

// Create inquiry
router.post('/',
  authenticate,
  [
    body('inquiryType')
      .isIn(['property_inquiry', 'project_inquiry', 'general_inquiry', 'broker_services', 'developer_services'])
      .withMessage('Invalid inquiry type'),
    body('subject')
      .trim()
      .isLength({ min: 5, max: 200 })
      .withMessage('Subject must be between 5 and 200 characters'),
    body('message')
      .trim()
      .isLength({ min: 10, max: 2000 })
      .withMessage('Message must be between 10 and 2000 characters'),
    body('contactPreference')
      .optional()
      .isIn(['phone', 'email', 'whatsapp'])
      .withMessage('Invalid contact preference')
  ],
  validateRequest,
  catchAsync(async (req, res) => {
    // This would be implemented with an Inquiry model
    // For now, returning a placeholder response
    res.status(201).json({
      status: 'success',
      message: 'Inquiry submitted successfully',
      data: {
        inquiryId: 'temp-id',
        status: 'pending'
      }
    });
  })
);

// Get my inquiries
router.get('/my',
  authenticate,
  catchAsync(async (req, res) => {
    // This would be implemented with an Inquiry model
    res.status(200).json({
      status: 'success',
      data: {
        inquiries: []
      }
    });
  })
);

export default router;
