import mongoose from 'mongoose';

const societyMemberSchema = new mongoose.Schema({
  society: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Society',
    required: true,
    index: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  role: {
    type: String,
    enum: ['society_member', 'committee_member', 'treasurer', 'secretary'],
    default: 'society_member'
  },
  status: {
    type: String,
    enum: ['active', 'pending', 'removed', 'suspended'],
    default: 'pending'
  },
  flatNumber: {
    type: String,
    trim: true
  },
  blockNumber: {
    type: String,
    trim: true
  },
  ownershipType: {
    type: String,
    enum: ['owner', 'tenant', 'family_member'],
    default: 'owner'
  },
  joinedAt: {
    type: Date,
    default: Date.now
  },
  removedAt: {
    type: Date
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 500
  },
  metadata: {
    invitationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Invitation'
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }
}, {
  timestamps: true
});

// Compound indexes
societyMemberSchema.index({ society: 1, user: 1 }, { unique: true });
societyMemberSchema.index({ society: 1, status: 1 });
societyMemberSchema.index({ user: 1, status: 1 });

// Virtual for member full info
societyMemberSchema.virtual('memberInfo', {
  ref: 'Profile',
  localField: 'user',
  foreignField: 'user',
  justOne: true
});

// Static method to add member
societyMemberSchema.statics.addMember = async function(societyId, userId, data = {}) {
  // Check if member already exists
  const existing = await this.findOne({ society: societyId, user: userId });
  
  if (existing) {
    if (existing.status === 'removed') {
      // Reactivate removed member
      existing.status = 'active';
      existing.removedAt = null;
      existing.joinedAt = new Date();
      return existing.save();
    }
    throw new Error('Member already exists in this society');
  }

  // Create new member
  return this.create({
    society: societyId,
    user: userId,
    ...data,
    status: 'active'
  });
};

// Static method to remove member
societyMemberSchema.statics.removeMember = async function(societyId, userId) {
  const member = await this.findOne({ society: societyId, user: userId });
  
  if (!member) {
    throw new Error('Member not found');
  }

  member.status = 'removed';
  member.removedAt = new Date();
  return member.save();
};

// Static method to get society members
societyMemberSchema.statics.getSocietyMembers = function(societyId, status = 'active') {
  return this.find({ society: societyId, status })
    .populate('user', 'phone fullName isActive')
    .populate('metadata.addedBy', 'phone fullName')
    .sort({ joinedAt: -1 });
};

// Static method to get user societies
societyMemberSchema.statics.getUserSocieties = function(userId, status = 'active') {
  return this.find({ user: userId, status })
    .populate('society')
    .sort({ joinedAt: -1 });
};

export default mongoose.model('SocietyMember', societyMemberSchema);

