import mongoose from 'mongoose';

const profileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  fullName: {
    type: String,
    trim: true
  },
  bio: {
    type: String,
    maxlength: 500
  },
  profilePicture: {
    type: String, // URL to image
    default: null
  },
  role: {
    type: String,
    enum: ['admin', 'buyer_seller', 'broker', 'developer', 'society_owner', 'society_member'],
    required: true
  },
  businessType: {
    type: String,
    trim: true
  },
  companyName: {
    type: String,
    trim: true
  },
  website: {
    type: String,
    trim: true
  },
  socialMedia: {
    facebook: String,
    twitter: String,
    linkedin: String,
    instagram: String,
    youtube: String
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'pending_verification'],
    default: 'pending_verification'
  },
  verificationStatus: {
    type: String,
    enum: ['unverified', 'pending', 'verified', 'rejected'],
    default: 'unverified'
  },
  verificationDocuments: [{
    type: {
      type: String,
      enum: ['pan_card', 'aadhar_card', 'driving_license', 'passport', 'business_license', 'other']
    },
    url: String,
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  preferences: {
    notifications: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: true },
      push: { type: Boolean, default: true }
    },
    privacy: {
      showPhone: { type: Boolean, default: false },
      showEmail: { type: Boolean, default: false },
      showProfile: { type: Boolean, default: true }
    }
  },
  lastActive: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
profileSchema.index({ user: 1 });
profileSchema.index({ role: 1 });
profileSchema.index({ status: 1 });
profileSchema.index({ verificationStatus: 1 });

// Virtual for full profile URL
profileSchema.virtual('profileUrl').get(function() {
  return `/api/users/${this.user}/profile`;
});

// Method to update last active
profileSchema.methods.updateLastActive = function() {
  this.lastActive = new Date();
  return this.save();
};

// Method to add verification document
profileSchema.methods.addVerificationDocument = function(type, url) {
  this.verificationDocuments.push({
    type,
    url,
    status: 'pending'
  });
  return this.save();
};

// Method to update verification document status
profileSchema.methods.updateVerificationDocument = function(documentId, status) {
  const document = this.verificationDocuments.id(documentId);
  if (document) {
    document.status = status;
    return this.save();
  }
  throw new Error('Document not found');
};

// Pre-save middleware to update lastActive
profileSchema.pre('save', function(next) {
  if (this.isModified() && !this.isNew) {
    this.lastActive = new Date();
  }
  next();
});

export default mongoose.model('Profile', profileSchema);
