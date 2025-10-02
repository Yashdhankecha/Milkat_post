import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth.js';
import { catchAsync } from '../middleware/errorHandler.js';
import RedevelopmentProject from '../models/RedevelopmentProject.js';
import DeveloperProposal from '../models/DeveloperProposal.js';
import MemberVote from '../models/MemberVote.js';
import Society from '../models/Society.js';
import Profile from '../models/Profile.js';

const router = express.Router();

// Test route to verify the route is working
router.get('/test', (req, res) => {
  res.json({ message: 'Redevelopment routes are working' });
});

// Validation middleware
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('Validation errors:', errors.array());
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

// Get all redevelopment projects for a society
router.get('/',
  authenticate,
  [
    query('society_id').optional().isMongoId().withMessage('Invalid society ID'),
    query('status').optional().isIn(['planning', 'tender_open', 'proposals_received', 'voting', 'developer_selected', 'construction', 'completed', 'cancelled']),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
  ],
  validateRequest,
  catchAsync(async (req, res) => {
    const { society_id, status, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    
    // If user is a society owner, show their projects
    if (req.user.currentRole === 'society_owner') {
      query.owner = req.user._id;
    }
    
    // If society_id is provided, filter by it
    if (society_id) {
      query.society = society_id;
    }
    
    // If status is provided, filter by it
    if (status) {
      query.status = status;
    }

    const projects = await RedevelopmentProject.find(query)
      .populate('society', 'name address city state')
      .populate('owner', 'phone')
      .populate('selectedDeveloper', 'phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await RedevelopmentProject.countDocuments(query);

    res.status(200).json({
      status: 'success',
      data: {
        projects,
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

// Get a specific redevelopment project
router.get('/:id',
  authenticate,
  [
    param('id').isMongoId().withMessage('Invalid project ID')
  ],
  validateRequest,
  catchAsync(async (req, res) => {
    const project = await RedevelopmentProject.findById(req.params.id)
      .populate('society', 'name address city state totalFlats')
      .populate('owner', 'phone')
      .populate('selectedDeveloper', 'phone')
      .populate('documents.uploadedBy', 'phone')
      .populate('updates.postedBy', 'phone')
      .populate('queries.raisedBy', 'phone')
      .populate('queries.respondedBy', 'phone');

    if (!project) {
      return res.status(404).json({
        status: 'error',
        message: 'Redevelopment project not found'
      });
    }

    // Check if user has access to this project
    const isOwner = project.owner.toString() === req.user._id.toString();
    
    // Check if user is a society member
    const SocietyMember = (await import('../models/SocietyMember.js')).default;
    const isSocietyMember = await SocietyMember.findOne({
      user: req.user._id,
      society: project.society._id,
      status: 'active'
    });

    if (!isOwner && !isSocietyMember) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied to this project'
      });
    }

    res.status(200).json({
      status: 'success',
      data: { project }
    });
  })
);

// Create a new redevelopment project
router.post('/',
  (req, res, next) => {
    console.log('=== REDEVELOPMENT PROJECT CREATION ROUTE HIT ===');
    console.log('Method:', req.method);
    console.log('URL:', req.originalUrl);
    console.log('Body:', req.body);
    next();
  },
  authenticate,
  authorize('society_owner'),
  [
    body('title').trim().isLength({ min: 5, max: 200 }).withMessage('Title must be between 5 and 200 characters'),
    body('description').trim().isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),
    body('society_id').isMongoId().withMessage('Invalid society ID'),
    body('expectedAmenities').optional().isArray().withMessage('Expected amenities must be an array'),
    body('timeline.startDate').optional().isISO8601().withMessage('Invalid start date'),
    body('timeline.expectedCompletionDate').optional().isISO8601().withMessage('Invalid completion date'),
    body('estimatedBudget').optional().isNumeric().withMessage('Estimated budget must be a number'),
    body('minimumApprovalPercentage').optional().isInt({ min: 50, max: 100 }).withMessage('Minimum approval percentage must be between 50 and 100'),
    body('documents').optional().isArray().withMessage('Documents must be an array')
  ],
  validateRequest,
  catchAsync(async (req, res) => {
    console.log('Creating redevelopment project with data:', req.body);
    console.log('User info:', { id: req.user._id, role: req.user.currentRole });
    
    const {
      title,
      description,
      society_id,
      expectedAmenities,
      timeline,
      estimatedBudget,
      minimumApprovalPercentage,
      documents
    } = req.body;

    // Verify that the society belongs to the user
    console.log('Looking for society:', society_id, 'owned by user:', req.user._id);
    const society = await Society.findOne({ _id: society_id, owner: req.user._id });
    console.log('Society found:', society ? 'Yes' : 'No');
    if (!society) {
      return res.status(403).json({
        status: 'error',
        message: 'You can only create projects for societies you own'
      });
    }

    const projectData = {
      title,
      description,
      society: society_id,
      owner: req.user._id,
      expectedAmenities: expectedAmenities || [],
      timeline: timeline || {},
      estimatedBudget,
      minimumApprovalPercentage: minimumApprovalPercentage || 75,
      documents: documents || []
    };

    console.log('Project data before creation:', projectData);
    
    const project = new RedevelopmentProject(projectData);
    await project.save();
    console.log('Project created successfully:', project._id);

    await project.populate('society', 'name address city state');

    // Send real-time notification to society members
    try {
      const socketService = (await import('../services/socketService.js')).default;
      socketService.notifyProjectUpdate(project._id, {
        type: 'project_created',
        title: 'New Redevelopment Project Created',
        description: `A new redevelopment project "${project.title}" has been created.`
      }, project.society._id);
    } catch (notificationError) {
      console.warn('⚠️ Failed to send project creation notification:', notificationError.message);
    }

    res.status(201).json({
      status: 'success',
      message: 'Redevelopment project created successfully',
      data: { project }
    });
  })
);

// Update a redevelopment project
router.put('/:id',
  authenticate,
  authorize('society_owner'),
  [
    param('id').isMongoId().withMessage('Invalid project ID'),
    body('title').optional().trim().isLength({ min: 5, max: 200 }).withMessage('Title must be between 5 and 200 characters'),
    body('description').optional().trim().isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),
    body('status').optional().isIn(['planning', 'tender_open', 'proposals_received', 'voting', 'developer_selected', 'construction', 'completed', 'cancelled']),
    body('selectedDeveloper').optional().isMongoId().withMessage('Invalid developer ID')
  ],
  validateRequest,
  catchAsync(async (req, res) => {
    const project = await RedevelopmentProject.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        status: 'error',
        message: 'Redevelopment project not found'
      });
    }

    // Check if user owns this project
    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'You can only update your own projects'
      });
    }

    const allowedUpdates = ['title', 'description', 'expectedAmenities', 'timeline', 'estimatedBudget', 'status', 'progress', 'selectedDeveloper'];
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        project[field] = req.body[field];
      }
    });

    await project.save();

    // If a developer was selected, update proposal statuses and send notification
    if (req.body.selectedDeveloper && req.body.status === 'developer_selected') {
      try {
        // Update proposal statuses
        // First, mark all proposals as rejected
        await DeveloperProposal.updateMany(
          { redevelopmentProject: project._id },
          { $set: { status: 'rejected' } }
        );
        
        // Then, mark the selected developer's proposal as selected
        await DeveloperProposal.updateOne(
          { 
            redevelopmentProject: project._id,
            developer: req.body.selectedDeveloper
          },
          { $set: { status: 'selected' } }
        );

        // Get developer profile
        const developerProfile = await Profile.findOne({ user: req.body.selectedDeveloper });
        
        if (developerProfile) {
          // Create notification for the selected developer
          const Notification = (await import('../models/Notification.js')).default;
          
          await Notification.create({
            user: req.body.selectedDeveloper,
            type: 'developer_selected',
            title: 'Congratulations! You have been selected',
            message: `You have been selected as the developer for the project "${project.title}". Please contact the society owner to proceed.`,
            data: {
              projectId: project._id,
              projectTitle: project.title,
              societyName: project.society?.name || 'Society'
            },
            read: false
          });

          console.log(`Notification sent to developer ${req.body.selectedDeveloper} for project ${project._id}`);
        }
      } catch (notificationError) {
        console.error('Error updating proposal statuses or sending notification:', notificationError);
        // Don't fail the request if notification fails
      }
    }

    res.status(200).json({
      status: 'success',
      message: 'Project updated successfully',
      data: { project }
    });
  })
);

// Add update to project
router.post('/:id/updates',
  authenticate,
  authorize('society_owner'),
  [
    param('id').isMongoId().withMessage('Invalid project ID'),
    body('title').trim().isLength({ min: 5, max: 200 }).withMessage('Update title must be between 5 and 200 characters'),
    body('description').trim().isLength({ min: 10 }).withMessage('Update description must be at least 10 characters'),
    body('isImportant').optional().isBoolean().withMessage('isImportant must be a boolean')
  ],
  validateRequest,
  catchAsync(async (req, res) => {
    const project = await RedevelopmentProject.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        status: 'error',
        message: 'Redevelopment project not found'
      });
    }

    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'You can only add updates to your own projects'
      });
    }

    await project.addUpdate(req.body.title, req.body.description, req.user._id, req.body.isImportant);

    res.status(201).json({
      status: 'success',
      message: 'Update added successfully',
      data: { project }
    });
  })
);

// Add query to project
router.post('/:id/queries',
  authenticate,
  [
    param('id').isMongoId().withMessage('Invalid project ID'),
    body('title').trim().isLength({ min: 5, max: 200 }).withMessage('Query title must be between 5 and 200 characters'),
    body('description').trim().isLength({ min: 10 }).withMessage('Query description must be at least 10 characters')
  ],
  validateRequest,
  catchAsync(async (req, res) => {
    const project = await RedevelopmentProject.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        status: 'error',
        message: 'Redevelopment project not found'
      });
    }

    // Check if user is a member of the society
    const isMember = await Profile.findOne({
      user: req.user._id,
      companyName: project.society.toString()
    });

    if (!isMember && project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'Only society members can raise queries'
      });
    }

    await project.addQuery(req.body.title, req.body.description, req.user._id);

    res.status(201).json({
      status: 'success',
      message: 'Query raised successfully',
      data: { project }
    });
  })
);

// Submit vote for project
router.post('/:id/vote',
  authenticate,
  [
    param('id').isMongoId().withMessage('Invalid project ID'),
    body('vote').isIn(['yes', 'no', 'abstain']).withMessage('Vote must be yes, no, or abstain'),
    body('proposal_id').optional().isMongoId().withMessage('Invalid proposal ID'),
    body('voting_session').trim().isLength({ min: 1 }).withMessage('Voting session is required'),
    body('reason').optional().trim().isLength({ max: 500 }).withMessage('Reason must be less than 500 characters')
  ],
  validateRequest,
  catchAsync(async (req, res) => {
    const { id } = req.params;
    const { vote, proposal_id, voting_session, reason } = req.body;

    const project = await RedevelopmentProject.findById(id);
    if (!project) {
      return res.status(404).json({
        status: 'error',
        message: 'Redevelopment project not found'
      });
    }

    // Check if user is a member of the society
    const isMember = await Profile.findOne({
      user: req.user._id,
      companyName: project.society.toString()
    });

    if (!isMember) {
      return res.status(403).json({
        status: 'error',
        message: 'Only society members can vote'
      });
    }

    // Check if voting is still open
    if (project.votingDeadline && new Date() > project.votingDeadline) {
      return res.status(400).json({
        status: 'error',
        message: 'Voting deadline has passed'
      });
    }

    // Check if user has already voted for this specific proposal in this session
    const MemberVote = (await import('../models/MemberVote.js')).default;
    const existingVoteDoc = await MemberVote.findOne({
      redevelopmentProject: id,
      member: req.user._id
    });

    if (existingVoteDoc) {
      // Check if user already voted for this specific proposal in this session
      const existingVote = existingVoteDoc.votes.find(v => {
        // If both votes have proposalId, check if they match
        if (v.proposalId && proposal_id) {
          return v.proposalId.toString() === proposal_id.toString() &&
                 v.votingSession === voting_session;
        }
        // If both votes don't have proposalId (general project votes), check session only
        if (!v.proposalId && !proposal_id) {
          return v.votingSession === voting_session;
        }
        // If one has proposalId and other doesn't, they are different votes
        return false;
      });

      if (existingVote) {
        return res.status(400).json({
          status: 'error',
          message: 'You have already voted for this proposal in this session'
        });
      }
    }

    // Convert vote string to boolean
    let voteBoolean;
    if (vote === 'yes') voteBoolean = true;
    else if (vote === 'no') voteBoolean = false;
    else if (vote === 'abstain') voteBoolean = null;

    // Prepare vote data for the array
    const voteData = {
      vote: voteBoolean,
      reason,
      proposalId: proposal_id || undefined,
      developerId: undefined, // Will be set if needed
      votingSession: voting_session,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    };

    // Create or update the vote document
    let memberVote;
    if (existingVoteDoc) {
      // Add vote to existing document
      await existingVoteDoc.addVote(voteData);
      memberVote = existingVoteDoc;
    } else {
      // Create new document with first vote
      memberVote = new MemberVote({
        redevelopmentProject: id,
        member: req.user._id,
        votes: [voteData],
        lastVotedAt: new Date(),
        totalVotes: 1
      });
      await memberVote.save();
    }

    res.status(201).json({
      status: 'success',
      message: 'Vote submitted successfully',
      data: { 
        vote: memberVote,
        projectId: id 
      }
    });
  })
);

// Get voting results for a project
router.get('/:id/voting-results',
  authenticate,
  [
    param('id').isMongoId().withMessage('Invalid project ID'),
    query('session').optional().trim().isLength({ min: 1 }).withMessage('Voting session is required')
  ],
  validateRequest,
  catchAsync(async (req, res) => {
    const { id } = req.params;
    const { session } = req.query;

    const project = await RedevelopmentProject.findById(id);
    if (!project) {
      return res.status(404).json({
        status: 'error',
        message: 'Redevelopment project not found'
      });
    }

    // Check if user has access to voting results
    const isOwner = project.owner.toString() === req.user._id.toString();
    
    // Check if user is a society member
    const SocietyMember = (await import('../models/SocietyMember.js')).default;
    const isMember = await SocietyMember.findOne({
      user: req.user._id,
      society: project.society,
      status: 'active'
    });

    if (!isOwner && !isMember) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied to voting results'
      });
    }

    const votingStats = await MemberVote.getVotingStats(id, session);
    
    const stats = {
      yesVotes: 0,
      noVotes: 0,
      abstainVotes: 0
    };

    votingStats.forEach(stat => {
      if (stat._id === true) stats.yesVotes = stat.count;
      if (stat._id === false) stats.noVotes = stat.count;
      if (stat._id === null) stats.abstainVotes = stat.count;
    });

    const totalVotes = stats.yesVotes + stats.noVotes + stats.abstainVotes;
    const approvalPercentage = totalVotes > 0 ? Math.round((stats.yesVotes / totalVotes) * 100) : 0;

    // Get society member count
    const society = await Society.findById(project.society);
    const totalMembers = society?.totalFlats || 0;

    res.status(200).json({
      status: 'success',
      data: {
        votingStats,
        totals: {
          totalMembers,
          totalVotes,
          yesVotes: stats.yesVotes,
          noVotes: stats.noVotes,
          abstainVotes: stats.abstainVotes,
          approvalPercentage,
          isApproved: approvalPercentage >= project.minimumApprovalPercentage
        }
      }
    });
  })
);

// Delete a redevelopment project
router.delete('/:id',
  authenticate,
  authorize('society_owner'),
  [
    param('id').isMongoId().withMessage('Invalid project ID')
  ],
  validateRequest,
  catchAsync(async (req, res) => {
    const project = await RedevelopmentProject.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        status: 'error',
        message: 'Redevelopment project not found'
      });
    }

    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'You can only delete your own projects'
      });
    }

    // Delete related data
    await DeveloperProposal.deleteMany({ redevelopmentProject: req.params.id });
    await MemberVote.deleteMany({ redevelopmentProject: req.params.id });
    
    await RedevelopmentProject.findByIdAndDelete(req.params.id);

    res.status(200).json({
      status: 'success',
      message: 'Redevelopment project deleted successfully'
    });
  })
);

export default router;
