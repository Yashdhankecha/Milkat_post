import mongoose from 'mongoose';

const inquirySchema = new mongoose.Schema({
  // Basic inquiry information
  inquiryType: {
    type: String,
    enum: ['property_inquiry', 'project_inquiry', 'general_inquiry', 'broker_services', 'developer_services'],
    required: true
  },
  subject: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  
  // Contact information
  contactPreference: {
    type: String,
    enum: ['phone', 'email', 'whatsapp'],
    default: 'phone'
  },
  
  // Property/Project reference (for property and project inquiries)
  property: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: function() {
      return this.inquiryType === 'property_inquiry';
    }
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: function() {
      return this.inquiryType === 'project_inquiry';
    }
  },
  
  // User information
  inquirer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Allow null for public contact forms
  },
  
  // Property/Project owner (for notifications)
  propertyOwner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: function() {
      return this.inquiryType === 'property_inquiry';
    }
  },
  projectOwner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: function() {
      return this.inquiryType === 'project_inquiry';
    }
  },
  developer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: function() {
      return this.inquiryType === 'project_inquiry';
    }
  },
  
  // Status and response
  status: {
    type: String,
    enum: ['pending', 'responded', 'closed', 'spam'],
    default: 'pending'
  },
  
  response: {
    message: {
      type: String,
      trim: true,
      maxlength: 2000
    },
    respondedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    respondedAt: {
      type: Date
    }
  },
  
  // Additional metadata
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  
  tags: [{
    type: String,
    trim: true
  }],
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for better query performance
inquirySchema.index({ inquirer: 1, createdAt: -1 });
inquirySchema.index({ propertyOwner: 1, status: 1, createdAt: -1 });
inquirySchema.index({ projectOwner: 1, status: 1, createdAt: -1 });
inquirySchema.index({ property: 1, status: 1 });
inquirySchema.index({ project: 1, status: 1 });
inquirySchema.index({ inquiryType: 1, status: 1 });

// Pre-save middleware to update timestamps
inquirySchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Static method to get inquiries for a property owner
inquirySchema.statics.getPropertyOwnerInquiries = function(ownerId, page = 1, limit = 10) {
  const skip = (page - 1) * limit;
  return this.find({ propertyOwner: ownerId })
    .populate('inquirer', 'phone email')
    .populate('property', 'title location price images')
    .populate('response.respondedBy', 'phone email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

// Static method to get inquiries for a project owner
inquirySchema.statics.getProjectOwnerInquiries = function(ownerId, page = 1, limit = 10) {
  const skip = (page - 1) * limit;
  return this.find({ projectOwner: ownerId })
    .populate('inquirer', 'phone email')
    .populate('project', 'name location priceRange images')
    .populate('response.respondedBy', 'phone email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

// Static method to get inquiries for a developer
inquirySchema.statics.getDeveloperInquiries = function(developerId, page = 1, limit = 10) {
  const skip = (page - 1) * limit;
  return this.find({ developer: developerId })
    .populate('inquirer', 'phone email')
    .populate('project', 'name location priceRange images')
    .populate('response.respondedBy', 'phone email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

// Static method to get user's inquiries
inquirySchema.statics.getUserInquiries = function(userId, page = 1, limit = 10) {
  const skip = (page - 1) * limit;
  return this.find({ inquirer: userId })
    .populate('property', 'title location price images')
    .populate('project', 'title location price images')
    .populate('propertyOwner', 'phone email')
    .populate('projectOwner', 'phone email')
    .populate('response.respondedBy', 'phone email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

// Static method to get inquiries for a specific property
inquirySchema.statics.getPropertyInquiries = function(propertyId, page = 1, limit = 10) {
  const skip = (page - 1) * limit;
  return this.find({ property: propertyId })
    .populate('inquirer', 'phone email')
    .populate('response.respondedBy', 'phone email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

// Method to respond to an inquiry
inquirySchema.methods.respond = function(responseMessage, respondedBy) {
  this.response = {
    message: responseMessage,
    respondedBy: respondedBy,
    respondedAt: new Date()
  };
  this.status = 'responded';
  return this.save();
};

// Method to mark as closed
inquirySchema.methods.close = function() {
  this.status = 'closed';
  return this.save();
};

// Method to mark as spam
inquirySchema.methods.markAsSpam = function() {
  this.status = 'spam';
  return this.save();
};

export default mongoose.model('Inquiry', inquirySchema);
