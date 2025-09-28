import mongoose from 'mongoose';

const developerSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  companyName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  companyDescription: {
    type: String,
    trim: true,
    maxlength: 2000
  },
  establishedYear: {
    type: Number,
    min: 1900,
    max: new Date().getFullYear()
  },
  website: {
    type: String,
    trim: true
  },
  contactInfo: {
    phone: String,
    email: String,
    alternatePhone: String,
    address: String,
    city: String,
    state: String,
    pincode: String
  },
  socialMedia: {
    facebook: String,
    twitter: String,
    linkedin: String,
    instagram: String,
    youtube: String,
    website: String
  },
  businessType: {
    type: String,
    enum: ['private_limited', 'public_limited', 'partnership', 'sole_proprietorship', 'llp', 'other'],
    default: 'private_limited'
  },
  registrationNumber: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  panNumber: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    uppercase: true
  },
  gstNumber: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    uppercase: true
  },
  reraRegistration: [{
    state: String,
    registrationNumber: String,
    registrationDate: Date,
    expiryDate: Date,
    documentUrl: String
  }],
  specializations: [{
    type: String,
    enum: [
      'residential', 'commercial', 'industrial', 'hospitality', 'retail',
      'luxury_homes', 'affordable_housing', 'green_buildings', 'smart_cities',
      'township_development', 'redevelopment', 'infrastructure'
    ]
  }],
  serviceAreas: [{
    city: String,
    state: String,
    localities: [String]
  }],
  languages: [{
    type: String,
    enum: ['hindi', 'english', 'marathi', 'gujarati', 'punjabi', 'bengali', 'tamil', 'telugu', 'kannada', 'malayalam', 'other']
  }],
  certifications: [{
    name: String,
    issuingAuthority: String,
    issueDate: Date,
    expiryDate: Date,
    certificateUrl: String
  }],
  awards: [{
    title: String,
    description: String,
    year: Number,
    organization: String,
    category: String
  }],
  portfolio: {
    totalProjectsCompleted: { type: Number, default: 0 },
    totalProjectsOngoing: { type: Number, default: 0 },
    totalUnitsDelivered: { type: Number, default: 0 },
    totalAreaDeveloped: { type: Number, default: 0 }, // in sqft
    averageProjectValue: { type: Number, default: 0 },
    customerSatisfactionRating: { type: Number, min: 0, max: 5, default: 0 },
    onTimeDeliveryRate: { type: Number, min: 0, max: 100, default: 0 }
  },
  team: [{
    name: String,
    designation: String,
    experience: Number,
    specialization: String,
    photo: String,
    linkedin: String
  }],
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
      enum: ['company_registration', 'pan_card', 'gst_certificate', 'rera_registration', 'bank_details', 'other']
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
  isVerified: {
    type: Boolean,
    default: false
  },
  verifiedAt: Date,
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  lastActive: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes - user, registrationNumber, and panNumber already have unique indexes from schema definition
developerSchema.index({ companyName: 1 });
developerSchema.index({ status: 1 });
developerSchema.index({ verificationStatus: 1 });
developerSchema.index({ specializations: 1 });
developerSchema.index({ 'serviceAreas.city': 1 });
developerSchema.index({ 'serviceAreas.state': 1 });

// Virtual for developer URL
developerSchema.virtual('developerUrl').get(function() {
  return `/api/developers/${this._id}`;
});

// Method to update last active
developerSchema.methods.updateLastActive = function() {
  this.lastActive = new Date();
  return this.save();
};

// Method to add verification document
developerSchema.methods.addVerificationDocument = function(type, url) {
  this.verificationDocuments.push({
    type,
    url,
    status: 'pending'
  });
  return this.save();
};

// Method to update verification document status
developerSchema.methods.updateVerificationDocument = function(documentId, status) {
  const document = this.verificationDocuments.id(documentId);
  if (document) {
    document.status = status;
    return this.save();
  }
  throw new Error('Document not found');
};

// Method to update portfolio
developerSchema.methods.updatePortfolio = function(updateData) {
  Object.assign(this.portfolio, updateData);
  return this.save();
};

// Method to add award
developerSchema.methods.addAward = function(awardData) {
  this.awards.push(awardData);
  return this.save();
};

// Method to add certification
developerSchema.methods.addCertification = function(certificationData) {
  this.certifications.push(certificationData);
  return this.save();
};

// Method to add team member
developerSchema.methods.addTeamMember = function(memberData) {
  this.team.push(memberData);
  return this.save();
};

// Method to update team member
developerSchema.methods.updateTeamMember = function(memberId, updateData) {
  const member = this.team.id(memberId);
  if (member) {
    Object.assign(member, updateData);
    return this.save();
  }
  throw new Error('Team member not found');
};

// Method to remove team member
developerSchema.methods.removeTeamMember = function(memberId) {
  this.team = this.team.filter(member => member._id.toString() !== memberId.toString());
  return this.save();
};

// Pre-save middleware to update lastActive
developerSchema.pre('save', function(next) {
  if (this.isModified() && !this.isNew) {
    this.lastActive = new Date();
  }
  next();
});

// Static method to search developers
developerSchema.statics.searchDevelopers = function(filters, page = 1, limit = 10) {
  const query = {};
  
  if (filters.city) query['serviceAreas.city'] = new RegExp(filters.city, 'i');
  if (filters.state) query['serviceAreas.state'] = new RegExp(filters.state, 'i');
  if (filters.specialization && filters.specialization.length > 0) {
    query.specializations = { $in: filters.specialization };
  }
  if (filters.minExperience) query.establishedYear = { $lte: new Date().getFullYear() - filters.minExperience };
  if (filters.status) query.status = filters.status;
  else query.status = 'active';
  
  const skip = (page - 1) * limit;
  
  return this.find(query)
    .populate('user', 'phone profile')
    .sort({ 'portfolio.customerSatisfactionRating': -1, createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

export default mongoose.model('Developer', developerSchema);
