import mongoose from 'mongoose';

const societySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  societyCode: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
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
  pincode: {
    type: String,
    trim: true
  },
  coordinates: {
    latitude: Number,
    longitude: Number
  },
  societyType: {
    type: String,
    enum: ['residential', 'commercial', 'mixed_use', 'cooperative_housing'],
    default: 'residential'
  },
  totalArea: {
    type: Number,
    min: 0
  },
  totalFlats: {
    type: Number,
    required: true,
    min: 1
  },
  numberOfBlocks: {
    type: Number,
    min: 1
  },
  yearBuilt: {
    type: Number,
    min: 1900,
    max: new Date().getFullYear()
  },
  registrationDate: {
    type: Date
  },
  fsi: {
    type: Number,
    min: 0
  },
  roadFacing: {
    type: String,
    enum: ['north', 'south', 'east', 'west', 'north_east', 'north_west', 'south_east', 'south_west']
  },
  conditionStatus: {
    type: String,
    enum: ['excellent', 'good', 'average', 'poor', 'needs_renovation'],
    default: 'good'
  },
  amenities: [{
    type: String,
    enum: [
      'parking', 'security', 'gym', 'swimming_pool', 'garden', 'playground',
      'clubhouse', 'power_backup', 'water_supply', 'elevator', 'balcony',
      'terrace', 'modular_kitchen', 'wardrobe', 'ac', 'furnished', 'semi_furnished',
      'conference_room', 'business_center', 'retail_shops', 'restaurant', 'spa',
      'tennis_court', 'basketball_court', 'badminton_court', 'cricket_net',
      'jogging_track', 'cycling_track', 'amphitheater', 'library', 'kids_play_area',
      'senior_citizen_area', 'pet_area', 'visitor_parking', 'cctv', 'intercom'
    ]
  }],
  contactPersonName: {
    type: String,
    trim: true
  },
  contactPhone: {
    type: String,
    trim: true
  },
  contactEmail: {
    type: String,
    trim: true,
    lowercase: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  flatVariants: [{
    type: {
      type: String,
      enum: ['1bhk', '2bhk', '3bhk', '4bhk', '5bhk', 'penthouse', 'villa', 'duplex', 'studio'],
      required: true
    },
    count: {
      type: Number,
      required: true,
      min: 0
    },
    area: {
      type: Number,
      required: true,
      min: 0
    },
    price: {
      type: Number,
      min: 0
    }
  }],
  flatPlanDocuments: [{
    type: {
      type: String,
      enum: ['floor_plan', 'layout_plan', 'site_plan', 'elevation', 'other']
    },
    url: String,
    name: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  registrationDocuments: [{
    type: {
      type: String,
      enum: ['registration_certificate', 'byelaws', 'noc', 'approval_documents', 'other']
    },
    url: String,
    name: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
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
  status: {
    type: String,
    enum: ['active', 'inactive', 'under_renovation', 'redevelopment_planned'],
    default: 'active'
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationStatus: {
    type: String,
    enum: ['unverified', 'pending', 'verified', 'rejected'],
    default: 'unverified'
  },
  verificationDocuments: [{
    type: {
      type: String,
      enum: ['registration_certificate', 'byelaws', 'noc', 'approval_documents', 'other']
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
  redevelopmentStatus: {
    isPlanned: {
      type: Boolean,
      default: false
    },
    plannedDate: Date,
    currentPhase: {
      type: String,
      enum: ['planning', 'approval', 'demolition', 'construction', 'possession', 'completed']
    },
    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Indexes - societyCode already has unique index from schema definition
societySchema.index({ owner: 1 });
societySchema.index({ 'location.city': 1 });
societySchema.index({ 'location.state': 1 });
societySchema.index({ status: 1 });
societySchema.index({ isVerified: 1 });
societySchema.index({ societyType: 1 });

// Compound indexes for search
societySchema.index({ 
  'location.city': 1, 
  societyType: 1, 
  status: 1 
});

// Virtual for society URL
societySchema.virtual('societyUrl').get(function() {
  return `/api/societies/${this._id}`;
});

// Virtual for primary image
societySchema.virtual('primaryImage').get(function() {
  const primary = this.images.find(img => img.isPrimary);
  return primary ? primary.url : (this.images.length > 0 ? this.images[0].url : null);
});

// Method to add image
societySchema.methods.addImage = function(url, caption = '', isPrimary = false) {
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
societySchema.methods.setPrimaryImage = function(imageId) {
  this.images.forEach(img => {
    img.isPrimary = img._id.toString() === imageId.toString();
  });
  return this.save();
};

// Method to remove image
societySchema.methods.removeImage = function(imageId) {
  this.images = this.images.filter(img => img._id.toString() !== imageId.toString());
  return this.save();
};

// Method to add flat variant
societySchema.methods.addFlatVariant = function(variantData) {
  this.flatVariants.push(variantData);
  return this.save();
};

// Method to update flat variant
societySchema.methods.updateFlatVariant = function(variantId, updateData) {
  const variant = this.flatVariants.id(variantId);
  if (variant) {
    Object.assign(variant, updateData);
    return this.save();
  }
  throw new Error('Flat variant not found');
};

// Method to remove flat variant
societySchema.methods.removeFlatVariant = function(variantId) {
  this.flatVariants = this.flatVariants.filter(fv => fv._id.toString() !== variantId.toString());
  return this.save();
};

// Method to add verification document
societySchema.methods.addVerificationDocument = function(type, url) {
  this.verificationDocuments.push({
    type,
    url,
    status: 'pending'
  });
  return this.save();
};

// Method to update verification document status
societySchema.methods.updateVerificationDocument = function(documentId, status) {
  const document = this.verificationDocuments.id(documentId);
  if (document) {
    document.status = status;
    return this.save();
  }
  throw new Error('Document not found');
};

// Pre-save middleware to generate society code if not provided
societySchema.pre('save', function(next) {
  if (this.isNew && !this.societyCode) {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 3);
    this.societyCode = `SOC-${timestamp}-${random}`.toUpperCase();
  }
  next();
});

// Static method to search societies
societySchema.statics.searchSocieties = function(filters, page = 1, limit = 10) {
  const query = {};
  
  if (filters.city) query['location.city'] = new RegExp(filters.city, 'i');
  if (filters.state) query['location.state'] = new RegExp(filters.state, 'i');
  if (filters.societyType) query.societyType = filters.societyType;
  if (filters.status) query.status = filters.status;
  else query.status = 'active';
  
  const skip = (page - 1) * limit;
  
  return this.find(query)
    .populate('owner', 'phone profile')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

export default mongoose.model('Society', societySchema);
