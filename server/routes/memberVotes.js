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

// Submit multiple votes in batch
router.post('/batch',
  authenticate,
  [
    body('votes').isArray().withMessage('Votes must be an array'),
    body('votes.*.redevelopmentProject').isMongoId().withMessage('Invalid project ID'),
    body('votes.*.vote').isIn(['yes', 'no', 'abstain']).withMessage('Vote must be yes, no, or abstain'),
    body('votes.*.votingSession').trim().notEmpty().withMessage('Voting session is required'),
    body('votes.*.proposal').optional().isMongoId().withMessage('Invalid proposal ID'),
  ],
  validateRequest,
  catchAsync(async (req, res) => {
    const { votes } = req.body;

    console.log('🔄 Batch voting request received:', {
      votesCount: votes?.length || 0,
      votes: votes?.map(v => ({
        proposal: v.proposal?.toString().slice(-4),
        vote: v.vote,
        session: v.votingSession,
      }))
    });

    if (!votes || votes.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'No votes provided'
      });
    }

    // Check voting eligibility for the first vote (assuming all votes are for the same project)
    const firstVote = votes[0];
    const eligibility = await checkVotingEligibility(req.user._id, firstVote.redevelopmentProject);
    
    if (!eligibility.eligible) {
      return res.status(403).json({
        status: 'error',
        message: eligibility.reason,
        errorCode: 'NOT_ELIGIBLE'
      });
    }

    // Check if user has already voted for any of these proposals in this session
    const existingVoteDoc = await MemberVote.findOne({
      redevelopmentProject: firstVote.redevelopmentProject,
      member: req.user._id
    });

    console.log('🔍 Checking for existing votes:', {
      existingVoteDoc: !!existingVoteDoc,
      existingVotesCount: existingVoteDoc?.votes?.length || 0,
      existingVotes: existingVoteDoc?.votes?.map(v => ({
        proposalId: v.proposalId?.toString().slice(-4),
        vote: v.vote,
        session: v.votingSession
      })) || []
    });

    if (existingVoteDoc) {
      // Check if user is trying to vote for proposals they already voted for
      const proposalIds = votes.filter(v => v.proposal).map(v => v.proposal);
      const duplicateProposals = [];
      
      for (const proposalId of proposalIds) {
        const existingVote = existingVoteDoc.votes.find(vote => 
          vote.proposalId && 
          vote.proposalId.toString() === proposalId.toString() &&
          vote.votingSession === firstVote.votingSession
        );
        
        if (existingVote) {
          duplicateProposals.push({
            proposalId: proposalId.toString().slice(-4),
            existingVote: existingVote.vote,
            session: existingVote.votingSession
          });
        }
      }

      console.log('🔍 Duplicate check results:', {
        proposalIds: proposalIds.map(id => id.toString().slice(-4)),
        duplicateProposalsFound: duplicateProposals.length,
        duplicateProposals
      });

      // Only block if ALL proposals are duplicates
      if (duplicateProposals.length === proposalIds.length && proposalIds.length > 0) {
        return res.status(409).json({
          status: 'error',
          message: 'You have already voted for all these proposals in this session',
          errorCode: 'ALREADY_VOTED',
          data: { duplicateProposals }
        });
      }
      
      // If some proposals are new, allow the request but log which ones are duplicates
      if (duplicateProposals.length > 0) {
        console.log('⚠️ Some proposals already voted for, will skip duplicates and add new ones');
      }
    }

    // Validate all proposals belong to the project
    const proposalIds = votes.filter(v => v.proposal).map(v => v.proposal);
    if (proposalIds.length > 0) {
      const validProposals = await DeveloperProposal.find({
        _id: { $in: proposalIds },
        redevelopmentProject: firstVote.redevelopmentProject
      });

      if (validProposals.length !== proposalIds.length) {
        return res.status(400).json({
          status: 'error',
          message: 'Some proposals do not belong to this project'
        });
      }
    }

    // Convert votes to new format and add to document
    const voteDataArray = votes.map(vote => {
      let voteBoolean;
      if (vote.vote === 'yes') voteBoolean = true;
      else if (vote.vote === 'no') voteBoolean = false;
      else if (vote.vote === 'abstain') voteBoolean = null;

      return {
        vote: voteBoolean,
        proposalId: vote.proposal || undefined,
        developerId: undefined,
        votingSession: vote.votingSession,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      };
    });

    // Create or update the vote document
    let memberVote;
    if (existingVoteDoc) {
      console.log('📝 Updating existing vote document');
      // Add all new votes to existing document at once
      const newVotes = [];
      for (const voteData of voteDataArray) {
        // Check if this vote already exists
        const existingVote = existingVoteDoc.votes.find(v => {
          if (v.proposalId && voteData.proposalId) {
            return v.proposalId.toString() === voteData.proposalId.toString() &&
                   v.votingSession === voteData.votingSession;
          }
          if (!v.proposalId && !voteData.proposalId) {
            return v.votingSession === voteData.votingSession;
          }
          return false;
        });

        if (!existingVote) {
          newVotes.push({
            ...voteData,
            votedAt: new Date()
          });
        } else {
          console.log('⚠️ Skipping duplicate vote:', {
            proposalId: voteData.proposalId?.toString().slice(-4),
            session: voteData.votingSession
          });
        }
      }

      console.log('📝 Adding new votes:', {
        newVotesCount: newVotes.length,
        newVotes: newVotes.map(v => ({
          proposalId: v.proposalId?.toString().slice(-4),
          vote: v.vote,
          session: v.votingSession
        }))
      });

      if (newVotes.length > 0) {
        existingVoteDoc.votes.push(...newVotes);
        existingVoteDoc.lastVotedAt = new Date();
        existingVoteDoc.totalVotes = existingVoteDoc.votes.length;
        await existingVoteDoc.save();
      }
      memberVote = existingVoteDoc;
    } else {
      console.log('📝 Creating new vote document with all votes');
      // Create new document with all votes
      memberVote = new MemberVote({
        redevelopmentProject: firstVote.redevelopmentProject,
        member: req.user._id,
        votes: voteDataArray.map(voteData => ({
          ...voteData,
          votedAt: new Date()
        })),
        lastVotedAt: new Date(),
        totalVotes: voteDataArray.length
      });
      await memberVote.save();
    }

    // Calculate updated voting statistics
    const votingStats = await MemberVote.getVotingStats(firstVote.redevelopmentProject, firstVote.votingSession);
    
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

    // Get project for notification
    const project = await RedevelopmentProject.findById(firstVote.redevelopmentProject);
    
    // Notify society owner about new votes (with error handling)
    try {
      await Notification.create({
        recipient: project.owner,
        type: 'member_voted',
        title: 'New Votes Cast',
        message: `A member has submitted ${voteDataArray.length} votes for "${project.title}"`,
        relatedEntity: {
          entityType: 'redevelopment_project',
          entityId: firstVote.redevelopmentProject
        }
      });
    } catch (notificationError) {
      console.warn('⚠️ Failed to create notification:', notificationError.message);
      // Don't fail the vote submission if notification fails
    }

    // Send real-time WebSocket notifications for each vote
    try {
      const socketService = (await import('../services/socketService.js')).default;
      const User = (await import('../models/User.js')).default;
      const voter = await User.findById(req.user._id).select('fullName');
      
      voteDataArray.forEach(voteData => {
        if (voteData.proposalId) {
          socketService.notifyVoteCast(
            firstVote.redevelopmentProject,
            req.user._id,
            voteData.proposalId,
            voteData.vote === 'yes' ? true : voteData.vote === 'no' ? false : null,
            voter?.fullName || 'Anonymous'
          );
        }
      });
    } catch (socketError) {
      console.warn('⚠️ Failed to send WebSocket notifications:', socketError.message);
      // Don't fail the vote submission if WebSocket fails
    }

    const newVotesAdded = memberVote.votes.length - (existingVoteDoc ? existingVoteDoc.votes.length : 0);
    
    console.log('✅ Batch votes submitted successfully:', {
      inputVotesCount: voteDataArray.length,
      newVotesAdded,
      finalVotesCount: memberVote.votes.length,
      memberVoteId: memberVote._id,
      projectId: firstVote.redevelopmentProject,
      allVotes: memberVote.votes.map(v => ({
        proposalId: v.proposalId?.toString().slice(-4),
        vote: v.vote,
        session: v.votingSession
      }))
    });

    res.status(201).json({
      status: 'success',
      message: `${newVotesAdded} new votes submitted successfully (${voteDataArray.length} requested, ${voteDataArray.length - newVotesAdded} were duplicates)`,
      data: {
        votes: memberVote.votes,
        newVotesAdded,
        totalVotesRequested: voteDataArray.length,
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

// Submit a vote
router.post('/',
  authenticate,
  [
    body('redevelopmentProject').isMongoId().withMessage('Invalid project ID'),
    body('vote').isIn(['yes', 'no', 'abstain']).withMessage('Vote must be yes, no, or abstain'),
    body('votingSession').trim().notEmpty().withMessage('Voting session is required'),
    body('proposal').optional().isMongoId().withMessage('Invalid proposal ID'),
  ],
  validateRequest,
  catchAsync(async (req, res) => {
    const {
      redevelopmentProject,
      vote,
      votingSession,
      proposal
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

    // Check if user has already voted for this specific proposal in this session
    const existingVoteDoc = await MemberVote.findOne({
      redevelopmentProject,
      member: req.user._id
    });

    if (existingVoteDoc) {
      // Check if user already voted for this specific proposal in this session
      const existingVote = existingVoteDoc.votes.find(v => {
        // If both votes have proposalId, check if they match
        if (v.proposalId && proposal) {
          return v.proposalId.toString() === proposal.toString() &&
                 v.votingSession === votingSession;
        }
        // If both votes don't have proposalId (general project votes), check session only
        if (!v.proposalId && !proposal) {
          return v.votingSession === votingSession;
        }
        // If one has proposalId and other doesn't, they are different votes
        return false;
      });

      if (existingVote) {
        return res.status(409).json({
          status: 'error',
          message: 'You have already voted for this proposal in this session',
          errorCode: 'ALREADY_VOTED',
          data: { existingVote }
        });
      }
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

    // Convert vote string to boolean
    let voteBoolean;
    if (vote === 'yes') voteBoolean = true;
    else if (vote === 'no') voteBoolean = false;
    else if (vote === 'abstain') voteBoolean = null;

    // Prepare vote data for the array
    const voteData = {
      vote: voteBoolean,
      proposalId: proposal || undefined,
      developerId: undefined,
      votingSession,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
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
        redevelopmentProject,
        member: req.user._id,
        votes: [voteData],
        lastVotedAt: new Date(),
        totalVotes: 1
      });
      await memberVote.save();
    }

    // Calculate updated voting statistics
    const votingStats = await MemberVote.getVotingStats(redevelopmentProject, votingSession);
    
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

    // Voting results are now fetched dynamically from MemberVote collection
    // No need to store/update voting results in project or proposal documents

    // Get project for notification
    const project = await RedevelopmentProject.findById(redevelopmentProject);
    
    // Notify society owner about new vote (with error handling)
    try {
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
    } catch (notificationError) {
      console.warn('⚠️ Failed to create notification:', notificationError.message);
      // Don't fail the vote submission if notification fails
    }

    console.log('✅ Single vote submitted successfully:', {
      memberVoteId: memberVote._id,
      votesCount: memberVote.votes.length,
      projectId: redevelopmentProject
    });

    res.status(201).json({
      status: 'success',
      message: 'Vote submitted successfully',
      data: {
        vote: voteData,
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

    let votes = [];
    if (includeDetails === 'true' && isOwner) {
      // Only owner can see detailed votes with member info
      const voteDocs = await MemberVote.find({ redevelopmentProject: projectId })
        .populate('member', 'phone fullName')
        .populate('votes.proposalId', 'title')
        .populate('votes.developerId', 'name email')
        .sort({ lastVotedAt: -1 });

      // Flatten votes from all documents
      voteDocs.forEach(doc => {
        doc.votes.forEach(vote => {
          if (!session || vote.votingSession === session) {
            votes.push({
              ...vote.toObject(),
              member: doc.member,
              redevelopmentProject: doc.redevelopmentProject
            });
          }
        });
      });

      // Sort by votedAt descending
      votes.sort((a, b) => new Date(b.votedAt) - new Date(a.votedAt));
    }

    // Get voting statistics
    const votingStats = await MemberVote.getVotingStats(projectId, session);
    
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

    const voteDocs = await MemberVote.find(query)
      .populate('redevelopmentProject', 'title status society')
      .populate({
        path: 'redevelopmentProject',
        populate: {
          path: 'society',
          select: 'name'
        }
      })
      .populate('votes.proposalId', 'title developer')
      .populate('votes.developerId', 'name email')
      .sort({ lastVotedAt: -1 });

    // Flatten votes from all documents
    let allVotes = [];
    voteDocs.forEach(doc => {
      doc.votes.forEach(vote => {
        allVotes.push({
          ...vote.toObject(),
          redevelopmentProject: doc.redevelopmentProject
        });
      });
    });

    // Sort by votedAt descending
    allVotes.sort((a, b) => new Date(b.votedAt) - new Date(a.votedAt));

    // Apply pagination
    const total = allVotes.length;
    const votes = allVotes.slice(skip, skip + parseInt(limit));

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

    const voteDoc = await MemberVote.findOne({
      redevelopmentProject: projectId,
      member: req.user._id
    }).populate('redevelopmentProject', 'title');

    if (!voteDoc) {
      return res.status(404).json({
        status: 'error',
        message: 'Vote not found'
      });
    }

    // Find the specific vote in the session
    const vote = voteDoc.votes.find(v => v.votingSession === session);

    if (!vote) {
      return res.status(404).json({
        status: 'error',
        message: 'Vote not found for this session'
      });
    }

    // Add project info to vote
    const voteWithProject = {
      ...vote.toObject(),
      redevelopmentProject: voteDoc.redevelopmentProject
    };

    res.json({
      status: 'success',
      data: {
        vote: voteWithProject
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
      if (stat._id === true) stats.yesVotes = stat.count;
      if (stat._id === false) stats.noVotes = stat.count;
      if (stat._id === null) stats.abstainVotes = stat.count;
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
    // Find the vote document containing the specific vote
    const voteDoc = await MemberVote.findOne({ 'votes._id': req.params.id });

    if (!voteDoc) {
      return res.status(404).json({
        status: 'error',
        message: 'Vote not found'
      });
    }

    // Find the specific vote in the array
    const vote = voteDoc.votes.find(v => v._id.toString() === req.params.id);

    if (!vote) {
      return res.status(404).json({
        status: 'error',
        message: 'Vote not found'
      });
    }

    // Verify user is the owner of the project
    const project = await RedevelopmentProject.findById(voteDoc.redevelopmentProject);
    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'Only the project owner can verify votes'
      });
    }

    // Update the specific vote
    vote.isVerified = true;
    vote.verifiedBy = req.user._id;
    vote.verifiedAt = new Date();
    await voteDoc.save();

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

    const voteDoc = await MemberVote.findOne({
      redevelopmentProject: projectId,
      member: req.user._id
    });

    let existingVote = null;
    if (voteDoc) {
      if (session) {
        // Find vote in specific session
        existingVote = voteDoc.votes.find(v => v.votingSession === session);
      } else {
        // Return true if user has any votes for this project
        existingVote = voteDoc.votes.length > 0 ? voteDoc.votes[0] : null;
      }
    }

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


