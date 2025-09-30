import mongoose from 'mongoose';

const invitationSchema = new mongoose.Schema({
  // Invitation Details
  society: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Society',
    required: true
  },
  invitedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  invitedPhone: {
    type: String,
    required: true,
    trim: true
  },
  invitedEmail: {
    type: String,
    trim: true,
    lowercase: true
  },
  invitedName: {
    type: String,
    trim: true
  },
  
  // Invitation Type
  invitationType: {
    type: String,
    enum: ['society_member', 'broker', 'developer'],
    required: true
  },
  
  // Invitation Status
  status: {
    type: String,
    enum: ['pending', 'sent', 'accepted', 'declined', 'expired', 'cancelled'],
    default: 'pending'
  },
  
  // Invitation Message
  message: {
    type: String,
    trim: true,
    maxlength: 500
  },
  
  // User Status Check
  isUserRegistered: {
    type: Boolean,
    default: false
  },
  registeredUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Invitation Tracking
  sentAt: Date,
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
  },
  acceptedAt: Date,
  declinedAt: Date,
  
  // Response Details
  responseMessage: String,
  
  // Invitation Token (for unregistered users)
  invitationToken: {
    type: String,
    unique: true,
    sparse: true
  },
  
  // Additional Data
  metadata: {
    source: {
      type: String,
      enum: ['dashboard', 'api', 'admin'],
      default: 'dashboard'
    },
    ipAddress: String,
    userAgent: String
  }
}, {
  timestamps: true
});

// Indexes
invitationSchema.index({ society: 1 });
invitationSchema.index({ invitedBy: 1 });
invitationSchema.index({ invitedPhone: 1 });
invitationSchema.index({ status: 1 });
invitationSchema.index({ invitationToken: 1 });
invitationSchema.index({ expiresAt: 1 });

// Virtual for invitation URL
invitationSchema.virtual('invitationUrl').get(function() {
  if (this.invitationToken) {
    return `/invitation/${this.invitationToken}`;
  }
  return null;
});

// Method to check if invitation is expired
invitationSchema.methods.isExpired = function() {
  return this.expiresAt < new Date();
};

// Method to accept invitation
invitationSchema.methods.acceptInvitation = function(responseMessage) {
  this.status = 'accepted';
  this.acceptedAt = new Date();
  if (responseMessage) {
    this.responseMessage = responseMessage;
  }
  return this.save();
};

// Method to decline invitation
invitationSchema.methods.declineInvitation = function(responseMessage) {
  this.status = 'declined';
  this.declinedAt = new Date();
  if (responseMessage) {
    this.responseMessage = responseMessage;
  }
  return this.save();
};

// Static method to generate invitation token
invitationSchema.statics.generateInvitationToken = function() {
  return require('crypto').randomBytes(32).toString('hex');
};

// Static method to find pending invitations for a phone number
invitationSchema.statics.findPendingByPhone = function(phone) {
  return this.find({
    invitedPhone: phone,
    status: { $in: ['pending', 'sent'] },
    expiresAt: { $gt: new Date() }
  }).populate('society', 'name address city state');
};

export default mongoose.model('Invitation', invitationSchema);
