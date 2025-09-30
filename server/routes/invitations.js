import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth.js';
import { catchAsync } from '../middleware/errorHandler.js';
import Invitation from '../models/Invitation.js';
import Society from '../models/Society.js';
import User from '../models/User.js';
import Profile from '../models/Profile.js';
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

// Custom middleware to check society ownership for POST requests
const authorizeSocietyOwner = async (req, res, next) => {
  try {
    const { society_id } = req.body;
    console.log('Authorization check - User ID:', req.user._id);
    console.log('Authorization check - Society ID:', society_id);
    
    // Check if user has society_owner profile for this specific society
    const ownerProfile = await Profile.findOne({
      user: req.user._id,
      companyName: society_id,
      role: 'society_owner',
      status: 'active'
    });
    
    console.log('Found owner profile:', ownerProfile);
    
    if (!ownerProfile) {
      // Let's also check what profiles this user actually has
      const allUserProfiles = await Profile.find({
        user: req.user._id
      });
      console.log('All profiles for this user:', allUserProfiles);
      
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. You are not the owner of this society.',
        debug: {
          userId: req.user._id,
          societyId: society_id,
          userProfiles: allUserProfiles.map(p => ({
            role: p.role,
            companyName: p.companyName,
            status: p.status
          }))
        }
      });
    }
    
    req.societyOwnerProfile = ownerProfile;
    next();
  } catch (error) {
    console.error('Society ownership check error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Server error during authorization check.'
    });
  }
};

// Custom middleware to check society ownership for GET requests
const authorizeSocietyOwnerQuery = async (req, res, next) => {
  try {
    const { society_id } = req.query;
    
    if (society_id) {
      // Check if user has society_owner profile for this specific society
      const ownerProfile = await Profile.findOne({
        user: req.user._id,
        companyName: society_id,
        role: 'society_owner',
        status: 'active'
      });
      
      if (!ownerProfile) {
        return res.status(403).json({
          status: 'error',
          message: 'Access denied. You are not the owner of this society.'
        });
      }
      
      req.societyOwnerProfile = ownerProfile;
    }
    
    next();
  } catch (error) {
    console.error('Society ownership check error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Server error during authorization check.'
    });
  }
};

// Send invitation
router.post('/send',
  authenticate,
  authorize('society_owner'),
  [
    body('society_id').isMongoId().withMessage('Invalid society ID'),
    body('invitedPhone').isLength({ min: 10, max: 16 }).withMessage('Invalid phone number'),
    body('invitationType').isIn(['society_member', 'broker', 'developer']).withMessage('Invalid invitation type'),
    body('invitedName').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Name must be between 2-100 characters'),
    body('invitedEmail').optional().isEmail().withMessage('Invalid email address'),
    body('message').optional().trim().isLength({ max: 500 }).withMessage('Message must be less than 500 characters')
  ],
  validateRequest,
  catchAsync(async (req, res) => {
    const { society_id, invitedPhone, invitationType, invitedName, invitedEmail, message } = req.body;
    const invitedBy = req.user._id;

    console.log('Send invitation - User ID:', req.user._id);
    console.log('Send invitation - Society ID:', society_id);
    
    // Get society details
    const society = await Society.findById(society_id);
    if (!society) {
      return res.status(404).json({
        status: 'error',
        message: 'Society not found'
      });
    }
    
    // Verify the user is the owner of this society
    let ownerProfile = await Profile.findOne({
      user: req.user._id,
      companyName: society_id,
      role: 'society_owner',
      status: 'active'
    });
    
    console.log('Owner profile check:', ownerProfile);
    
    // If not found by companyName, check if user is the owner in the Society model
    if (!ownerProfile) {
      console.log('Checking Society.owner field...');
      if (society.owner.toString() === req.user._id.toString()) {
        console.log('User is the owner according to Society.owner field');
        // Update the profile to have the correct companyName
        ownerProfile = await Profile.findOne({
          user: req.user._id,
          role: 'society_owner',
          status: 'active'
        });
        
        if (ownerProfile) {
          ownerProfile.companyName = society_id;
          await ownerProfile.save();
          console.log('Updated owner profile companyName');
        }
      }
    }
    
    if (!ownerProfile) {
      return res.status(403).json({
        status: 'error',
        message: 'You can only send invitations for societies you own.'
      });
    }

    // Check if user is already invited
    const existingInvitation = await Invitation.findOne({
      society: society_id,
      invitedPhone,
      status: { $in: ['pending', 'sent'] }
    });

    if (existingInvitation) {
      return res.status(400).json({
        status: 'error',
        message: 'User has already been invited to this society',
        data: { invitationId: existingInvitation._id }
      });
    }

    // Check if user is already a member
    const existingMember = await Profile.findOne({
      companyName: society_id,
      phone: invitedPhone,
      status: 'active'
    });

    if (existingMember) {
      return res.status(400).json({
        status: 'error',
        message: 'User is already a member of this society'
      });
    }

    // Check if user is registered
    const registeredUser = await User.findOne({ phone: invitedPhone });
    const isUserRegistered = !!registeredUser;

    let invitationData = {
      society: society_id,
      invitedBy,
      invitedPhone,
      invitationType,
      invitedName: invitedName || null,
      invitedEmail: invitedEmail || null,
      message: message || null,
      isUserRegistered,
      registeredUserId: registeredUser?._id || null,
      metadata: {
        source: 'dashboard',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    };

    // Generate invitation token for unregistered users
    if (!isUserRegistered) {
      invitationData.invitationToken = Invitation.generateInvitationToken();
    }

    console.log('Creating invitation with data:', JSON.stringify(invitationData, null, 2));

    // Create invitation
    const invitation = new Invitation(invitationData);
    console.log('Invitation created, saving...');
    await invitation.save();
    console.log('Invitation saved successfully:', invitation._id);

    // Send invitation based on user status
    if (isUserRegistered) {
      console.log('User is registered, creating notification...');
      // Send notification to registered user
      const notification = new Notification({
        user: registeredUser._id,
        type: 'invitation',
        title: `Invitation to join ${society.name}`,
        message: message || `You have been invited to join ${society.name} as a ${invitationType.replace('_', ' ')}.`,
        data: {
          invitationId: invitation._id,
          societyId: society_id,
          invitationType,
          societyName: society.name
        },
        priority: 'high'
      });
      console.log('Notification created, saving...');
      await notification.save();
      console.log('Notification saved successfully:', notification._id);

      // Update invitation status
      invitation.status = 'sent';
      invitation.sentAt = new Date();
      await invitation.save();

      res.status(200).json({
        status: 'success',
        message: 'Invitation sent successfully to registered user',
        data: {
          invitation,
          notificationSent: true,
          userRegistered: true
        }
      });
    } else {
      // For unregistered users, simulate sending invitation message
      console.log(`📱 Mock SMS to ${invitedPhone}: You're invited to join ${society.name} on Nestly Estate. Download app and register with this number to accept.`);
      console.log(`📧 Mock Email to ${invitedEmail || 'N/A'}: Invitation to join ${society.name}`);
      
      // Update invitation status
      invitation.status = 'sent';
      invitation.sentAt = new Date();
      await invitation.save();

      res.status(200).json({
        status: 'success',
        message: 'Invitation sent successfully to unregistered user',
        data: {
          invitation,
          messageSent: true,
          userRegistered: false,
          mockMessage: `Invitation message sent to ${invitedPhone}. User will receive SMS/Email with registration link.`
        }
      });
    }
  })
);

// Get invitations sent by user
router.get('/sent',
  authenticate,
  authorizeSocietyOwnerQuery,
  [
    query('society_id').optional().isMongoId().withMessage('Invalid society ID'),
    query('status').optional().isIn(['pending', 'sent', 'accepted', 'declined', 'expired', 'cancelled']),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
  ],
  validateRequest,
  catchAsync(async (req, res) => {
    const { society_id, status, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    let query = { invitedBy: req.user._id };
    
    if (society_id) {
      query.society = society_id;
    }
    
    if (status) {
      query.status = status;
    }

    const invitations = await Invitation.find(query)
      .populate('society', 'name address city state')
      .populate('registeredUserId', 'phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Invitation.countDocuments(query);

    res.status(200).json({
      status: 'success',
      data: {
        invitations,
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

// Get invitations received by user
router.get('/received',
  authenticate,
  [
    query('status').optional().isIn(['pending', 'sent', 'accepted', 'declined', 'expired']),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
  ],
  validateRequest,
  catchAsync(async (req, res) => {
    const { status, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    let query = { 
      invitedPhone: req.user.phone,
      status: { $in: ['sent', 'pending'] }
    };
    
    if (status) {
      query.status = status;
    }

    const invitations = await Invitation.find(query)
      .populate('society', 'name address city state')
      .populate('invitedBy', 'phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Invitation.countDocuments(query);

    res.status(200).json({
      status: 'success',
      data: {
        invitations,
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

// Accept invitation
router.post('/:id/accept',
  authenticate,
  [
    param('id').isMongoId().withMessage('Invalid invitation ID'),
    body('responseMessage').optional().trim().isLength({ max: 500 }).withMessage('Response message must be less than 500 characters')
  ],
  validateRequest,
  catchAsync(async (req, res) => {
    const { id } = req.params;
    const { responseMessage } = req.body;

    const invitation = await Invitation.findById(id);
    if (!invitation) {
      return res.status(404).json({
        status: 'error',
        message: 'Invitation not found'
      });
    }

    // Check if invitation is for this user
    if (invitation.invitedPhone !== req.user.phone) {
      return res.status(403).json({
        status: 'error',
        message: 'You can only accept invitations sent to your phone number'
      });
    }

    // Check if invitation is still valid
    if (invitation.status !== 'sent' && invitation.status !== 'pending') {
      return res.status(400).json({
        status: 'error',
        message: 'Invitation is no longer valid'
      });
    }

    if (invitation.isExpired()) {
      return res.status(400).json({
        status: 'error',
        message: 'Invitation has expired'
      });
    }

    // Accept invitation
    await invitation.acceptInvitation(responseMessage);

    // Create or update user profile for the society
    const profileData = {
      user: req.user._id,
      companyName: invitation.society,
      role: invitation.invitationType,
      status: 'active',
      phone: req.user.phone,
      joinedAt: new Date()
    };

    await Profile.findOneAndUpdate(
      { user: req.user._id, companyName: invitation.society },
      profileData,
      { upsert: true, new: true }
    );

    // Send notification to society owner
    const society = await Society.findById(invitation.society);
    if (society && society.owner) {
      const notification = new Notification({
        user: society.owner,
        type: 'invitation_accepted',
        title: 'Invitation Accepted',
        message: `${req.user.phone} has accepted your invitation to join ${society.name}`,
        data: {
          invitationId: invitation._id,
          acceptedBy: req.user._id,
          societyId: invitation.society
        }
      });
      await notification.save();
    }

    res.status(200).json({
      status: 'success',
      message: 'Invitation accepted successfully',
      data: { invitation }
    });
  })
);

// Decline invitation
router.post('/:id/decline',
  authenticate,
  [
    param('id').isMongoId().withMessage('Invalid invitation ID'),
    body('responseMessage').optional().trim().isLength({ max: 500 }).withMessage('Response message must be less than 500 characters')
  ],
  validateRequest,
  catchAsync(async (req, res) => {
    const { id } = req.params;
    const { responseMessage } = req.body;

    const invitation = await Invitation.findById(id);
    if (!invitation) {
      return res.status(404).json({
        status: 'error',
        message: 'Invitation not found'
      });
    }

    // Check if invitation is for this user
    if (invitation.invitedPhone !== req.user.phone) {
      return res.status(403).json({
        status: 'error',
        message: 'You can only decline invitations sent to your phone number'
      });
    }

    // Check if invitation is still valid
    if (invitation.status !== 'sent' && invitation.status !== 'pending') {
      return res.status(400).json({
        status: 'error',
        message: 'Invitation is no longer valid'
      });
    }

    // Decline invitation
    await invitation.declineInvitation(responseMessage);

    // Send notification to society owner
    const society = await Society.findById(invitation.society);
    if (society && society.owner) {
      const notification = new Notification({
        user: society.owner,
        type: 'invitation_declined',
        title: 'Invitation Declined',
        message: `${req.user.phone} has declined your invitation to join ${society.name}`,
        data: {
          invitationId: invitation._id,
          declinedBy: req.user._id,
          societyId: invitation.society
        }
      });
      await notification.save();
    }

    res.status(200).json({
      status: 'success',
      message: 'Invitation declined successfully',
      data: { invitation }
    });
  })
);

// Cancel invitation (society owner only)
router.post('/:id/cancel',
  authenticate,
  authorize('society_owner'),
  [
    param('id').isMongoId().withMessage('Invalid invitation ID')
  ],
  validateRequest,
  catchAsync(async (req, res) => {
    const { id } = req.params;

    const invitation = await Invitation.findById(id);
    if (!invitation) {
      return res.status(404).json({
        status: 'error',
        message: 'Invitation not found'
      });
    }

    // Check if user owns the society
    if (invitation.invitedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'You can only cancel invitations you sent'
      });
    }

    // Check if invitation can be cancelled
    if (invitation.status === 'accepted' || invitation.status === 'declined') {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot cancel accepted or declined invitations'
      });
    }

    // Cancel invitation
    invitation.status = 'cancelled';
    await invitation.save();

    res.status(200).json({
      status: 'success',
      message: 'Invitation cancelled successfully',
      data: { invitation }
    });
  })
);

export default router;
