import mongoose from 'mongoose';

const propertySchema = new mongoose.Schema({
  title: {
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
  propertyType: {
    type: String,
    required: true,
    enum: ['apartment', 'villa', 'house', 'plot', 'commercial', 'office', 'shop', 'warehouse', 'other']
  },
  listingType: {
    type: String,
    required: true,
    enum: ['sale', 'rent', 'lease']
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  monthlyRent: {
    type: Number,
    min: 0
  },
  securityDeposit: {
    type: Number,
    min: 0
  },
  maintenanceCost: {
    type: Number,
    min: 0
  },
  area: {
    type: Number,
    required: true,
    min: 0
  },
  builtUpArea: {
    type: Number,
    min: 0
  },
  carpetArea: {
    type: Number,
    min: 0
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
    pincode: {
      type: String,
      trim: true
    },
    coordinates: {
      latitude: Number,
      longitude: Number
    },
    landmarks: [String]
  },
  amenities: [{
    type: String,
    enum: [
      'parking', 'security', 'gym', 'swimming_pool', 'garden', 'playground',
      'clubhouse', 'power_backup', 'water_supply', 'elevator', 'balcony',
      'terrace', 'modular_kitchen', 'wardrobe', 'ac', 'furnished', 'semi_furnished'
    ]
  }],
  furnishedStatus: {
    type: String,
    enum: ['furnished', 'semi_furnished', 'unfurnished'],
    default: 'unfurnished'
  },
  floorNumber: {
    type: Number,
    min: 0
  },
  totalFloors: {
    type: Number,
    min: 1
  },
  facing: {
    type: String,
    enum: ['north', 'south', 'east', 'west', 'north_east', 'north_west', 'south_east', 'south_west']
  },
  age: {
    type: Number,
    min: 0
  },
  availableFrom: {
    type: Date
  },
  leaseTerm: {
    type: String,
    enum: ['monthly', 'quarterly', 'yearly', 'flexible']
  },
  minLeasePeriod: {
    type: String,
    trim: true
  },
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
  documents: [{
    type: {
      type: String,
      enum: ['floor_plan', 'brochure', 'legal_documents', 'other']
    },
    url: String,
    name: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  broker: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'sold', 'rented', 'under_negotiation', 'draft'],
    default: 'active'
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
  likes: {
    type: Number,
    default: 0
  },
  inquiries: {
    type: Number,
    default: 0
  },
  tags: [String],
  propertyId: {
    type: String,
    unique: true,
    sparse: true
  }
}, {
  timestamps: true
});

// Indexes
propertySchema.index({ owner: 1 });
propertySchema.index({ broker: 1 });
propertySchema.index({ propertyType: 1 });
propertySchema.index({ listingType: 1 });
propertySchema.index({ status: 1 });
propertySchema.index({ 'location.city': 1 });
propertySchema.index({ 'location.state': 1 });
propertySchema.index({ price: 1 });
propertySchema.index({ area: 1 });
propertySchema.index({ isFeatured: 1 });
propertySchema.index({ createdAt: -1 });

// Compound indexes for search
propertySchema.index({ 
  'location.city': 1, 
  propertyType: 1, 
  listingType: 1, 
  status: 1 
});

propertySchema.index({ 
  price: 1, 
  area: 1, 
  status: 1 
});

// Virtual for property URL
propertySchema.virtual('propertyUrl').get(function() {
  return `/api/properties/${this._id}`;
});

// Virtual for primary image
propertySchema.virtual('primaryImage').get(function() {
  const primary = this.images.find(img => img.isPrimary);
  return primary ? primary.url : (this.images.length > 0 ? this.images[0].url : null);
});

// Method to increment views
propertySchema.methods.incrementViews = function() {
  this.views += 1;
  return this.save();
};

// Method to increment likes
propertySchema.methods.incrementLikes = function() {
  this.likes += 1;
  return this.save();
};

// Method to increment inquiries
propertySchema.methods.incrementInquiries = function() {
  this.inquiries += 1;
  return this.save();
};

// Method to add image
propertySchema.methods.addImage = function(url, caption = '', isPrimary = false) {
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
propertySchema.methods.setPrimaryImage = function(imageId) {
  this.images.forEach(img => {
    img.isPrimary = img._id.toString() === imageId.toString();
  });
  return this.save();
};

// Method to remove image
propertySchema.methods.removeImage = function(imageId) {
  this.images = this.images.filter(img => img._id.toString() !== imageId.toString());
  return this.save();
};

// Pre-save middleware to generate property ID
propertySchema.pre('save', function(next) {
  if (this.isNew && !this.propertyId) {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    this.propertyId = `PROP-${timestamp}-${random}`.toUpperCase();
  }
  next();
});

// Static method to search properties
propertySchema.statics.searchProperties = function(filters, page = 1, limit = 10) {
  const query = {};
  
  if (filters.city) query['location.city'] = new RegExp(filters.city, 'i');
  if (filters.state) query['location.state'] = new RegExp(filters.state, 'i');
  if (filters.propertyType) query.propertyType = filters.propertyType;
  if (filters.listingType) query.listingType = filters.listingType;
  if (filters.minPrice) query.price = { ...query.price, $gte: filters.minPrice };
  if (filters.maxPrice) query.price = { ...query.price, $lte: filters.maxPrice };
  if (filters.minArea) query.area = { ...query.area, $gte: filters.minArea };
  if (filters.maxArea) query.area = { ...query.area, $lte: filters.maxArea };
  if (filters.amenities && filters.amenities.length > 0) {
    query.amenities = { $in: filters.amenities };
  }
  if (filters.status) query.status = filters.status;
  else query.status = 'active';
  
  const skip = (page - 1) * limit;
  
  return this.find(query)
    .populate('owner', 'phone profile')
    .populate('broker', 'phone profile')
    .sort({ isFeatured: -1, createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

export default mongoose.model('Property', propertySchema);
