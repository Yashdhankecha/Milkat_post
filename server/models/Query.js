import mongoose from 'mongoose';

const querySchema = new mongoose.Schema({
  society: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Society',
    required: true
  },
  member: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  memberProfile: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Profile',
    required: true
  },
  queryText: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  category: {
    type: String,
    enum: ['maintenance', 'amenities', 'security', 'billing', 'complaint', 'suggestion', 'other'],
    default: 'other'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['open', 'in_progress', 'resolved', 'closed'],
    default: 'open'
  },
  response: {
    text: String,
    respondedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    respondedAt: Date
  },
  attachments: [{
    url: String,
    filename: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  isPublic: {
    type: Boolean,
    default: false
  },
  upvotes: [{
    member: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    votedAt: {
      type: Date,
      default: Date.now
    }
  }],
  tags: [String],
  metadata: {
    source: {
      type: String,
      enum: ['dashboard', 'mobile_app', 'website', 'admin'],
      default: 'dashboard'
    },
    ipAddress: String,
    userAgent: String
  }
}, {
  timestamps: true
});

// Indexes
querySchema.index({ society: 1, status: 1 });
querySchema.index({ member: 1, createdAt: -1 });
querySchema.index({ status: 1, priority: 1 });
querySchema.index({ category: 1 });
querySchema.index({ createdAt: -1 });

// Virtual for response time
querySchema.virtual('responseTime').get(function() {
  if (this.response && this.response.respondedAt) {
    return this.response.respondedAt - this.createdAt;
  }
  return null;
});

// Virtual for upvote count
querySchema.virtual('upvoteCount').get(function() {
  return this.upvotes.length;
});

// Method to add response
querySchema.methods.addResponse = function(responseText, respondedBy) {
  this.response = {
    text: responseText,
    respondedBy: respondedBy,
    respondedAt: new Date()
  };
  this.status = 'resolved';
  return this.save();
};

// Method to update status
querySchema.methods.updateStatus = function(newStatus) {
  this.status = newStatus;
  return this.save();
};

// Method to add upvote
querySchema.methods.addUpvote = function(memberId) {
  const existingUpvote = this.upvotes.find(upvote => 
    upvote.member.toString() === memberId.toString()
  );
  
  if (!existingUpvote) {
    this.upvotes.push({ member: memberId });
    return this.save();
  }
  return Promise.resolve(this);
};

// Method to remove upvote
querySchema.methods.removeUpvote = function(memberId) {
  this.upvotes = this.upvotes.filter(upvote => 
    upvote.member.toString() !== memberId.toString()
  );
  return this.save();
};

// Static method to get queries by society
querySchema.statics.getBySociety = function(societyId, filters = {}) {
  const query = { society: societyId };
  
  if (filters.status) query.status = filters.status;
  if (filters.category) query.category = filters.category;
  if (filters.priority) query.priority = filters.priority;
  if (filters.member) query.member = filters.member;
  
  return this.find(query)
    .populate('member', 'phone name')
    .populate('memberProfile', 'fullName')
    .populate('response.respondedBy', 'phone name')
    .sort({ createdAt: -1 });
};

// Static method to get member queries
querySchema.statics.getByMember = function(memberId, societyId = null) {
  const query = { member: memberId };
  if (societyId) query.society = societyId;
  
  return this.find(query)
    .populate('society', 'name')
    .populate('response.respondedBy', 'phone name')
    .sort({ createdAt: -1 });
};

// Static method to get query statistics
querySchema.statics.getStatistics = function(societyId) {
  return this.aggregate([
    { $match: { society: mongoose.Types.ObjectId(societyId) } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);
};

export default mongoose.model('Query', querySchema);





