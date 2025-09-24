import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticate } from '../middleware/auth.js';
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

// Create support ticket
router.post('/tickets',
  authenticate,
  [
    body('category')
      .isIn(['technical', 'billing', 'account', 'general', 'bug_report', 'feature_request'])
      .withMessage('Invalid category'),
    body('subject')
      .trim()
      .isLength({ min: 5, max: 200 })
      .withMessage('Subject must be between 5 and 200 characters'),
    body('description')
      .trim()
      .isLength({ min: 10, max: 2000 })
      .withMessage('Description must be between 10 and 2000 characters'),
    body('priority')
      .optional()
      .isIn(['low', 'medium', 'high', 'urgent'])
      .withMessage('Invalid priority')
  ],
  validateRequest,
  catchAsync(async (req, res) => {
    // This would be implemented with a SupportTicket model
    res.status(201).json({
      status: 'success',
      message: 'Support ticket created successfully',
      data: {
        ticketId: 'temp-id',
        status: 'open'
      }
    });
  })
);

// Get my support tickets
router.get('/tickets',
  authenticate,
  catchAsync(async (req, res) => {
    // This would be implemented with a SupportTicket model
    res.status(200).json({
      status: 'success',
      data: {
        tickets: []
      }
    });
  })
);

export default router;
