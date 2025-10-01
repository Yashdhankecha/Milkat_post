import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth.js';
import { catchAsync } from '../middleware/errorHandler.js';
import Inquiry from '../models/Inquiry.js';
import Property from '../models/Property.js';
import Project from '../models/Project.js';

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
      .withMessage('Invalid contact preference'),
    body('propertyId')
      .optional()
      .isMongoId()
      .withMessage('Invalid property ID'),
    body('projectId')
      .optional()
      .isMongoId()
      .withMessage('Invalid project ID')
  ],
  validateRequest,
  catchAsync(async (req, res) => {
    const { inquiryType, subject, message, contactPreference, propertyId, projectId } = req.body;
    const userId = req.user._id;

    let propertyOwner = null;
    let projectOwner = null;

    // Validate and get property/project owner
    if (inquiryType === 'property_inquiry' && propertyId) {
      const property = await Property.findById(propertyId);
      if (!property) {
        return res.status(404).json({
          status: 'error',
          message: 'Property not found'
        });
      }
      propertyOwner = property.owner;
      
      // Increment inquiry count for the property
      await property.incrementInquiries();
    }

    if (inquiryType === 'project_inquiry' && projectId) {
      const project = await Project.findById(projectId);
      if (!project) {
        return res.status(404).json({
          status: 'error',
          message: 'Project not found'
        });
      }
      projectOwner = project.owner;
      
      // Increment inquiry count for the project
      await project.incrementInquiries();
    }

    // Create the inquiry
    const inquiry = new Inquiry({
      inquiryType,
      subject,
      message,
      contactPreference: contactPreference || 'phone',
      property: propertyId || undefined,
      project: projectId || undefined,
      inquirer: userId,
      propertyOwner,
      projectOwner,
      status: 'pending'
    });

    await inquiry.save();

    // Populate the inquiry for response
    await inquiry.populate([
      { path: 'property', select: 'title location price images' },
      { path: 'project', select: 'title location price images' },
      { path: 'propertyOwner', select: 'phone email' },
      { path: 'projectOwner', select: 'phone email' }
    ]);

    res.status(201).json({
      status: 'success',
      message: 'Inquiry submitted successfully',
      data: {
        inquiry: inquiry
      }
    });
  })
);

// Get my inquiries (inquiries I made)
router.get('/my',
  authenticate,
  catchAsync(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const userId = req.user._id;

    const inquiries = await Inquiry.getUserInquiries(userId, page, limit);
    const total = await Inquiry.countDocuments({ inquirer: userId });

    res.status(200).json({
      status: 'success',
      data: {
        inquiries,
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

// Get inquiries for my properties (inquiries I received)
router.get('/my-properties',
  authenticate,
  catchAsync(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const userId = req.user._id;

    const inquiries = await Inquiry.getPropertyOwnerInquiries(userId, page, limit);
    const total = await Inquiry.countDocuments({ propertyOwner: userId });

    res.status(200).json({
      status: 'success',
      data: {
        inquiries,
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

// Get inquiries for my projects (inquiries I received)
router.get('/my-projects',
  authenticate,
  catchAsync(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const userId = req.user._id;

    const inquiries = await Inquiry.getProjectOwnerInquiries(userId, page, limit);
    const total = await Inquiry.countDocuments({ projectOwner: userId });

    res.status(200).json({
      status: 'success',
      data: {
        inquiries,
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

// Get inquiries for a specific property
router.get('/property/:propertyId',
  authenticate,
  catchAsync(async (req, res) => {
    const { propertyId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const userId = req.user._id;

    // Check if user owns the property
    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({
        status: 'error',
        message: 'Property not found'
      });
    }

    if (property.owner.toString() !== userId.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'You are not authorized to view inquiries for this property'
      });
    }

    const inquiries = await Inquiry.getPropertyInquiries(propertyId, page, limit);
    const total = await Inquiry.countDocuments({ property: propertyId });

    res.status(200).json({
      status: 'success',
      data: {
        inquiries,
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

// Respond to an inquiry
router.put('/:inquiryId/respond',
  authenticate,
  [
    body('response')
      .trim()
      .isLength({ min: 10, max: 2000 })
      .withMessage('Response must be between 10 and 2000 characters')
  ],
  validateRequest,
  catchAsync(async (req, res) => {
    const { inquiryId } = req.params;
    const { response } = req.body;
    const userId = req.user._id;

    const inquiry = await Inquiry.findById(inquiryId);
    if (!inquiry) {
      return res.status(404).json({
        status: 'error',
        message: 'Inquiry not found'
      });
    }

    // Check if user is authorized to respond (property/project owner)
    const isPropertyOwner = inquiry.propertyOwner && inquiry.propertyOwner.toString() === userId.toString();
    const isProjectOwner = inquiry.projectOwner && inquiry.projectOwner.toString() === userId.toString();
    
    if (!isPropertyOwner && !isProjectOwner) {
      return res.status(403).json({
        status: 'error',
        message: 'You are not authorized to respond to this inquiry'
      });
    }

    await inquiry.respond(response, userId);
    await inquiry.populate([
      { path: 'inquirer', select: 'phone email' },
      { path: 'property', select: 'title location price images' },
      { path: 'project', select: 'title location price images' },
      { path: 'response.respondedBy', select: 'phone email' }
    ]);

    res.status(200).json({
      status: 'success',
      message: 'Response sent successfully',
      data: {
        inquiry
      }
    });
  })
);

// Update inquiry status
router.put('/:inquiryId/status',
  authenticate,
  [
    body('status')
      .isIn(['pending', 'responded', 'closed', 'spam'])
      .withMessage('Invalid status')
  ],
  validateRequest,
  catchAsync(async (req, res) => {
    const { inquiryId } = req.params;
    const { status } = req.body;
    const userId = req.user._id;

    const inquiry = await Inquiry.findById(inquiryId);
    if (!inquiry) {
      return res.status(404).json({
        status: 'error',
        message: 'Inquiry not found'
      });
    }

    // Check if user is authorized to update status
    const isPropertyOwner = inquiry.propertyOwner && inquiry.propertyOwner.toString() === userId.toString();
    const isProjectOwner = inquiry.projectOwner && inquiry.projectOwner.toString() === userId.toString();
    const isInquirer = inquiry.inquirer.toString() === userId.toString();
    
    if (!isPropertyOwner && !isProjectOwner && !isInquirer) {
      return res.status(403).json({
        status: 'error',
        message: 'You are not authorized to update this inquiry'
      });
    }

    inquiry.status = status;
    await inquiry.save();

    res.status(200).json({
      status: 'success',
      message: 'Inquiry status updated successfully',
      data: {
        inquiry
      }
    });
  })
);

// Get inquiry by ID
router.get('/:inquiryId',
  authenticate,
  catchAsync(async (req, res) => {
    const { inquiryId } = req.params;
    const userId = req.user._id;

    const inquiry = await Inquiry.findById(inquiryId)
      .populate('inquirer', 'phone email')
      .populate('property', 'title location price images')
      .populate('project', 'title location price images')
      .populate('propertyOwner', 'phone email')
      .populate('projectOwner', 'phone email')
      .populate('response.respondedBy', 'phone email');

    if (!inquiry) {
      return res.status(404).json({
        status: 'error',
        message: 'Inquiry not found'
      });
    }

    // Check if user is authorized to view this inquiry
    const isPropertyOwner = inquiry.propertyOwner && inquiry.propertyOwner.toString() === userId.toString();
    const isProjectOwner = inquiry.projectOwner && inquiry.projectOwner.toString() === userId.toString();
    const isInquirer = inquiry.inquirer.toString() === userId.toString();
    
    if (!isPropertyOwner && !isProjectOwner && !isInquirer) {
      return res.status(403).json({
        status: 'error',
        message: 'You are not authorized to view this inquiry'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        inquiry
      }
    });
  })
);

export default router;
