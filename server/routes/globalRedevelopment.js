import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { catchAsync } from '../middleware/errorHandler.js';
import RedevelopmentProject from '../models/RedevelopmentProject.js';
import DeveloperProposal from '../models/DeveloperProposal.js';
import Society from '../models/Society.js';
import SocietyMember from '../models/SocietyMember.js';
import Notification from '../models/Notification.js';

const router = express.Router();

// Test route to check if the server is working
router.get('/test', (req, res) => {
  res.json({ message: 'Global redevelopment route is working' });
});

// Get all redevelopment projects globally (for builders) - STEP BY STEP
router.get('/projects', async (req, res) => {
  console.log('=== DATABASE ROUTE CALLED ===');
  console.log('Query params:', req.query);
  
  try {
    // Step 1: Test if RedevelopmentProject model exists
    console.log('Step 1: Testing RedevelopmentProject model...');
    console.log('RedevelopmentProject model:', typeof RedevelopmentProject);
    
    if (!RedevelopmentProject) {
      throw new Error('RedevelopmentProject model is not defined');
    }
    
    // Step 2: Test database connection
    console.log('Step 2: Testing database connection...');
    const dbStatus = RedevelopmentProject.db.readyState;
    console.log('Database ready state:', dbStatus);
    
    if (dbStatus !== 1) {
      throw new Error(`Database not connected. Ready state: ${dbStatus}`);
    }
    
    // Step 3: Try simple database query
    console.log('Step 3: Executing simple database query...');
    const projects = await RedevelopmentProject.find({}).limit(5);
    console.log('Found projects:', projects.length);
    
    if (projects.length > 0) {
      console.log('Sample project structure:', Object.keys(projects[0].toObject()));
    }
    
    const response = {
      success: true,
      data: {
        projects: projects,
        pagination: {
          current: 1,
          pages: 1,
          total: projects.length,
          limit: 12
        }
      }
    };
    
    console.log('Sending response with', projects.length, 'projects');
    res.json(response);
    
  } catch (error) {
    console.error('=== ERROR in database route ===');
    console.error('Error message:', error.message);
    console.error('Error name:', error.name);
    console.error('Error stack:', error.stack);
    
    res.status(500).json({
      success: false,
      message: 'Database route error',
      error: error.message,
      stack: error.stack
    });
  }
});

// Get specific redevelopment project details (for builders)
router.get('/projects/:projectId', authenticate, async (req, res) => {
  try {
    const { projectId } = req.params;
    
    const project = await RedevelopmentProject.findById(projectId)
      .populate('society', 'name address city state pincode societyType totalFlats amenities flatVariants')
      .populate('owner', 'phone name')
      .populate('selectedDeveloper', 'phone name');
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Redevelopment project not found'
      });
    }
    
    // Check if developer has already submitted a proposal
    const existingProposal = await DeveloperProposal.findOne({
      redevelopmentProject: projectId,
      developer: req.user._id
    });
    
    const projectObj = project.toObject();
    projectObj.hasProposal = !!existingProposal;
    projectObj.proposalStatus = existingProposal ? existingProposal.status : null;
    projectObj.existingProposal = existingProposal;
    
    res.json({
      success: true,
      data: projectObj
    });
  } catch (error) {
    console.error('Error fetching redevelopment project details:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Submit a proposal for a redevelopment project (Builders)
router.post('/projects/:projectId/proposals', authenticate, async (req, res) => {
  try {
    const { projectId } = req.params;
    const {
      title,
      description,
      fsi,
      corpus,
      rent,
      timeline,
      amenities,
      financialBreakdown,
      developerCredentials,
      additionalTerms
    } = req.body;
    
    // Validation
    if (!title || !description || !fsi || !corpus || !rent || !timeline) {
      return res.status(400).json({
        success: false,
        message: 'Title, description, FSI, corpus, rent, and timeline are required'
      });
    }
    
    // Verify project exists and is open for proposals
    const project = await RedevelopmentProject.findById(projectId)
      .populate('society', 'name owner')
      .populate('owner', 'phone name');
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Redevelopment project not found'
      });
    }
    
    if (!['planning', 'tender_open', 'proposals_received'].includes(project.status)) {
      return res.status(400).json({
        success: false,
        message: 'This project is not accepting proposals at the moment'
      });
    }
    
    // Check if developer has already submitted a proposal
    const existingProposal = await DeveloperProposal.findOne({
      redevelopmentProject: projectId,
      developer: req.user._id
    });
    
    if (existingProposal) {
      return res.status(400).json({
        success: false,
        message: 'You have already submitted a proposal for this project'
      });
    }
    
    // Get or create developer profile
    const Profile = (await import('../models/Profile.js')).default;
    let developerProfile = await Profile.findOne({
      user: req.user._id,
      role: 'developer'
    });
    
    if (!developerProfile) {
      // Create a basic developer profile if it doesn't exist
      developerProfile = new Profile({
        user: req.user._id,
        role: 'developer',
        fullName: req.user.name || 'Developer',
        phone: req.user.phone || '',
        isActive: true
      });
      
      await developerProfile.save();
      
      // Update user's current role if not set
      if (!req.user.currentRole) {
        req.user.currentRole = 'developer';
        req.user.activeRole = 'developer';
        await req.user.save();
      }
      
      console.log('Created developer profile for user:', req.user._id);
    }
    
    // Create proposal
    const proposal = new DeveloperProposal({
      redevelopmentProject: projectId,
      developer: req.user._id,
      developerProfile: developerProfile._id,
      title,
      description,
      fsi: parseFloat(fsi),
      corpusAmount: parseFloat(corpus),
      rentAmount: parseFloat(rent),
      timeline: timeline, // Keep as string since it can be "24 months"
      amenities: amenities || [],
      financialBreakdown: financialBreakdown || {},
      developerCredentials: developerCredentials || {},
      additionalTerms: additionalTerms || '',
      status: 'submitted',
      metadata: {
        source: 'global_tender',
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent')
      }
    });
    
    await proposal.save();
    
    // Update project status if it's the first proposal
    if (project.status === 'planning' || project.status === 'tender_open') {
      project.status = 'proposals_received';
      await project.save();
    }
    
    // Create notification for project owner (society owner)
    try {
      const notification = new Notification({
        recipient: project.owner._id,
        sender: req.user._id,
        type: 'developer_proposal_submitted',
        title: 'New Developer Proposal',
        message: `A new proposal has been submitted for ${project.title} by ${developerProfile.company_name || req.user.name}`,
        data: {
          societyId: project.society._id,
          redevelopmentProjectId: project._id,
          proposalId: proposal._id,
          developerId: req.user._id
        },
        priority: 'medium'
      });
      
      await notification.save();
      console.log('Notification created successfully for project owner:', project.owner._id);
    } catch (notificationError) {
      console.error('Error creating notification:', notificationError);
      // Don't fail the proposal submission if notification fails
    }
    
    // Populate the created proposal
    await proposal.populate([
      { path: 'redevelopmentProject', select: 'title society' },
      { path: 'developer', select: 'phone name' },
      { path: 'developerProfile', select: 'company_name fullName' }
    ]);
    
    res.status(201).json({
      success: true,
      message: 'Proposal submitted successfully',
      data: proposal
    });
  } catch (error) {
    console.error('Error submitting proposal:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get developer's submitted proposals
router.get('/my-proposals', authenticate, authorize(['developer']), async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    
    const filter = { developer: req.user._id };
    if (status) filter.status = status;
    
    const skip = (page - 1) * limit;
    
    const proposals = await DeveloperProposal.find(filter)
      .populate('redevelopmentProject', 'title status budget expectedCompletion')
      .populate('redevelopmentProject.society', 'name city state')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await DeveloperProposal.countDocuments(filter);
    
    res.json({
      success: true,
      data: {
        proposals,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total,
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching developer proposals:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get proposal details
router.get('/proposals/:proposalId', authenticate, authorize(['developer', 'society_owner']), async (req, res) => {
  try {
    const { proposalId } = req.params;
    
    const proposal = await DeveloperProposal.findById(proposalId)
      .populate('redevelopmentProject', 'title description budget requirements')
      .populate('redevelopmentProject.society', 'name address city state')
      .populate('developer', 'phone name')
      .populate('developerProfile', 'company_name fullName');
    
    if (!proposal) {
      return res.status(404).json({
        success: false,
        message: 'Proposal not found'
      });
    }
    
    // Check access permissions
    if (req.user.role === 'developer' && proposal.developer._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view your own proposals.'
      });
    }
    
    if (req.user.role === 'society_owner') {
      const project = await RedevelopmentProject.findById(proposal.redevelopmentProject._id)
        .populate('society', 'owner');
      
      if (project.society.owner.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can only view proposals for your society projects.'
        });
      }
    }
    
    res.json({
      success: true,
      data: proposal
    });
  } catch (error) {
    console.error('Error fetching proposal details:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get proposals for a specific project (Society Owner)
router.get('/projects/:projectId/proposals', authenticate, authorize(['society_owner']), async (req, res) => {
  try {
    const { projectId } = req.params;
    const { status, page = 1, limit = 10 } = req.query;
    
    // Verify project exists and user has access
    const project = await RedevelopmentProject.findById(projectId)
      .populate('society', 'name owner');
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Redevelopment project not found'
      });
    }
    
    if (project.society.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You are not the owner of this society.'
      });
    }
    
    const filter = { redevelopmentProject: projectId };
    if (status) filter.status = status;
    
    const skip = (page - 1) * limit;
    
    const proposals = await DeveloperProposal.find(filter)
      .populate('developer', 'phone name')
      .populate('developerProfile', 'company_name fullName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await DeveloperProposal.countDocuments(filter);
    
    res.json({
      success: true,
      data: {
        proposals,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total,
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching project proposals:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get redevelopment project statistics for builders
router.get('/statistics', authenticate, authorize(['developer']), async (req, res) => {
  try {
    const { city, state } = req.query;
    
    // Build filter for projects
    const projectFilter = {
      status: { $in: ['planning', 'tender_open', 'proposals_received'] }
    };
    
    // Get projects with location filter
    let projects = await RedevelopmentProject.find(projectFilter)
      .populate('society', 'city state');
    
    if (city || state) {
      projects = projects.filter(project => {
        if (city && !project.society.city.toLowerCase().includes(city.toLowerCase())) {
          return false;
        }
        if (state && !project.society.state.toLowerCase().includes(state.toLowerCase())) {
          return false;
        }
        return true;
      });
    }
    
    // Get developer's proposals
    const proposals = await DeveloperProposal.find({ developer: req.user._id });
    
    // Calculate statistics
    const statistics = {
      totalProjects: projects.length,
      projectsByStatus: {
        planning: projects.filter(p => p.status === 'planning').length,
        tender_open: projects.filter(p => p.status === 'tender_open').length,
        proposals_received: projects.filter(p => p.status === 'proposals_received').length
      },
      projectsByLocation: {},
      myProposals: {
        total: proposals.length,
        submitted: proposals.filter(p => p.status === 'submitted').length,
        shortlisted: proposals.filter(p => p.status === 'shortlisted').length,
        selected: proposals.filter(p => p.status === 'selected').length,
        rejected: proposals.filter(p => p.status === 'rejected').length
      },
      averageBudget: projects.length > 0 ? 
        projects.reduce((sum, p) => sum + (p.budget || 0), 0) / projects.length : 0
    };
    
    // Group by location
    projects.forEach(project => {
      const location = `${project.society.city}, ${project.society.state}`;
      statistics.projectsByLocation[location] = (statistics.projectsByLocation[location] || 0) + 1;
    });
    
    res.json({
      success: true,
      data: statistics
    });
  } catch (error) {
    console.error('Error fetching redevelopment statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export default router;
