import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth.js';
import { catchAsync } from '../middleware/errorHandler.js';
import DeveloperProposal from '../models/DeveloperProposal.js';
import RedevelopmentProject from '../models/RedevelopmentProject.js';
import MemberVote from '../models/MemberVote.js';

const router = express.Router();

// Validation middleware
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: 'error',
      message: 'Validation failed',
      errors: errors.array().map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value
      }))
    });
  }
  next();
};

// Get all developer proposals
router.get('/',
  authenticate,
  [
    query('project_id').optional().isMongoId().withMessage('Invalid project ID'),
    query('developer_id').optional().isMongoId().withMessage('Invalid developer ID'),
    query('status').optional().isIn(['draft', 'submitted', 'under_review', 'shortlisted', 'selected', 'rejected', 'withdrawn']),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
  ],
  validateRequest,
  catchAsync(async (req, res) => {
    const { project_id, developer_id, status, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    
    // If user is a developer, show only their proposals
    if (req.user.currentRole === 'developer') {
      query.developer = req.user._id;
    }
    
    // If project_id is provided, filter by it
    if (project_id) {
      query.redevelopmentProject = project_id;
      
      // If user is a society owner, verify they own the project
      if (req.user.currentRole === 'society_owner') {
        const project = await RedevelopmentProject.findById(project_id).populate('society', 'owner');
        if (!project || project.society.owner.toString() !== req.user._id.toString()) {
          return res.status(403).json({
            status: 'error',
            message: 'Access denied. You can only view proposals for your own projects.'
          });
        }
      }
    }
    
    // If developer_id is provided, filter by it
    if (developer_id) {
      query.developer = developer_id;
    }
    
    // If status is provided, filter by it
    if (status) {
      query.status = status;
    }

    const proposals = await DeveloperProposal.find(query)
      .populate('redevelopmentProject', 'title society status')
      .populate('developer', 'phone')
      .populate('evaluation.evaluatedBy', 'phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await DeveloperProposal.countDocuments(query);

    res.status(200).json({
      status: 'success',
      data: {
        proposals,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  })
);

// Get a specific developer proposal
router.get('/:id',
  authenticate,
  [
    param('id').isMongoId().withMessage('Invalid proposal ID')
  ],
  validateRequest,
  catchAsync(async (req, res) => {
    const proposal = await DeveloperProposal.findById(req.params.id)
      .populate('redevelopmentProject', 'title society status')
      .populate('developer', 'phone')
      .populate('evaluation.evaluatedBy', 'phone');

    if (!proposal) {
      return res.status(404).json({
        status: 'error',
        message: 'Developer proposal not found'
      });
    }

    // Check access permissions
    const isDeveloper = proposal.developer.toString() === req.user._id.toString();
    const isProjectOwner = await RedevelopmentProject.findOne({
      _id: proposal.redevelopmentProject,
      owner: req.user._id
    });

    if (!isDeveloper && !isProjectOwner) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied to this proposal'
      });
    }

    res.status(200).json({
      status: 'success',
      data: { proposal }
    });
  })
);

// Create a new developer proposal
router.post('/',
  authenticate,
  authorize('developer'),
  [
    body('title').trim().isLength({ min: 5, max: 200 }).withMessage('Title must be between 5 and 200 characters'),
    body('description').trim().isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),
    body('project_id').isMongoId().withMessage('Invalid project ID'),
    body('corpusAmount').isNumeric().withMessage('Corpus amount must be a number'),
    body('rentAmount').isNumeric().withMessage('Rent amount must be a number'),
    body('fsi').isNumeric().withMessage('FSI must be a number'),
    body('proposedAmenities').optional().isArray().withMessage('Proposed amenities must be an array'),
    body('proposedTimeline.startDate').optional().isISO8601().withMessage('Invalid start date'),
    body('proposedTimeline.completionDate').optional().isISO8601().withMessage('Invalid completion date'),
    body('developerInfo.companyName').optional().trim().isLength({ min: 1 }).withMessage('Company name is required'),
    body('developerInfo.contactPerson').optional().trim().isLength({ min: 1 }).withMessage('Contact person is required'),
    body('developerInfo.contactPhone').optional().trim().isLength({ min: 1 }).withMessage('Contact phone is required'),
    body('developerInfo.contactEmail').optional().isEmail().withMessage('Valid contact email is required')
  ],
  validateRequest,
  catchAsync(async (req, res) => {
    const {
      title,
      description,
      project_id,
      corpusAmount,
      rentAmount,
      fsi,
      proposedAmenities,
      proposedTimeline,
      financialBreakdown,
      developerInfo
    } = req.body;

    // Check if project exists and is accepting proposals
    const project = await RedevelopmentProject.findById(project_id);
    if (!project) {
      return res.status(404).json({
        status: 'error',
        message: 'Redevelopment project not found'
      });
    }

    // Check if project is accepting proposals
    if (!['tender_open', 'proposals_received'].includes(project.status)) {
      let message = 'This project is not accepting proposals currently';
      
      // Provide specific message for voting status
      if (project.status === 'voting') {
        message = 'Proposal submission is closed as voting has started. No new proposals can be submitted during the voting period.';
      }
      
      return res.status(400).json({
        status: 'error',
        message: message
      });
    }

    // Check if developer has already submitted a proposal for this project
    const existingProposal = await DeveloperProposal.findOne({
      redevelopmentProject: project_id,
      developer: req.user._id
    });

    if (existingProposal) {
      return res.status(400).json({
        status: 'error',
        message: 'You have already submitted a proposal for this project'
      });
    }

    const proposalData = {
      title,
      description,
      redevelopmentProject: project_id,
      developer: req.user._id,
      corpusAmount,
      rentAmount,
      fsi,
      proposedAmenities: proposedAmenities || [],
      proposedTimeline: proposedTimeline || {},
      financialBreakdown: financialBreakdown || {},
      developerInfo: {
        ...developerInfo,
        contactEmail: developerInfo?.contactEmail || req.user.email
      },
      status: 'submitted'
    };

    const proposal = new DeveloperProposal(proposalData);
    await proposal.save();

    // Update project status if this is the first proposal
    if (project.status === 'tender_open') {
      project.status = 'proposals_received';
      await project.save();
    }

    await proposal.populate('redevelopmentProject', 'title society');

    // Send real-time notification to society members
    try {
      const socketService = (await import('../services/socketService.js')).default;
      socketService.notifyNewProposal(
        project._id,
        proposal,
        project.society
      );
    } catch (notificationError) {
      console.warn('⚠️ Failed to send new proposal notification:', notificationError.message);
    }

    res.status(201).json({
      status: 'success',
      message: 'Developer proposal submitted successfully',
      data: { proposal }
    });
  })
);

// Update a developer proposal
router.put('/:id',
  authenticate,
  authorize('developer'),
  [
    param('id').isMongoId().withMessage('Invalid proposal ID'),
    body('title').optional().trim().isLength({ min: 5, max: 200 }).withMessage('Title must be between 5 and 200 characters'),
    body('description').optional().trim().isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),
    body('status').optional().isIn(['draft', 'submitted', 'withdrawn'])
  ],
  validateRequest,
  catchAsync(async (req, res) => {
    const proposal = await DeveloperProposal.findById(req.params.id);

    if (!proposal) {
      return res.status(404).json({
        status: 'error',
        message: 'Developer proposal not found'
      });
    }

    // Check if user owns this proposal
    if (proposal.developer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'You can only update your own proposals'
      });
    }

    // Only allow updates if proposal is in draft or submitted status
    if (!['draft', 'submitted'].includes(proposal.status)) {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot update proposal in current status'
      });
    }

    const allowedUpdates = ['title', 'description', 'corpusAmount', 'rentAmount', 'fsi', 'proposedAmenities', 'proposedTimeline', 'financialBreakdown', 'developerInfo', 'status'];
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        proposal[field] = req.body[field];
      }
    });

    await proposal.save();

    res.status(200).json({
      status: 'success',
      message: 'Proposal updated successfully',
      data: { proposal }
    });
  })
);

// Evaluate a developer proposal (Society Owner only)
router.post('/:id/evaluate',
  authenticate,
  authorize('society_owner'),
  [
    param('id').isMongoId().withMessage('Invalid proposal ID'),
    body('technicalScore').isInt({ min: 0, max: 100 }).withMessage('Technical score must be between 0 and 100'),
    body('financialScore').isInt({ min: 0, max: 100 }).withMessage('Financial score must be between 0 and 100'),
    body('timelineScore').isInt({ min: 0, max: 100 }).withMessage('Timeline score must be between 0 and 100'),
    body('comments').optional().trim().isLength({ max: 1000 }).withMessage('Comments must be less than 1000 characters')
  ],
  validateRequest,
  catchAsync(async (req, res) => {
    const { technicalScore, financialScore, timelineScore, comments } = req.body;

    const proposal = await DeveloperProposal.findById(req.params.id);
    if (!proposal) {
      return res.status(404).json({
        status: 'error',
        message: 'Developer proposal not found'
      });
    }

    // Check if user owns the project
    const project = await RedevelopmentProject.findById(proposal.redevelopmentProject);
    if (!project || project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'You can only evaluate proposals for your own projects'
      });
    }

    // Update evaluation
    proposal.evaluation = {
      technicalScore,
      financialScore,
      timelineScore,
      evaluatedBy: req.user._id,
      evaluatedAt: new Date(),
      comments
    };

    await proposal.calculateOverallScore();

    res.status(200).json({
      status: 'success',
      message: 'Proposal evaluated successfully',
      data: { proposal }
    });
  })
);

// Select a developer proposal
router.post('/:id/select',
  authenticate,
  authorize('society_owner'),
  [
    param('id').isMongoId().withMessage('Invalid proposal ID')
  ],
  validateRequest,
  catchAsync(async (req, res) => {
    const proposal = await DeveloperProposal.findById(req.params.id);
    if (!proposal) {
      return res.status(404).json({
        status: 'error',
        message: 'Developer proposal not found'
      });
    }

    const project = await RedevelopmentProject.findById(proposal.redevelopmentProject);
    if (!project || project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'You can only select proposals for your own projects'
      });
    }

    // Update proposal status
    proposal.status = 'selected';
    await proposal.save();

    // Reject all other proposals for this project
    const otherProposals = await DeveloperProposal.find({
      redevelopmentProject: projectId,
      _id: { $ne: proposal._id }, // Exclude the selected proposal
      status: { $in: ['submitted', 'under_review', 'approved'] }
    });

    const rejectedProposals = [];
    for (const otherProposal of otherProposals) {
      otherProposal.status = 'rejected';
      otherProposal.rejectionReason = `Another proposal was selected for this project.`;
      otherProposal.rejectedAt = new Date();
      otherProposal.rejectedBy = req.user._id;
      await otherProposal.save();
      rejectedProposals.push(otherProposal._id);
    }

    // Update project
    project.status = 'developer_selected';
    project.selectedDeveloper = proposal.developer;
    project.selectedProposal = proposal._id;
    await project.save();

    console.log(`✅ Selected proposal ${proposal._id} and rejected ${rejectedProposals.length} other proposals`);

    // Send notifications
    try {
      // Import notification services
      const { 
        sendDeveloperSelectionNotification, 
        sendDeveloperRejectionNotification 
      } = await import('../services/notificationService.js');
      const socketService = (await import('../services/socketService.js')).default;
      
      // Send email notifications
      await sendDeveloperSelectionNotification({
        developerId: proposal.developer,
        projectId: project._id,
        projectTitle: project.title,
        proposalTitle: proposal.title,
        developerName: proposal.developerInfo?.companyName || 'Developer',
        ownerName: req.user.fullName || 'Society Owner'
      });
      
      console.log(`📧 Selection notification sent to developer ${proposal.developer} for project ${project._id}`);
      
      // Send rejection notifications to other developers
      for (const rejectedProposal of otherProposals) {
        try {
          await sendDeveloperRejectionNotification({
            developerId: rejectedProposal.developer,
            projectId: project._id,
            projectTitle: project.title,
            proposalTitle: rejectedProposal.title,
            developerName: rejectedProposal.developerInfo?.companyName || 'Developer',
            ownerName: req.user.fullName || 'Society Owner'
          });
          
          console.log(`📧 Rejection notification sent to developer ${rejectedProposal.developer}`);
        } catch (rejectionError) {
          console.error(`⚠️ Failed to send rejection notification to developer ${rejectedProposal.developer}:`, rejectionError);
        }
      }
      
      // Send real-time WebSocket notifications
      socketService.notifyDeveloperSelected(
        project._id, 
        proposal, 
        otherProposals, 
        project.society
      );
      
    } catch (notificationError) {
      console.error('⚠️ Failed to send notifications:', notificationError);
      // Don't fail the entire request if notification fails
    }

    res.status(200).json({
      status: 'success',
      message: 'Developer proposal selected successfully and notification sent',
      data: { 
        proposal, 
        project,
        rejectedProposals: rejectedProposals.length,
        rejectedProposalIds: rejectedProposals
      }
    });
  })
);

// Approve a developer proposal (Society Owner only)
router.post('/:id/approve',
  authenticate,
  authorize('society_owner'),
  [
    param('id').isMongoId().withMessage('Invalid proposal ID'),
    body('comments').optional().trim().isLength({ max: 1000 }).withMessage('Comments must be less than 1000 characters')
  ],
  validateRequest,
  catchAsync(async (req, res) => {
    const { comments } = req.body;

    const proposal = await DeveloperProposal.findById(req.params.id)
      .populate('redevelopmentProject', 'owner title');
    
    if (!proposal) {
      return res.status(404).json({
        status: 'error',
        message: 'Developer proposal not found'
      });
    }

    // Check if user owns the project
    if (proposal.redevelopmentProject.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'You can only approve proposals for your own projects'
      });
    }

    // Update proposal status
    proposal.status = 'approved';
    proposal.ownerComments = comments || '';
    proposal.approvedAt = new Date();
    proposal.approvedBy = req.user._id;
    await proposal.save();

    res.status(200).json({
      status: 'success',
      message: 'Developer proposal approved successfully',
      data: { proposal }
    });
  })
);

// Reject a developer proposal (Society Owner only)
router.post('/:id/reject',
  authenticate,
  authorize('society_owner'),
  [
    param('id').isMongoId().withMessage('Invalid proposal ID'),
    body('reason').trim().notEmpty().withMessage('Rejection reason is required').isLength({ max: 1000 }).withMessage('Reason must be less than 1000 characters')
  ],
  validateRequest,
  catchAsync(async (req, res) => {
    const { reason } = req.body;

    const proposal = await DeveloperProposal.findById(req.params.id)
      .populate('redevelopmentProject', 'owner title');
    
    if (!proposal) {
      return res.status(404).json({
        status: 'error',
        message: 'Developer proposal not found'
      });
    }

    // Check if user owns the project
    if (proposal.redevelopmentProject.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'You can only reject proposals for your own projects'
      });
    }

    // Update proposal status
    proposal.status = 'rejected';
    proposal.rejectionReason = reason;
    proposal.rejectedAt = new Date();
    proposal.rejectedBy = req.user._id;
    await proposal.save();

    res.status(200).json({
      status: 'success',
      message: 'Developer proposal rejected successfully',
      data: { proposal }
    });
  })
);


// Get proposal comparison data
router.get('/project/:projectId/comparison',
  authenticate,
  [
    param('projectId').isMongoId().withMessage('Invalid project ID')
  ],
  validateRequest,
  catchAsync(async (req, res) => {
    const { projectId } = req.params;

    const project = await RedevelopmentProject.findById(projectId);
    if (!project) {
      return res.status(404).json({
        status: 'error',
        message: 'Redevelopment project not found'
      });
    }

    // Check access permissions
    const isOwner = project.owner.toString() === req.user._id.toString();
    const isMember = await Profile.findOne({
      user: req.user._id,
      companyName: project.society.toString()
    });

    if (!isOwner && !isMember) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied to proposal comparison'
      });
    }

    const proposals = await DeveloperProposal.find({
      redevelopmentProject: projectId,
      status: { $in: ['submitted', 'under_review', 'shortlisted', 'selected'] }
    })
      .populate('developer', 'phone')
      .select('title corpusAmount rentAmount fsi proposedAmenities proposedTimeline evaluation developerInfo status')
      .sort({ 'evaluation.overallScore': -1 });

    res.status(200).json({
      status: 'success',
      data: { proposals }
    });
  })
);

// Delete a developer proposal
router.delete('/:id',
  authenticate,
  authorize('developer'),
  [
    param('id').isMongoId().withMessage('Invalid proposal ID')
  ],
  validateRequest,
  catchAsync(async (req, res) => {
    const proposal = await DeveloperProposal.findById(req.params.id);

    if (!proposal) {
      return res.status(404).json({
        status: 'error',
        message: 'Developer proposal not found'
      });
    }

    if (proposal.developer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'You can only delete your own proposals'
      });
    }

    // Only allow deletion if proposal is in draft status
    if (proposal.status !== 'draft') {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot delete proposal in current status'
      });
    }

    await DeveloperProposal.findByIdAndDelete(req.params.id);

    res.status(200).json({
      status: 'success',
      message: 'Developer proposal deleted successfully'
    });
  })
);

export default router;
