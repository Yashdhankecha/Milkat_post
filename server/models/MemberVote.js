import mongoose from 'mongoose';

const memberVoteSchema = new mongoose.Schema({
  // Document identifies user + project combination
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

  // Array of votes for different proposals/decisions
  votes: [{
    vote: {
      type: Boolean, // true for 'yes', false for 'no', null for 'abstain'
      required: true
    },
    developerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false // Optional - for developer-specific votes
    },
    proposalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DeveloperProposal',
      required: false // Optional - for proposal-specific votes
    },
    votingSession: {
      type: String,
      required: true // e.g., 'initial_approval', 'developer_selection', 'milestone_approval'
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    verifiedAt: Date,
    ipAddress: String,
    userAgent: String,
    votedAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Document-level metadata
  lastVotedAt: {
    type: Date,
    default: Date.now
  },
  totalVotes: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes
memberVoteSchema.index({ redevelopmentProject: 1, member: 1 }, { unique: true }); // One document per user per project
memberVoteSchema.index({ redevelopmentProject: 1 });
memberVoteSchema.index({ member: 1 });
memberVoteSchema.index({ lastVotedAt: -1 });
memberVoteSchema.index({ 'votes.proposalId': 1 });
memberVoteSchema.index({ 'votes.developerId': 1 });
memberVoteSchema.index({ 'votes.votingSession': 1 });

// Virtual for vote URL
memberVoteSchema.virtual('voteUrl').get(function() {
  return `/api/member-votes/${this._id}`;
});

// Static method to get voting statistics
memberVoteSchema.statics.getVotingStats = function(projectId, session = null, proposalId = null) {
  const matchQuery = { redevelopmentProject: projectId };
  
  const pipeline = [
    { $match: matchQuery },
    { $unwind: '$votes' }
  ];
  
  // Filter by session if provided
  if (session) {
    pipeline.push({ $match: { 'votes.votingSession': session } });
  }
  
  // Filter by proposal if provided
  if (proposalId) {
    pipeline.push({ $match: { 'votes.proposalId': proposalId } });
  }
  
  pipeline.push({
    $group: {
      _id: '$votes.vote',
      count: { $sum: 1 }
    }
  });
  
  return this.aggregate(pipeline);
};

// Static method to get member voting history
memberVoteSchema.statics.getMemberVotingHistory = function(memberId) {
  return this.find({ member: memberId })
    .populate('redevelopmentProject', 'title status')
    .populate('votes.proposalId', 'title developer')
    .populate('votes.developerId', 'name email')
    .sort({ lastVotedAt: -1 });
};

// Instance method to add a vote to the array
memberVoteSchema.methods.addVote = function(voteData) {
  // Check if user already voted for this specific proposal/session combination
  const existingVoteIndex = this.votes.findIndex(vote => {
    // If both votes have proposalId, check if they match
    if (vote.proposalId && voteData.proposalId) {
      return vote.proposalId.toString() === voteData.proposalId.toString() &&
             vote.votingSession === voteData.votingSession;
    }
    // If both votes don't have proposalId (general project votes), check session only
    if (!vote.proposalId && !voteData.proposalId) {
      return vote.votingSession === voteData.votingSession;
    }
    // If one has proposalId and other doesn't, they are different votes
    return false;
  });
  
  if (existingVoteIndex !== -1) {
    // Update existing vote
    this.votes[existingVoteIndex] = {
      ...this.votes[existingVoteIndex].toObject(),
      ...voteData,
      votedAt: new Date()
    };
  } else {
    // Add new vote to array
    this.votes.push({
      ...voteData,
      votedAt: new Date()
    });
  }
  
  // Update metadata
  this.lastVotedAt = new Date();
  this.totalVotes = this.votes.length;
  
  return this.save();
};

// Instance method to get votes by session
memberVoteSchema.methods.getVotesBySession = function(session) {
  return this.votes.filter(vote => vote.votingSession === session);
};

// Instance method to get votes by proposal
memberVoteSchema.methods.getVotesByProposal = function(proposalId) {
  return this.votes.filter(vote => 
    vote.proposalId && vote.proposalId.toString() === proposalId.toString()
  );
};

export default mongoose.model('MemberVote', memberVoteSchema);
