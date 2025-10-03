import mongoose from 'mongoose';

const redevelopmentProjectSchema = new mongoose.Schema({
  // Basic Information
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  society: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Society',
    required: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Project Details
  expectedAmenities: [{
    type: String,
    trim: true
  }],
  timeline: {
    startDate: Date,
    expectedCompletionDate: Date,
    phases: [{
      name: String,
      description: String,
      startDate: Date,
      endDate: Date,
      status: {
        type: String,
        enum: ['pending', 'in_progress', 'completed', 'delayed'],
        default: 'pending'
      }
    }]
  },

  // Documents
  documents: [{
    name: String,
    type: {
      type: String,
      enum: ['tender_notice', 'agm_minutes', 'agreement', 'approval', 'design', 'legal', 'other']
    },
    url: String,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    isPublic: {
      type: Boolean,
      default: false
    }
  }],

  // Status and Progress
  status: {
    type: String,
    enum: ['planning', 'tender_open', 'proposals_received', 'voting', 'developer_selected', 'construction', 'completed', 'cancelled'],
    default: 'planning'
  },
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },

  // Developer Selection
  selectedDeveloper: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  selectedProposal: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DeveloperProposal'
  },

  // Voting
  votingDeadline: Date,
  votingStatus: {
    type: String,
    enum: ['open', 'closed'],
    default: 'open'
  },
  votingClosedAt: Date,
  minimumApprovalPercentage: {
    type: Number,
    default: 51,
    min: 1,
    max: 100
  },
  

  // Financial Details
  estimatedBudget: Number,
  corpusAmount: Number,
  rentAmount: Number,

  // Notifications and Updates
  updates: [{
    title: String,
    description: String,
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    postedAt: {
      type: Date,
      default: Date.now
    },
    isImportant: {
      type: Boolean,
      default: false
    }
  }],

  // Queries and Complaints
  queries: [{
    title: String,
    description: String,
    raisedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    raisedAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['open', 'in_review', 'resolved', 'closed'],
      default: 'open'
    },
    response: String,
    respondedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    respondedAt: Date
  }],

  // Settings
  isPublic: {
    type: Boolean,
    default: true
  },
  allowMemberQueries: {
    type: Boolean,
    default: true
  },
  requireVotingApproval: {
    type: Boolean,
    default: true
  },
  minimumApprovalPercentage: {
    type: Number,
    default: 75
  }
}, {
  timestamps: true
});

// Indexes
redevelopmentProjectSchema.index({ society: 1 });
redevelopmentProjectSchema.index({ owner: 1 });
redevelopmentProjectSchema.index({ status: 1 });
redevelopmentProjectSchema.index({ 'timeline.startDate': 1 });

// Virtual for project URL
redevelopmentProjectSchema.virtual('projectUrl').get(function() {
  return `/api/redevelopment-projects/${this._id}`;
});

// Method to add update
redevelopmentProjectSchema.methods.addUpdate = function(title, description, postedBy, isImportant = false) {
  this.updates.push({
    title,
    description,
    postedBy,
    isImportant
  });
  return this.save();
};

// Method to add query
redevelopmentProjectSchema.methods.addQuery = function(title, description, raisedBy) {
  this.queries.push({
    title,
    description,
    raisedBy
  });
  return this.save();
};

// Voting results are now fetched dynamically from MemberVote collection


export default mongoose.model('RedevelopmentProject', redevelopmentProjectSchema);
