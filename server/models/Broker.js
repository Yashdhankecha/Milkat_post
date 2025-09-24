import mongoose from 'mongoose';

const brokerSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  licenseNumber: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  yearsExperience: {
    type: Number,
    min: 0,
    max: 50
  },
  specialization: [{
    type: String,
    enum: [
      'residential_sales', 'residential_rentals', 'commercial_sales', 
      'commercial_rentals', 'land_sales', 'industrial_properties',
      'luxury_properties', 'investment_properties', 'nri_services',
      'property_management', 'valuation_services', 'legal_services'
    ]
  }],
  commissionRate: {
    type: Number,
    min: 0,
    max: 100,
    default: 2.5
  },
  officeAddress: {
    address: String,
    city: String,
    state: String,
    pincode: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  contactInfo: {
    phone: String,
    email: String,
    website: String,
    alternatePhone: String
  },
  workingHours: {
    monday: { start: String, end: String, isWorking: { type: Boolean, default: true } },
    tuesday: { start: String, end: String, isWorking: { type: Boolean, default: true } },
    wednesday: { start: String, end: String, isWorking: { type: Boolean, default: true } },
    thursday: { start: String, end: String, isWorking: { type: Boolean, default: true } },
    friday: { start: String, end: String, isWorking: { type: Boolean, default: true } },
    saturday: { start: String, end: String, isWorking: { type: Boolean, default: true } },
    sunday: { start: String, end: String, isWorking: { type: Boolean, default: false } }
  },
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
  achievements: [{
    title: String,
    description: String,
    year: Number,
    organization: String
  }],
  portfolio: {
    totalPropertiesSold: { type: Number, default: 0 },
    totalPropertiesRented: { type: Number, default: 0 },
    totalTransactionValue: { type: Number, default: 0 },
    averageDealTime: { type: Number, default: 0 }, // in days
    clientSatisfactionRating: { type: Number, min: 0, max: 5, default: 0 }
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
      enum: ['license_certificate', 'pan_card', 'aadhar_card', 'address_proof', 'bank_details', 'other']
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

// Indexes
brokerSchema.index({ user: 1 });
brokerSchema.index({ licenseNumber: 1 });
brokerSchema.index({ status: 1 });
brokerSchema.index({ verificationStatus: 1 });
brokerSchema.index({ specialization: 1 });
brokerSchema.index({ 'serviceAreas.city': 1 });
brokerSchema.index({ 'serviceAreas.state': 1 });

// Virtual for broker URL
brokerSchema.virtual('brokerUrl').get(function() {
  return `/api/brokers/${this._id}`;
});

// Method to update last active
brokerSchema.methods.updateLastActive = function() {
  this.lastActive = new Date();
  return this.save();
};

// Method to add verification document
brokerSchema.methods.addVerificationDocument = function(type, url) {
  this.verificationDocuments.push({
    type,
    url,
    status: 'pending'
  });
  return this.save();
};

// Method to update verification document status
brokerSchema.methods.updateVerificationDocument = function(documentId, status) {
  const document = this.verificationDocuments.id(documentId);
  if (document) {
    document.status = status;
    return this.save();
  }
  throw new Error('Document not found');
};

// Method to update portfolio
brokerSchema.methods.updatePortfolio = function(updateData) {
  Object.assign(this.portfolio, updateData);
  return this.save();
};

// Method to add achievement
brokerSchema.methods.addAchievement = function(achievementData) {
  this.achievements.push(achievementData);
  return this.save();
};

// Method to add certification
brokerSchema.methods.addCertification = function(certificationData) {
  this.certifications.push(certificationData);
  return this.save();
};

// Pre-save middleware to update lastActive
brokerSchema.pre('save', function(next) {
  if (this.isModified() && !this.isNew) {
    this.lastActive = new Date();
  }
  next();
});

// Static method to search brokers
brokerSchema.statics.searchBrokers = function(filters, page = 1, limit = 10) {
  const query = {};
  
  if (filters.city) query['serviceAreas.city'] = new RegExp(filters.city, 'i');
  if (filters.state) query['serviceAreas.state'] = new RegExp(filters.state, 'i');
  if (filters.specialization && filters.specialization.length > 0) {
    query.specialization = { $in: filters.specialization };
  }
  if (filters.minExperience) query.yearsExperience = { $gte: filters.minExperience };
  if (filters.maxExperience) query.yearsExperience = { ...query.yearsExperience, $lte: filters.maxExperience };
  if (filters.status) query.status = filters.status;
  else query.status = 'active';
  
  const skip = (page - 1) * limit;
  
  return this.find(query)
    .populate('user', 'phone profile')
    .sort({ 'portfolio.clientSatisfactionRating': -1, createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

export default mongoose.model('Broker', brokerSchema);
