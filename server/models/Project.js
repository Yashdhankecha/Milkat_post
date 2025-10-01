import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    trim: true,
    maxlength: 2000
  },
  developer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  projectType: {
    type: String,
    enum: ['residential', 'commercial', 'mixed_use', 'industrial', 'hospitality', 'retail'],
    default: 'residential'
  },
  location: {
    address: {
      type: String,
      required: true,
      trim: true
    },
    city: {
      type: String,
      required: true,
      trim: true
    },
    state: {
      type: String,
      required: true,
      trim: true
    },
    country: {
      type: String,
      default: 'India',
      trim: true
    },
    coordinates: {
      latitude: Number,
      longitude: Number
    },
    landmarks: [String]
  },
  priceRange: {
    min: {
      type: Number,
      required: true,
      min: 0
    },
    max: {
      type: Number,
      required: true,
      min: 0
    },
    unit: {
      type: String,
      enum: ['lakh', 'crore', 'sqft', 'sqm'],
      default: 'lakh'
    }
  },
  totalUnits: {
    type: Number,
    min: 1
  },
  availableUnits: {
    type: Number,
    min: 0
  },
  completionDate: {
    type: Date
  },
  possessionDate: {
    type: Date
  },
  launchDate: {
    type: Date
  },
  amenities: [{
    type: String,
    enum: [
      'parking', 'security', 'gym', 'swimming_pool', 'garden', 'playground',
      'clubhouse', 'power_backup', 'water_supply', 'elevator', 'balcony',
      'terrace', 'modular_kitchen', 'wardrobe', 'ac', 'furnished', 'semi_furnished',
      'conference_room', 'business_center', 'retail_shops', 'restaurant', 'spa',
      'tennis_court', 'basketball_court', 'badminton_court', 'cricket_net',
      'jogging_track', 'cycling_track', 'amphitheater', 'library', 'kids_play_area'
    ]
  }],
  images: [{
    url: {
      type: String,
      required: true
    },
    caption: String,
    isPrimary: {
      type: Boolean,
      default: false
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  videos: [{
    url: {
      type: String,
      required: true
    },
    caption: String,
    thumbnail: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  floorPlans: [{
    type: {
      type: String,
      enum: ['1bhk', '2bhk', '3bhk', '4bhk', '5bhk', 'penthouse', 'villa', 'duplex', 'studio'],
      required: true
    },
    area: {
      type: Number,
      required: true,
      min: 0
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    image: String,
    description: String,
    available: {
      type: Number,
      default: 0
    }
  }],
  brochures: [{
    url: {
      type: String,
      required: true
    },
    name: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  documents: [{
    type: {
      type: String,
      enum: ['floor_plan', 'legal_documents', 'approval_documents', 'other']
    },
    url: String,
    name: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  status: {
    type: String,
    enum: ['planning', 'under_construction', 'ready_to_move', 'completed', 'sold_out', 'cancelled'],
    default: 'planning'
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  featuredUntil: {
    type: Date
  },
  views: {
    type: Number,
    default: 0
  },
  inquiries: {
    type: Number,
    default: 0
  },
  tags: [String],
  projectId: {
    type: String,
    unique: true,
    sparse: true
  },
  reraNumber: {
    type: String,
    trim: true
  },
  approvals: [{
    type: {
      type: String,
      enum: ['environmental', 'fire_safety', 'structural', 'electrical', 'plumbing', 'other']
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    document: String,
    approvedDate: Date
  }]
}, {
  timestamps: true
});

// Indexes
projectSchema.index({ developer: 1 });
projectSchema.index({ status: 1 });
projectSchema.index({ 'location.city': 1 });
projectSchema.index({ 'location.state': 1 });
projectSchema.index({ projectType: 1 });
projectSchema.index({ isFeatured: 1 });
projectSchema.index({ createdAt: -1 });
projectSchema.index({ completionDate: 1 });

// Compound indexes for search
projectSchema.index({ 
  'location.city': 1, 
  projectType: 1, 
  status: 1 
});

projectSchema.index({ 
  'priceRange.min': 1, 
  'priceRange.max': 1, 
  status: 1 
});

// Virtual for project URL
projectSchema.virtual('projectUrl').get(function() {
  return `/api/projects/${this._id}`;
});

// Virtual for primary image
projectSchema.virtual('primaryImage').get(function() {
  const primary = this.images.find(img => img.isPrimary);
  return primary ? primary.url : (this.images.length > 0 ? this.images[0].url : null);
});

// Method to increment views
projectSchema.methods.incrementViews = function() {
  this.views += 1;
  return this.save();
};

// Method to increment inquiries
projectSchema.methods.incrementInquiries = function() {
  this.inquiries += 1;
  return this.save();
};

// Method to add image
projectSchema.methods.addImage = function(url, caption = '', isPrimary = false) {
  if (isPrimary) {
    // Remove primary flag from other images
    this.images.forEach(img => img.isPrimary = false);
  }
  
  this.images.push({
    url,
    caption,
    isPrimary
  });
  
  return this.save();
};

// Method to set primary image
projectSchema.methods.setPrimaryImage = function(imageId) {
  this.images.forEach(img => {
    img.isPrimary = img._id.toString() === imageId.toString();
  });
  return this.save();
};

// Method to remove image
projectSchema.methods.removeImage = function(imageId) {
  this.images = this.images.filter(img => img._id.toString() !== imageId.toString());
  return this.save();
};

// Method to add floor plan
projectSchema.methods.addFloorPlan = function(floorPlanData) {
  this.floorPlans.push(floorPlanData);
  return this.save();
};

// Method to update floor plan
projectSchema.methods.updateFloorPlan = function(floorPlanId, updateData) {
  const floorPlan = this.floorPlans.id(floorPlanId);
  if (floorPlan) {
    Object.assign(floorPlan, updateData);
    return this.save();
  }
  throw new Error('Floor plan not found');
};

// Method to remove floor plan
projectSchema.methods.removeFloorPlan = function(floorPlanId) {
  this.floorPlans = this.floorPlans.filter(fp => fp._id.toString() !== floorPlanId.toString());
  return this.save();
};

// Pre-save middleware to generate project ID
projectSchema.pre('save', function(next) {
  if (this.isNew && !this.projectId) {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    this.projectId = `PROJ-${timestamp}-${random}`.toUpperCase();
  }
  next();
});

// Static method to search projects
projectSchema.statics.searchProjects = function(filters, page = 1, limit = 10) {
  const query = {};
  
  if (filters.city) query['location.city'] = new RegExp(filters.city, 'i');
  if (filters.state) query['location.state'] = new RegExp(filters.state, 'i');
  if (filters.projectType) query.projectType = filters.projectType;
  if (filters.minPrice) query['priceRange.min'] = { $gte: filters.minPrice };
  if (filters.maxPrice) query['priceRange.max'] = { $lte: filters.maxPrice };
  if (filters.status) query.status = filters.status;
  else query.status = { $in: ['planning', 'under_construction', 'ready_to_move'] };
  
  const skip = (page - 1) * limit;
  
  return this.find(query)
    .populate('developer', 'phone profile')
    .sort({ isFeatured: -1, createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

export default mongoose.model('Project', projectSchema);
