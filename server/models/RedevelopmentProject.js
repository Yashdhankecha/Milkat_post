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
    enum: ['planning', 'tender_open', 'proposals_received', 'voting', 'voting_closed', 'developer_selected', 'construction', 'completed', 'cancelled'],
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
  developerSelectedAt: Date,
  developerSelectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
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

// Method to check and auto-close voting if conditions are met
redevelopmentProjectSchema.methods.checkAndAutoCloseVoting = async function() {
  // Only check if voting is currently open
  if (this.votingStatus !== 'open' || this.status !== 'voting') {
    return { closed: false, reason: 'Voting not open' };
  }

  // Check if voting deadline has passed
  if (this.votingDeadline && new Date() > new Date(this.votingDeadline)) {
    console.log(`🕐 Voting deadline passed for project ${this._id}, auto-closing...`);
    return await this.closeVoting('deadline_passed');
  }

  // Check if we have enough votes to make a decision
  const MemberVote = (await import('./MemberVote.js')).default;
  const SocietyMember = (await import('./SocietyMember.js')).default;
  
  // Get total eligible members
  const totalMembers = await SocietyMember.countDocuments({
    society: this.society,
    status: 'active'
  });

  // Get current vote counts
  const votingStats = await MemberVote.getVotingStats(this._id, 'proposal_selection');
  
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
  
  // Check if we have votes from majority of members
  const majorityThreshold = Math.ceil(totalMembers / 2);
  if (totalVotes >= majorityThreshold) {
    console.log(`📊 Majority votes reached for project ${this._id} (${totalVotes}/${totalMembers}), auto-closing...`);
    return await this.closeVoting('majority_reached');
  }

  return { closed: false, reason: 'Conditions not met' };
};

// Method to close voting and finalize results
redevelopmentProjectSchema.methods.closeVoting = async function(reason = 'manual') {
  console.log(`🔒 Closing voting for project ${this._id}, reason: ${reason}`);
  
  const MemberVote = (await import('./MemberVote.js')).default;
  const DeveloperProposal = (await import('./DeveloperProposal.js')).default;
  
  // Get final voting results
  const votingStats = await MemberVote.getVotingStats(this._id, 'proposal_selection');
  
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

  // Get proposals with vote counts
  const proposals = await DeveloperProposal.find({ redevelopmentProject: this._id })
    .populate('developer', 'phone email')
    .populate('developerInfo');

  const proposalResults = await Promise.all(proposals.map(async (proposal) => {
    const proposalVotes = await MemberVote.getVotingStats(this._id, 'proposal_selection', proposal._id);
    
    const proposalStats = {
      yesVotes: 0,
      noVotes: 0,
      abstainVotes: 0
    };

    proposalVotes.forEach(stat => {
      if (stat._id === true) proposalStats.yesVotes = stat.count;
      if (stat._id === false) proposalStats.noVotes = stat.count;
      if (stat._id === null) proposalStats.abstainVotes = stat.count;
    });

    const proposalTotalVotes = proposalStats.yesVotes + proposalStats.noVotes + proposalStats.abstainVotes;
    const proposalApprovalPercentage = proposalTotalVotes > 0 ? Math.round((proposalStats.yesVotes / proposalTotalVotes) * 100) : 0;

    return {
      proposal: proposal,
      votes: proposalStats,
      totalVotes: proposalTotalVotes,
      approvalPercentage: proposalApprovalPercentage
    };
  }));

  // Find the winning proposal (highest approval percentage)
  const winningProposal = proposalResults.reduce((winner, current) => {
    if (!winner || current.approvalPercentage > winner.approvalPercentage) {
      return current;
    }
    return winner;
  }, null);

  // Update project status
  this.votingStatus = 'closed';
  this.votingClosedAt = new Date();
  
  // Set status to voting_closed for manual developer selection by secretary
  this.status = 'voting_closed';

  await this.save();

  // Notify society owner that voting is closed and manual selection is needed
  try {
    const Notification = (await import('./Notification.js')).default;
    await Notification.create({
      recipient: this.owner,
      type: 'voting_closed_manual_selection',
      title: 'Voting Closed - Manual Developer Selection Required',
      message: `Voting has been closed for "${this.title}". Please review the results and manually select a developer to assign the project.`,
      relatedEntity: {
        entityType: 'redevelopment_project',
        entityId: this._id
      }
    });
  } catch (notificationError) {
    console.warn('⚠️ Failed to notify society owner:', notificationError.message);
  }

  console.log(`✅ Voting closed for project ${this._id}, status: ${this.status}`);
  
  return {
    closed: true,
    reason,
    finalResults: {
      totalVotes,
      yesVotes: stats.yesVotes,
      noVotes: stats.noVotes,
      abstainVotes: stats.abstainVotes,
      approvalPercentage,
      isApproved: approvalPercentage >= this.minimumApprovalPercentage
    },
    proposalResults,
    winningProposal: winningProposal ? {
      proposal: winningProposal.proposal,
      approvalPercentage: winningProposal.approvalPercentage,
      totalVotes: winningProposal.totalVotes
    } : null
  };
};

// Method to manually select a developer (secretary action)
redevelopmentProjectSchema.methods.selectDeveloper = async function(developerId, proposalId, selectedBy) {
  console.log(`👤 Manual developer selection for project ${this._id}:`, { developerId, proposalId, selectedBy });
  
  // Verify project is in voting_closed status
  if (this.status !== 'voting_closed') {
    throw new Error('Developer can only be selected after voting is closed');
  }

  // Verify the proposal belongs to this project
  const DeveloperProposal = (await import('./DeveloperProposal.js')).default;
  const proposal = await DeveloperProposal.findOne({
    _id: proposalId,
    redevelopmentProject: this._id,
    developer: developerId
  });

  if (!proposal) {
    throw new Error('Invalid proposal or developer for this project');
  }

  // Update project with selected developer
  this.selectedDeveloper = developerId;
  this.selectedProposal = proposalId;
  this.status = 'developer_selected';
  this.developerSelectedAt = new Date();
  this.developerSelectedBy = selectedBy;

  await this.save();

  // Notify the selected developer
  try {
    const Notification = (await import('./Notification.js')).default;
    await Notification.create({
      recipient: developerId,
      type: 'developer_proposal_selected',
      title: 'You Have Been Selected!',
      message: `Congratulations! You have been selected by the society secretary for the redevelopment project "${this.title}". The society will contact you soon to proceed with the project.`,
      relatedEntity: {
        entityType: 'redevelopment_project',
        entityId: this._id
      }
    });
  } catch (notificationError) {
    console.warn('⚠️ Failed to notify selected developer:', notificationError.message);
  }

  console.log(`✅ Developer selected for project ${this._id}: ${developerId}`);
  
  return {
    success: true,
    selectedDeveloper: developerId,
    selectedProposal: proposalId,
    project: this
  };
};

// Voting results are now fetched dynamically from MemberVote collection

export default mongoose.model('RedevelopmentProject', redevelopmentProjectSchema);
