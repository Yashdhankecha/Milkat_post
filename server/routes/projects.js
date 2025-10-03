import express from 'express';
import { body, validationResult } from 'express-validator';
import Project from '../models/Project.js';
import User from '../models/User.js';
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

// Get all projects with filters
router.get('/',
  catchAsync(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    const filters = {
      city: req.query.city,
      state: req.query.state,
      projectType: req.query.projectType,
      minPrice: req.query.minPrice ? parseInt(req.query.minPrice) : undefined,
      maxPrice: req.query.maxPrice ? parseInt(req.query.maxPrice) : undefined,
      search: req.query.search,
      sort: req.query.sort,
      order: req.query.order,
      status: req.query.status
    };

    const projects = await Project.searchProjects(filters, page, limit);
    const total = await Project.countDocuments(filters);

    res.status(200).json({
      status: 'success',
      data: {
        projects,
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

// Get project by ID
router.get('/:id',
  catchAsync(async (req, res) => {
    const project = await Project.findById(req.params.id)
      .populate('developer', 'phone profile');

    if (!project) {
      return res.status(404).json({
        status: 'error',
        message: 'Project not found'
      });
    }

    // Increment views
    await project.incrementViews();

    res.status(200).json({
      status: 'success',
      data: { project }
    });
  })
);

// Create new project
router.post('/',
  authenticate,
  authorize('developer'),
  [
    body('name')
      .trim()
      .isLength({ min: 5, max: 200 })
      .withMessage('Project name must be between 5 and 200 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 2000 })
      .withMessage('Description must not exceed 2000 characters'),
    body('projectType')
      .isIn(['residential', 'commercial', 'mixed_use', 'industrial', 'hospitality', 'retail'])
      .withMessage('Invalid project type'),
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
      .withMessage('State must be between 2 and 100 characters'),
    body('priceRange.min')
      .isNumeric()
      .isFloat({ min: 0 })
      .withMessage('Minimum price must be a positive number'),
    body('priceRange.max')
      .isNumeric()
      .isFloat({ min: 0 })
      .withMessage('Maximum price must be a positive number'),
    body('totalUnits')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Total units must be a positive integer')
  ],
  validateRequest,
  catchAsync(async (req, res) => {
    // Filter out invalid media objects
    if (req.body.images) {
      req.body.images = req.body.images.filter(img => img && img.url && img.url.trim() !== '');
    }
    if (req.body.videos) {
      req.body.videos = req.body.videos.filter(vid => vid && vid.url && vid.url.trim() !== '');
    }
    if (req.body.brochures) {
      req.body.brochures = req.body.brochures.filter(brochure => brochure && brochure.url && brochure.url.trim() !== '');
    }

    const projectData = {
      ...req.body,
      developer: req.user._id
    };

    const project = new Project(projectData);
    await project.save();

    res.status(201).json({
      status: 'success',
      message: 'Project created successfully',
      data: { project }
    });
  })
);

// Update project
router.put('/:id',
  authenticate,
  [
    body('name')
      .optional()
      .trim()
      .isLength({ min: 5, max: 200 })
      .withMessage('Project name must be between 5 and 200 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 2000 })
      .withMessage('Description must not exceed 2000 characters'),
    body('priceRange.min')
      .optional()
      .isNumeric()
      .isFloat({ min: 0 })
      .withMessage('Minimum price must be a positive number'),
    body('priceRange.max')
      .optional()
      .isNumeric()
      .isFloat({ min: 0 })
      .withMessage('Maximum price must be a positive number')
  ],
  validateRequest,
  catchAsync(async (req, res) => {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        status: 'error',
        message: 'Project not found'
      });
    }

    // Check ownership or admin role
    if (project.developer.toString() !== req.user._id.toString() && req.profile.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. You can only update your own projects.'
      });
    }

    const allowedUpdates = [
      'name', 'description', 'projectType', 'location', 'priceRange',
      'totalUnits', 'availableUnits', 'completionDate', 'possessionDate',
      'launchDate', 'amenities', 'images', 'videos', 'brochures', 'status', 'reraNumber', 'approvals'
    ];

    // Filter out invalid media objects before processing updates
    if (req.body.images) {
      req.body.images = req.body.images.filter(img => img && img.url && img.url.trim() !== '');
    }
    if (req.body.videos) {
      req.body.videos = req.body.videos.filter(vid => vid && vid.url && vid.url.trim() !== '');
    }
    if (req.body.brochures) {
      req.body.brochures = req.body.brochures.filter(brochure => brochure && brochure.url && brochure.url.trim() !== '');
    }

    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const updatedProject = await Project.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      status: 'success',
      message: 'Project updated successfully',
      data: { project: updatedProject }
    });
  })
);

// Delete project
router.delete('/:id',
  authenticate,
  catchAsync(async (req, res) => {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        status: 'error',
        message: 'Project not found'
      });
    }

    // Check ownership or admin role
    if (project.developer.toString() !== req.user._id.toString() && req.profile.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. You can only delete your own projects.'
      });
    }

    await Project.findByIdAndDelete(req.params.id);

    res.status(200).json({
      status: 'success',
      message: 'Project deleted successfully'
    });
  })
);

// Get developer's projects
router.get('/my/projects',
  authenticate,
  catchAsync(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const projects = await Project.find({ developer: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Project.countDocuments({ developer: req.user._id });

    res.status(200).json({
      status: 'success',
      data: {
        projects,
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

// Add floor plan to project
router.post('/:id/floor-plans',
  authenticate,
  [
    body('type')
      .isIn(['1bhk', '2bhk', '3bhk', '4bhk', '5bhk', 'penthouse', 'villa', 'duplex', 'studio'])
      .withMessage('Invalid floor plan type'),
    body('area')
      .isNumeric()
      .isFloat({ min: 0 })
      .withMessage('Area must be a positive number'),
    body('price')
      .isNumeric()
      .isFloat({ min: 0 })
      .withMessage('Price must be a positive number'),
    body('available')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Available units must be a non-negative integer')
  ],
  validateRequest,
  catchAsync(async (req, res) => {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        status: 'error',
        message: 'Project not found'
      });
    }

    // Check ownership
    if (project.developer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. You can only add floor plans to your own projects.'
      });
    }

    await project.addFloorPlan(req.body);

    res.status(200).json({
      status: 'success',
      message: 'Floor plan added successfully',
      data: { project }
    });
  })
);

// Save project to user's saved list
router.post('/save-project',
  authenticate,
  [
    body('projectId')
      .isMongoId()
      .withMessage('Invalid project ID')
  ],
  validateRequest,
  catchAsync(async (req, res) => {
    const { projectId } = req.body;
    const userId = req.user._id;

    // Check if project exists
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        status: 'error',
        message: 'Project not found'
      });
    }

    // Check if user already saved this project
    const user = await User.findById(userId);
    if (user.savedProjects.includes(projectId)) {
      return res.status(400).json({
        status: 'error',
        message: 'Project already saved'
      });
    }

    // Add project to saved list
    user.savedProjects.push(projectId);
    await user.save();

    res.status(200).json({
      status: 'success',
      message: 'Project saved successfully'
    });
  })
);

// Remove project from user's saved list
router.delete('/unsave-project',
  authenticate,
  [
    body('projectId')
      .isMongoId()
      .withMessage('Invalid project ID')
  ],
  validateRequest,
  catchAsync(async (req, res) => {
    const { projectId } = req.body;
    const userId = req.user._id;

    // Remove project from saved list
    const user = await User.findById(userId);
    user.savedProjects = user.savedProjects.filter(id => id.toString() !== projectId);
    await user.save();

    res.status(200).json({
      status: 'success',
      message: 'Project removed from saved list'
    });
  })
);

// Get user's saved projects
router.get('/saved-projects/:userId',
  authenticate,
  catchAsync(async (req, res) => {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Verify the user is requesting their own saved projects or is admin
    if (req.user._id.toString() !== userId && req.profile.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. You can only view your own saved projects.'
      });
    }

    // Get user with saved projects populated
    const user = await User.findById(userId).populate({
      path: 'savedProjects',
      options: {
        skip,
        limit,
        sort: { createdAt: -1 }
      }
    });

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Get total count for pagination
    const total = user.savedProjects.length;

    res.status(200).json({
      status: 'success',
      data: {
        projects: user.savedProjects,
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
