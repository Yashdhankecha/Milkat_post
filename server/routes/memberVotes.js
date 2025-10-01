import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth.js';
import { catchAsync } from '../middleware/errorHandler.js';
import MemberVote from '../models/MemberVote.js';
import RedevelopmentProject from '../models/RedevelopmentProject.js';
import DeveloperProposal from '../models/DeveloperProposal.js';
import SocietyMember from '../models/SocietyMember.js';
import Notification from '../models/Notification.js';

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

// Check voting eligibility
const checkVotingEligibility = async (userId, projectId) => {
  const project = await RedevelopmentProject.findById(projectId).populate('society');
  
  if (!project) {
    return { eligible: false, reason: 'Project not found' };
  }

  // Check if voting is open
  if (project.status !== 'voting') {
    return { eligible: false, reason: 'Voting is not currently open for this project' };
  }

  // Check voting deadline
  if (project.votingDeadline && new Date() > new Date(project.votingDeadline)) {
    return { eligible: false, reason: 'Voting deadline has passed' };
  }

  // Check if user is an active member of the society
  const membership = await SocietyMember.findOne({
    society: project.society._id,
    user: userId,
    status: 'active'
  });

  if (!membership) {
    return { eligible: false, reason: 'You must be an active member of this society to vote' };
  }

  return { eligible: true, membership, project };
};

// Submit a vote
router.post('/',
  authenticate,
  [
    body('redevelopmentProject').isMongoId().withMessage('Invalid project ID'),
    body('vote').isIn(['yes', 'no', 'abstain']).withMessage('Vote must be yes, no, or abstain'),
    body('votingSession').trim().notEmpty().withMessage('Voting session is required'),
    body('proposal').optional().isMongoId().withMessage('Invalid proposal ID'),
    body('reason').optional().trim().isLength({ max: 500 }).withMessage('Reason must not exceed 500 characters')
  ],
  validateRequest,
  catchAsync(async (req, res) => {
    const {
      redevelopmentProject,
      vote,
      votingSession,
      proposal,
      reason
    } = req.body;

    // Check voting eligibility
    const eligibility = await checkVotingEligibility(req.user._id, redevelopmentProject);
    
    if (!eligibility.eligible) {
      return res.status(403).json({
        status: 'error',
        message: eligibility.reason,
        errorCode: 'NOT_ELIGIBLE'
      });
    }

    // Check if user has already voted in this session
    const existingVote = await MemberVote.findOne({
      redevelopmentProject,
      member: req.user._id,
      votingSession
    });

    if (existingVote) {
      return res.status(409).json({
        status: 'error',
        message: 'You have already voted in this session',
        errorCode: 'ALREADY_VOTED',
        data: { existingVote }
      });
    }

    // If voting on a specific proposal, verify it exists and belongs to this project
    if (proposal) {
      const proposalDoc = await DeveloperProposal.findOne({
        _id: proposal,
        redevelopmentProject
      });

      if (!proposalDoc) {
        return res.status(404).json({
          status: 'error',
          message: 'Proposal not found or does not belong to this project'
        });
      }
    }

    // Create the vote
    const newVote = new MemberVote({
      redevelopmentProject,
      member: req.user._id,
      vote,
      votingSession,
      proposal: proposal || undefined,
      reason: reason || undefined,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    await newVote.save();

    // Calculate updated voting statistics
    const votingStats = await MemberVote.getVotingStats(redevelopmentProject, votingSession);
    
    const stats = {
      yesVotes: 0,
      noVotes: 0,
      abstainVotes: 0
    };

    votingStats.forEach(stat => {
      if (stat._id === 'yes') stats.yesVotes = stat.count;
      if (stat._id === 'no') stats.noVotes = stat.count;
      if (stat._id === 'abstain') stats.abstainVotes = stat.count;
    });

    const totalVotes = stats.yesVotes + stats.noVotes + stats.abstainVotes;
    const approvalPercentage = totalVotes > 0 ? Math.round((stats.yesVotes / totalVotes) * 100) : 0;

    // Update project voting results
    await RedevelopmentProject.findByIdAndUpdate(redevelopmentProject, {
      'votingResults.votesCast': totalVotes,
      'votingResults.yesVotes': stats.yesVotes,
      'votingResults.noVotes': stats.noVotes,
      'votingResults.abstainVotes': stats.abstainVotes,
      'votingResults.approvalPercentage': approvalPercentage
    });

    // If voting on a proposal, update proposal voting results
    if (proposal) {
      await DeveloperProposal.findByIdAndUpdate(proposal, {
        'votingResults.totalVotes': totalVotes,
        'votingResults.yesVotes': stats.yesVotes,
        'votingResults.noVotes': stats.noVotes,
        'votingResults.abstainVotes': stats.abstainVotes,
        'votingResults.approvalPercentage': approvalPercentage
      });
    }

    // Notify society owner about new vote
    const project = await RedevelopmentProject.findById(redevelopmentProject);
    await Notification.create({
      recipient: project.owner,
      type: 'member_voted',
      title: 'New Vote Cast',
      message: `A member has voted on "${project.title}"`,
      relatedEntity: {
        entityType: 'redevelopment_project',
        entityId: redevelopmentProject
      }
    });

    res.status(201).json({
      status: 'success',
      message: 'Vote submitted successfully',
      data: {
        vote: newVote,
        votingStats: {
          totalVotes,
          yesVotes: stats.yesVotes,
          noVotes: stats.noVotes,
          abstainVotes: stats.abstainVotes,
          approvalPercentage
        }
      }
    });
  })
);

// Get votes for a project
router.get('/project/:projectId',
  authenticate,
  [
    param('projectId').isMongoId().withMessage('Invalid project ID'),
    query('session').optional().trim(),
    query('includeDetails').optional().isBoolean().withMessage('includeDetails must be boolean')
  ],
  validateRequest,
  catchAsync(async (req, res) => {
    const { projectId } = req.params;
    const { session, includeDetails } = req.query;

    // Verify user has access to this project
    const project = await RedevelopmentProject.findById(projectId).populate('society');
    if (!project) {
      return res.status(404).json({
        status: 'error',
        message: 'Project not found'
      });
    }

    // Check if user is owner or member
    const isOwner = project.owner.toString() === req.user._id.toString();
    const isMember = await SocietyMember.findOne({
      society: project.society._id,
      user: req.user._id,
      status: 'active'
    });

    if (!isOwner && !isMember) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied to this project'
      });
    }

    const query = { redevelopmentProject: projectId };
    if (session) {
      query.votingSession = session;
    }

    let votes;
    if (includeDetails === 'true' && isOwner) {
      // Only owner can see detailed votes with member info
      votes = await MemberVote.find(query)
        .populate('member', 'phone fullName')
        .populate('proposal', 'title')
        .sort({ votedAt: -1 });
    } else {
      // Members can only see aggregated stats, not individual votes
      votes = [];
    }

    // Get voting statistics
    const votingStats = await MemberVote.getVotingStats(projectId, session);
    
    const stats = {
      yesVotes: 0,
      noVotes: 0,
      abstainVotes: 0
    };

    votingStats.forEach(stat => {
      if (stat._id === 'yes') stats.yesVotes = stat.count;
      if (stat._id === 'no') stats.noVotes = stat.count;
      if (stat._id === 'abstain') stats.abstainVotes = stat.count;
    });

    const totalVotes = stats.yesVotes + stats.noVotes + stats.abstainVotes;
    const approvalPercentage = totalVotes > 0 ? Math.round((stats.yesVotes / totalVotes) * 100) : 0;

    // Get total eligible members
    const totalMembers = await SocietyMember.countDocuments({
      society: project.society._id,
      status: 'active'
    });

    res.status(200).json({
      status: 'success',
      data: {
        votes: includeDetails === 'true' && isOwner ? votes : undefined,
        statistics: {
          totalMembers,
          totalVotes,
          yesVotes: stats.yesVotes,
          noVotes: stats.noVotes,
          abstainVotes: stats.abstainVotes,
          approvalPercentage,
          participationRate: totalMembers > 0 ? Math.round((totalVotes / totalMembers) * 100) : 0
        }
      }
    });
  })
);

// Get current user's votes
router.get('/my-votes',
  authenticate,
  [
    query('projectId').optional().isMongoId().withMessage('Invalid project ID'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
  ],
  validateRequest,
  catchAsync(async (req, res) => {
    const { projectId, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const query = { member: req.user._id };
    if (projectId) {
      query.redevelopmentProject = projectId;
    }

    const votes = await MemberVote.find(query)
      .populate('redevelopmentProject', 'title status society')
      .populate({
        path: 'redevelopmentProject',
        populate: {
          path: 'society',
          select: 'name'
        }
      })
      .populate('proposal', 'title developer')
      .sort({ votedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await MemberVote.countDocuments(query);

    res.status(200).json({
      status: 'success',
      data: {
        votes,
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

// Get my vote for a specific project and session
router.get('/my-vote/:projectId/:session',
  authenticate,
  [
    param('projectId').isMongoId().withMessage('Invalid project ID'),
    param('session').trim().isLength({ min: 1 }).withMessage('Session is required')
  ],
  validateRequest,
  catchAsync(async (req, res) => {
    const { projectId, session } = req.params;

    const vote = await MemberVote.findOne({
      project: projectId,
      member: req.user._id,
      votingSession: session
    }).populate('project', 'title');

    if (!vote) {
      return res.status(404).json({
        status: 'error',
        message: 'Vote not found'
      });
    }

    res.json({
      status: 'success',
      data: {
        vote: {
          _id: vote._id,
          vote: vote.vote,
          reason: vote.reason,
          votedAt: vote.votedAt,
          project: vote.project
        }
      }
    });
  })
);

// Get voting statistics for a project
router.get('/stats/:projectId',
  authenticate,
  [
    param('projectId').isMongoId().withMessage('Invalid project ID'),
    query('session').optional().trim()
  ],
  validateRequest,
  catchAsync(async (req, res) => {
    const { projectId } = req.params;
    const { session } = req.query;

    const project = await RedevelopmentProject.findById(projectId).populate('society');
    if (!project) {
      return res.status(404).json({
        status: 'error',
        message: 'Project not found'
      });
    }

    // Get voting statistics
    const votingStats = await MemberVote.getVotingStats(projectId, session);
    
    const stats = {
      yesVotes: 0,
      noVotes: 0,
      abstainVotes: 0
    };

    votingStats.forEach(stat => {
      if (stat._id === 'yes') stats.yesVotes = stat.count;
      if (stat._id === 'no') stats.noVotes = stat.count;
      if (stat._id === 'abstain') stats.abstainVotes = stat.count;
    });

    const totalVotes = stats.yesVotes + stats.noVotes + stats.abstainVotes;
    const approvalPercentage = totalVotes > 0 ? Math.round((stats.yesVotes / totalVotes) * 100) : 0;

    // Get total eligible members
    const totalMembers = await SocietyMember.countDocuments({
      society: project.society._id,
      status: 'active'
    });

    // Check if voting deadline is approaching
    const now = new Date();
    const votingDeadline = project.votingDeadline ? new Date(project.votingDeadline) : null;
    const hoursRemaining = votingDeadline ? Math.max(0, Math.floor((votingDeadline - now) / (1000 * 60 * 60))) : null;

    res.status(200).json({
      status: 'success',
      data: {
        statistics: {
          totalMembers,
          totalVotes,
          yesVotes: stats.yesVotes,
          noVotes: stats.noVotes,
          abstainVotes: stats.abstainVotes,
          approvalPercentage,
          participationRate: totalMembers > 0 ? Math.round((totalVotes / totalMembers) * 100) : 0,
          minimumApprovalRequired: project.minimumApprovalPercentage,
          isApproved: approvalPercentage >= project.minimumApprovalPercentage,
          votingStatus: project.status,
          votingDeadline: project.votingDeadline,
          hoursRemaining,
          votingSession: session
        }
      }
    });
  })
);

// Verify a vote (admin/owner only)
router.post('/:id/verify',
  authenticate,
  authorize('society_owner'),
  [
    param('id').isMongoId().withMessage('Invalid vote ID')
  ],
  validateRequest,
  catchAsync(async (req, res) => {
    const vote = await MemberVote.findById(req.params.id);

    if (!vote) {
      return res.status(404).json({
        status: 'error',
        message: 'Vote not found'
      });
    }

    // Verify user is the owner of the project
    const project = await RedevelopmentProject.findById(vote.redevelopmentProject);
    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'Only the project owner can verify votes'
      });
    }

    vote.isVerified = true;
    vote.verifiedBy = req.user._id;
    vote.verifiedAt = new Date();
    await vote.save();

    res.status(200).json({
      status: 'success',
      message: 'Vote verified successfully',
      data: { vote }
    });
  })
);

// Check if current user has voted
router.get('/check-voted/:projectId',
  authenticate,
  [
    param('projectId').isMongoId().withMessage('Invalid project ID'),
    query('session').optional().trim()
  ],
  validateRequest,
  catchAsync(async (req, res) => {
    const { projectId } = req.params;
    const { session } = req.query;

    const query = {
      redevelopmentProject: projectId,
      member: req.user._id
    };

    if (session) {
      query.votingSession = session;
    }

    const existingVote = await MemberVote.findOne(query);

    res.status(200).json({
      status: 'success',
      data: {
        hasVoted: !!existingVote,
        vote: existingVote || null
      }
    });
  })
);

export default router;
