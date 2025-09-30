import mongoose from 'mongoose';

const memberVoteSchema = new mongoose.Schema({
  // Voting Information
  redevelopmentProject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RedevelopmentProject',
    required: true
  },
  member: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  proposal: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DeveloperProposal',
    required: false // Optional for general project approval votes
  },

  // Vote Details
  vote: {
    type: String,
    enum: ['yes', 'no', 'abstain'],
    required: true
  },
  reason: {
    type: String,
    trim: true,
    maxlength: 500
  },

  // Voting Session
  votingSession: {
    type: String,
    required: true // e.g., 'initial_approval', 'developer_selection', 'milestone_approval'
  },

  // Verification
  isVerified: {
    type: Boolean,
    default: false
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  verifiedAt: Date,

  // Metadata
  ipAddress: String,
  userAgent: String,
  votedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
memberVoteSchema.index({ redevelopmentProject: 1, member: 1, votingSession: 1 }, { unique: true });
memberVoteSchema.index({ redevelopmentProject: 1, votingSession: 1 });
memberVoteSchema.index({ member: 1 });
memberVoteSchema.index({ votedAt: -1 });

// Virtual for vote URL
memberVoteSchema.virtual('voteUrl').get(function() {
  return `/api/member-votes/${this._id}`;
});

// Static method to get voting statistics
memberVoteSchema.statics.getVotingStats = function(projectId, session = null) {
  const matchQuery = { redevelopmentProject: projectId };
  if (session) {
    matchQuery.votingSession = session;
  }

  return this.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: '$vote',
        count: { $sum: 1 }
      }
    }
  ]);
};

// Static method to get member voting history
memberVoteSchema.statics.getMemberVotingHistory = function(memberId) {
  return this.find({ member: memberId })
    .populate('redevelopmentProject', 'title status')
    .populate('proposal', 'title developer')
    .sort({ votedAt: -1 });
};

export default mongoose.model('MemberVote', memberVoteSchema);
