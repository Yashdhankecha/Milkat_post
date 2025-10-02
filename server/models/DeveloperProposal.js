import mongoose from 'mongoose';

const developerProposalSchema = new mongoose.Schema({
  // Basic Information
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  redevelopmentProject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RedevelopmentProject',
    required: true
  },
  developer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Proposal Details
  corpusAmount: {
    type: Number,
    required: true,
    min: 0
  },
  rentAmount: {
    type: Number,
    required: true,
    min: 0
  },
  fsi: {
    type: Number,
    required: true,
    min: 0
  },
  proposedAmenities: [{
    name: String,
    description: String,
    category: {
      type: String,
      enum: ['security', 'recreation', 'utility', 'commercial', 'parking', 'other']
    }
  }],

  // Timeline
  timeline: {
    type: String,
    required: true,
    trim: true
  },
  proposedTimeline: {
    startDate: Date,
    completionDate: Date,
    phases: [{
      name: String,
      description: String,
      duration: Number, // in months
      milestones: [String]
    }]
  },

  // Documents
  documents: [{
    name: String,
    type: {
      type: String,
      enum: ['proposal', 'design', 'financial', 'legal', 'certificate', 'portfolio', 'other']
    },
    url: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Financial Breakdown
  financialBreakdown: {
    constructionCost: Number,
    amenitiesCost: Number,
    legalCost: Number,
    contingencyCost: Number,
    totalCost: Number,
    paymentSchedule: [{
      phase: String,
      percentage: Number,
      amount: Number,
      dueDate: Date
    }]
  },

  // Developer Credentials
  developerInfo: {
    companyName: String,
    experience: Number, // years
    completedProjects: Number,
    certifications: [String],
    contactPerson: String,
    contactPhone: String,
    contactEmail: String,
    website: String
  },

  // Status
  status: {
    type: String,
    enum: ['draft', 'submitted', 'under_review', 'shortlisted', 'selected', 'rejected', 'withdrawn'],
    default: 'submitted'
  },

  // Evaluation
  evaluation: {
    technicalScore: {
      type: Number,
      min: 0,
      max: 100
    },
    financialScore: {
      type: Number,
      min: 0,
      max: 100
    },
    timelineScore: {
      type: Number,
      min: 0,
      max: 100
    },
    overallScore: {
      type: Number,
      min: 0,
      max: 100
    },
    evaluatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    evaluatedAt: Date,
    comments: String
  },

  // Voting results are fetched dynamically from MemberVote collection

  // Response to Society
  responses: [{
    question: String,
    answer: String,
    respondedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Indexes
developerProposalSchema.index({ redevelopmentProject: 1 });
developerProposalSchema.index({ developer: 1 });
developerProposalSchema.index({ status: 1 });
developerProposalSchema.index({ 'evaluation.overallScore': -1 });

// Unique compound index to prevent duplicate proposals from same developer for same project
developerProposalSchema.index({ redevelopmentProject: 1, developer: 1 }, { unique: true });

// Virtual for proposal URL
developerProposalSchema.virtual('proposalUrl').get(function() {
  return `/api/developer-proposals/${this._id}`;
});

// Method to calculate overall score
developerProposalSchema.methods.calculateOverallScore = function() {
  const { technicalScore, financialScore, timelineScore } = this.evaluation;
  if (technicalScore && financialScore && timelineScore) {
    this.evaluation.overallScore = Math.round((technicalScore + financialScore + timelineScore) / 3);
  }
  return this.save();
};

// Voting results are fetched dynamically from MemberVote collection

// Method to add response
developerProposalSchema.methods.addResponse = function(question, answer) {
  this.responses.push({
    question,
    answer
  });
  return this.save();
};

export default mongoose.model('DeveloperProposal', developerProposalSchema);
