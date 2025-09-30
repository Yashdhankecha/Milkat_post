import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  type: {
    type: String,
    enum: [
      'property_inquiry',
      'property_like',
      'property_share',
      'property_view',
      'new_message',
      'system_alert',
      'property_update',
      'price_change',
      'status_change',
      'invitation',
      'invitation_accepted',
      'invitation_declined',
      'member_query_submitted',
      'query_response',
      'query_resolved',
      'society_announcement',
      // Redevelopment notifications
      'redevelopment_project_created',
      'redevelopment_project_updated',
      'redevelopment_status_changed',
      'developer_proposal_submitted',
      'developer_proposal_shortlisted',
      'developer_proposal_selected',
      'voting_opened',
      'voting_reminder',
      'voting_closed',
      'voting_results_published',
      'project_milestone_completed',
      'project_document_uploaded',
      'project_query_raised',
      'project_query_responded',
      'project_update_posted',
      'agreement_signed',
      'construction_started',
      'construction_milestone',
      'project_completed'
    ],
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  data: {
    propertyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property'
    },
    inquiryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Inquiry'
    },
    redevelopmentProjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RedevelopmentProject'
    },
    proposalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DeveloperProposal'
    },
    voteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MemberVote'
    },
    societyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Society'
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed
    }
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  expiresAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
notificationSchema.index({ recipient: 1, isRead: 1 });
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Static method to get user notifications
notificationSchema.statics.getUserNotifications = function(userId, page = 1, limit = 20, unreadOnly = false) {
  const skip = (page - 1) * limit;
  const query = { recipient: userId };
  
  if (unreadOnly) {
    query.isRead = false;
  }
  
  return this.find(query)
    .populate('sender', 'phone profile')
    .populate('data.propertyId', 'title price location images')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

// Static method to mark notifications as read
notificationSchema.statics.markAsRead = function(userId, notificationIds = []) {
  const query = { recipient: userId };
  
  if (notificationIds.length > 0) {
    query._id = { $in: notificationIds };
  }
  
  return this.updateMany(query, { 
    isRead: true, 
    readAt: new Date() 
  });
};

// Static method to get unread count
notificationSchema.statics.getUnreadCount = function(userId) {
  return this.countDocuments({ 
    recipient: userId, 
    isRead: false 
  });
};

// Static method to create notification
notificationSchema.statics.createNotification = function(notificationData) {
  return this.create(notificationData);
};

// Instance method to mark as read
notificationSchema.methods.markAsRead = function() {
  this.isRead = true;
  this.readAt = new Date();
  return this.save();
};

export default mongoose.model('Notification', notificationSchema);
