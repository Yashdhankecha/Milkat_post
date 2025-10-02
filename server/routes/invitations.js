import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth.js';
import { catchAsync } from '../middleware/errorHandler.js';
import Invitation from '../models/Invitation.js';
import Society from '../models/Society.js';
import User from '../models/User.js';
import Profile from '../models/Profile.js';
import Notification from '../models/Notification.js';
import SocietyMember from '../models/SocietyMember.js';

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
    body('invitedName').optional().trim().isLength({ min: 1, max: 100 }).withMessage('Name must be between 1-100 characters'),
    body('invitedEmail').optional().custom((value) => {
      if (value && value.trim() !== '' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        throw new Error('Invalid email address');
      }
      return true;
    }),
    body('message').optional().trim().isLength({ max: 500 }).withMessage('Message must be less than 500 characters')
  ],
  validateRequest,
  catchAsync(async (req, res) => {
    const { society_id, invitedPhone, invitationType, invitedName, invitedEmail, message } = req.body;
    const invitedBy = req.user._id;

    console.log('/api/invitations/send - headers:', req.headers);
    console.log('/api/invitations/send - body:', req.body);
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

    // Check if user is already invited (pending or sent)
    const existingInvitation = await Invitation.findOne({
      society: society_id,
      invitedPhone,
      status: { $in: ['pending', 'sent'] }
    });

    if (existingInvitation) {
      return res.status(400).json({
        status: 'error',
        message: 'User has already been invited to this society',
        errorCode: 'ALREADY_INVITED',
        data: { 
          invitationId: existingInvitation._id,
          invitedPhone: invitedPhone,
          societyId: society_id
        }
      });
    }

    // Check if user has any previous invitations (including declined/expired) to prevent spam
    const anyPreviousInvitation = await Invitation.findOne({
      society: society_id,
      invitedPhone,
      status: { $in: ['accepted', 'declined', 'expired', 'cancelled'] }
    });

    if (anyPreviousInvitation) {
      return res.status(400).json({
        status: 'error',
        message: 'User has already been invited to this society previously',
        errorCode: 'PREVIOUSLY_INVITED',
        data: { 
          invitationId: anyPreviousInvitation._id,
          invitedPhone: invitedPhone,
          societyId: society_id,
          previousStatus: anyPreviousInvitation.status
        }
      });
    }

    // Check if user is already a member of the society
    // First, find the user by phone number
    const invitedUser = await User.findOne({ phone: invitedPhone });
    
    if (invitedUser) {
      // Check if user is already a member
      const existingMember = await SocietyMember.findOne({
        society: society_id,
        user: invitedUser._id,
        status: 'active'
      });

      if (existingMember) {
        return res.status(400).json({
          status: 'error',
          message: 'User is already a member of this society',
          errorCode: 'ALREADY_MEMBER',
          data: { 
            invitedPhone: invitedPhone,
            societyId: society_id,
            memberId: existingMember._id
          }
        });
      }

      // Check if user is the society owner
      if (society.owner.toString() === invitedUser._id.toString()) {
        return res.status(400).json({
          status: 'error',
          message: 'Cannot invite the society owner',
          errorCode: 'IS_OWNER',
          data: { 
            invitedPhone: invitedPhone,
            societyId: society_id
          }
        });
      }
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
        recipient: registeredUser._id,
        sender: req.user._id,
        type: 'invitation',
        title: `Invitation to join ${society.name}`,
        message: message || `You have been invited to join ${society.name} as a ${invitationType.replace('_', ' ')}.`,
        data: {
          metadata: {
            invitationId: invitation._id,
            societyId: society_id,
            invitationType,
            societyName: society.name
          }
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

    // Import SocietyMember model
    const SocietyMember = (await import('../models/SocietyMember.js')).default;

    // Create or update society membership
    const memberData = {
      role: invitation.invitationType,
      status: 'active',
      joinedAt: new Date(),
      metadata: {
        invitationId: invitation._id,
        addedBy: invitation.invitedBy,
        addedAt: new Date()
      }
    };

    // Check if member already exists
    const existingMember = await SocietyMember.findOne({
      society: invitation.society,
      user: req.user._id
    });

    let societyMember;
    if (existingMember) {
      // Reactivate if removed
      if (existingMember.status === 'removed') {
        existingMember.status = 'active';
        existingMember.removedAt = null;
        existingMember.joinedAt = new Date();
        societyMember = await existingMember.save();
      } else {
        return res.status(409).json({
          status: 'error',
          message: 'You are already a member of this society',
          errorCode: 'ALREADY_MEMBER'
        });
      }
    } else {
      societyMember = await SocietyMember.create({
        society: invitation.society,
        user: req.user._id,
        ...memberData
      });
    }

    console.log(`Member added to society: ${societyMember._id}`);

    // Send notification to society owner
    const society = await Society.findById(invitation.society);
    if (society && society.owner) {
      const notification = new Notification({
        recipient: society.owner,
        sender: req.user._id,
        type: 'invitation_accepted',
        title: 'Invitation Accepted',
        message: `${req.user.phone} has accepted your invitation to join ${society.name}`,
        data: {
          metadata: {
            invitationId: invitation._id,
            acceptedBy: req.user._id,
            societyId: invitation.society
          }
        }
      });
      await notification.save();
    }

    // Store invitation data before deletion for response
    const invitationData = {
      id: invitation._id,
      status: invitation.status,
      acceptedAt: invitation.acceptedAt,
      society: invitation.society,
      invitationType: invitation.invitationType
    };

    // Remove the invitation from database after successful acceptance
    await Invitation.findByIdAndDelete(invitation._id);
    console.log(`Invitation ${invitation._id} removed from database after acceptance`);

    res.status(200).json({
      status: 'success',
      message: 'Invitation accepted successfully. You are now a member of the society.',
      data: { 
        invitation: invitationData, 
        societyMember: {
          id: societyMember._id,
          role: societyMember.role,
          status: societyMember.status,
          joinedAt: societyMember.joinedAt
        }
      }
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
        recipient: society.owner,
        sender: req.user._id,
        type: 'invitation_declined',
        title: 'Invitation Declined',
        message: `${req.user.phone} has declined your invitation to join ${society.name}`,
        data: {
          metadata: {
            invitationId: invitation._id,
            declinedBy: req.user._id,
            societyId: invitation.society
          }
        }
      });
      await notification.save();
    }

    // Store invitation data before deletion for response
    const invitationData = {
      id: invitation._id,
      status: invitation.status,
      declinedAt: invitation.declinedAt,
      society: invitation.society,
      invitationType: invitation.invitationType
    };

    // Remove the invitation from database after successful decline
    await Invitation.findByIdAndDelete(invitation._id);
    console.log(`Invitation ${invitation._id} removed from database after decline`);

    res.status(200).json({
      status: 'success',
      message: 'Invitation declined successfully',
      data: { invitation: invitationData }
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

// GET /api/invitations/member/:userId - Get all invitations for a specific user (member)
router.get(
  '/member/:userId',
  authenticate,
  [
    param('userId').isMongoId().withMessage('Invalid user ID'),
    query('status').optional().isIn(['pending', 'sent', 'accepted', 'declined', 'expired', 'cancelled']).withMessage('Invalid status')
  ],
  validateRequest,
  catchAsync(async (req, res) => {
    const { userId } = req.params;
    const { status } = req.query;

    // Check if user is requesting their own invitations
    if (req.user._id.toString() !== userId) {
      return res.status(403).json({
        status: 'error',
        message: 'You can only view your own invitations'
      });
    }

    // Find user to get phone number
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Build query
    const query = {
      invitedPhone: user.phone,
      isUserRegistered: true,
      registeredUserId: userId
    };

    // Filter by status if provided, otherwise get pending and sent invitations
    if (status) {
      query.status = status;
    } else {
      query.status = { $in: ['pending', 'sent'] };
    }

    // Fetch invitations
    const invitations = await Invitation.find(query)
      .populate('society', 'name address city state societyCode totalFlats')
      .populate('invitedBy', 'phone fullName')
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      status: 'success',
      message: 'Invitations fetched successfully',
      data: {
        invitations,
        count: invitations.length
      }
    });
  })
);

// POST /api/invitations/respond - Respond to an invitation (accept or reject)
router.post(
  '/respond',
  authenticate,
  [
    body('invitationId').isMongoId().withMessage('Invalid invitation ID'),
    body('response').isIn(['accept', 'reject']).withMessage('Response must be either "accept" or "reject"')
  ],
  validateRequest,
  catchAsync(async (req, res) => {
    const { invitationId, response } = req.body;
    const userId = req.user._id;

    console.log(`Responding to invitation ${invitationId} with ${response} by user ${userId}`);

    // Find invitation
    const invitation = await Invitation.findById(invitationId).populate('society');
    
    if (!invitation) {
      return res.status(404).json({
        status: 'error',
        message: 'Invitation not found'
      });
    }

    // Check if invitation belongs to the user
    if (invitation.registeredUserId.toString() !== userId.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'This invitation does not belong to you'
      });
    }

    // Check if invitation is already responded to
    if (invitation.status === 'accepted' || invitation.status === 'declined') {
      return res.status(400).json({
        status: 'error',
        message: `Invitation has already been ${invitation.status}`,
        errorCode: 'ALREADY_RESPONDED',
        data: { currentStatus: invitation.status }
      });
    }

    // Check if invitation has expired
    if (invitation.status === 'expired' || (invitation.expiresAt && new Date() > invitation.expiresAt)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invitation has expired',
        errorCode: 'INVITATION_EXPIRED'
      });
    }

    // Handle response
    if (response === 'accept') {
      // Update invitation status
      invitation.status = 'accepted';
      invitation.respondedAt = new Date();
      await invitation.save();

      // Add user to society members
      try {
        const memberData = {
          role: invitation.invitationType,
          metadata: {
            invitationId: invitation._id,
            addedBy: invitation.invitedBy,
            addedAt: new Date()
          }
        };

        // Check if member already exists
        const existingMember = await SocietyMember.findOne({
          society: invitation.society._id,
          user: userId
        });

        let societyMember;
        if (existingMember) {
          // Reactivate if removed
          if (existingMember.status === 'removed') {
            existingMember.status = 'active';
            existingMember.removedAt = null;
            existingMember.joinedAt = new Date();
            societyMember = await existingMember.save();
          } else {
            return res.status(409).json({
              status: 'error',
              message: 'You are already a member of this society',
              errorCode: 'ALREADY_MEMBER'
            });
          }
        } else {
          societyMember = await SocietyMember.create({
            society: invitation.society._id,
            user: userId,
            ...memberData,
            status: 'active'
          });
        }

        console.log(`Member added to society: ${societyMember._id}`);
        console.log('Member details:', {
          id: societyMember._id,
          society: societyMember.society,
          user: societyMember.user,
          role: societyMember.role,
          status: societyMember.status
        });

        // Create notification for society owner
        const notification = new Notification({
          recipient: invitation.invitedBy,
          sender: userId,
          type: 'invitation_accepted',
          title: 'Invitation Accepted',
          message: `${req.user.phone} has accepted your invitation to join ${invitation.society.name}`,
          data: {
            invitationId: invitation._id,
            acceptedBy: userId,
            societyId: invitation.society._id,
            societyMemberId: societyMember._id
          }
        });
        await notification.save();

        console.log(`Notification sent to society owner: ${notification._id}`);

        // Store invitation data before deletion for response
        const invitationData = {
          id: invitation._id,
          status: invitation.status,
          acceptedAt: invitation.acceptedAt,
          society: invitation.society,
          invitationType: invitation.invitationType
        };

        // Remove the invitation from database after successful acceptance
        await Invitation.findByIdAndDelete(invitation._id);
        console.log(`Invitation ${invitation._id} removed from database after acceptance`);

        res.status(200).json({
          status: 'success',
          message: `You have successfully joined ${invitation.society.name}`,
          data: {
            invitation: invitationData,
            societyMember
          }
        });

      } catch (error) {
        // Rollback invitation status if member creation fails
        invitation.status = 'sent';
        invitation.respondedAt = null;
        await invitation.save();
        
        console.error('Error adding member to society:', error);
        throw error;
      }

    } else if (response === 'reject') {
      // Update invitation status
      invitation.status = 'declined';
      invitation.respondedAt = new Date();
      await invitation.save();

      console.log(`Invitation declined: ${invitation._id}`);

      // Create notification for society owner
      const notification = new Notification({
        recipient: invitation.invitedBy,
        sender: userId,
        type: 'invitation_declined',
        title: 'Invitation Declined',
        message: `${req.user.phone} has declined your invitation to join ${invitation.society.name}`,
        data: {
          invitationId: invitation._id,
          declinedBy: userId,
          societyId: invitation.society._id
        }
      });
      await notification.save();

      console.log(`Notification sent to society owner: ${notification._id}`);

      // Store invitation data before deletion for response
      const invitationData = {
        id: invitation._id,
        status: invitation.status,
        declinedAt: invitation.declinedAt,
        society: invitation.society,
        invitationType: invitation.invitationType
      };

      // Remove the invitation from database after successful decline
      await Invitation.findByIdAndDelete(invitation._id);
      console.log(`Invitation ${invitation._id} removed from database after decline`);

      res.status(200).json({
        status: 'success',
        message: 'Invitation declined successfully',
        data: { invitation: invitationData }
      });
    }
  })
);

// GET /api/invitations/my - Get current user's invitations (authenticated)
router.get(
  '/my',
  authenticate,
  [
    query('status').optional().isIn(['pending', 'sent', 'accepted', 'declined', 'expired', 'cancelled']).withMessage('Invalid status')
  ],
  validateRequest,
  catchAsync(async (req, res) => {
    const { status } = req.query;
    const userId = req.user._id;

    // Find user to get phone number
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Build query
    const query = {
      invitedPhone: user.phone
    };

    // Filter by status if provided, otherwise get pending and sent invitations
    if (status) {
      query.status = status;
    } else {
      query.status = { $in: ['pending', 'sent'] };
    }

    // Fetch invitations
    const invitations = await Invitation.find(query)
      .populate('society', 'name address city state societyCode totalFlats amenities images')
      .populate('invitedBy', 'phone fullName')
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      status: 'success',
      message: 'Your invitations fetched successfully',
      data: {
        invitations,
        count: invitations.length
      }
    });
  })
);

export default router;
