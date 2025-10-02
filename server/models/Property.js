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
  
  // Location filters
  if (filters.city) query['location.city'] = new RegExp(filters.city, 'i');
  if (filters.state) query['location.state'] = new RegExp(filters.state, 'i');
  if (filters.country) query['location.country'] = new RegExp(filters.country, 'i');
  
  // Property type and listing type filters
  if (filters.propertyType) query.propertyType = filters.propertyType;
  if (filters.listingType) query.listingType = filters.listingType;
  
  // Price range filters
  if (filters.minPrice || filters.maxPrice) {
    query.price = {};
    if (filters.minPrice) query.price.$gte = parseInt(filters.minPrice);
    if (filters.maxPrice) query.price.$lte = parseInt(filters.maxPrice);
  }
  
  // Area range filters
  if (filters.minArea || filters.maxArea) {
    query.area = {};
    if (filters.minArea) query.area.$gte = parseInt(filters.minArea);
    if (filters.maxArea) query.area.$lte = parseInt(filters.maxArea);
  }
  
  // Amenities filter
  if (filters.amenities && filters.amenities.length > 0) {
    query.amenities = { $in: filters.amenities };
  }
  
  // Search term filter (search in title and description)
  if (filters.search) {
    query.$or = [
      { title: new RegExp(filters.search, 'i') },
      { description: new RegExp(filters.search, 'i') },
      { 'location.address': new RegExp(filters.search, 'i') }
    ];
  }
  
  // Owner filter
  if (filters.owner_id) query.owner = filters.owner_id;
  
  // Status filter
  if (filters.status) query.status = filters.status;
  else query.status = 'active';
  
  const skip = (page - 1) * limit;
  
  // Apply sorting
  let sortOptions = { isFeatured: -1, createdAt: -1 };
  if (filters.sort && filters.order) {
    sortOptions = {};
    sortOptions[filters.sort] = filters.order === 'asc' ? 1 : -1;
  }
  
  return this.find(query)
    .populate('owner', 'phone profile')
    .populate('broker', 'phone profile')
    .sort(sortOptions)
    .skip(skip)
    .limit(limit);
};

// Static method to count properties with filters
propertySchema.statics.countProperties = function(filters) {
  const query = {};
  
  // Location filters
  if (filters.city) query['location.city'] = new RegExp(filters.city, 'i');
  if (filters.state) query['location.state'] = new RegExp(filters.state, 'i');
  if (filters.country) query['location.country'] = new RegExp(filters.country, 'i');
  
  // Property type and listing type filters
  if (filters.propertyType) query.propertyType = filters.propertyType;
  if (filters.listingType) query.listingType = filters.listingType;
  
  // Price range filters
  if (filters.minPrice || filters.maxPrice) {
    query.price = {};
    if (filters.minPrice) query.price.$gte = parseInt(filters.minPrice);
    if (filters.maxPrice) query.price.$lte = parseInt(filters.maxPrice);
  }
  
  // Area range filters
  if (filters.minArea || filters.maxArea) {
    query.area = {};
    if (filters.minArea) query.area.$gte = parseInt(filters.minArea);
    if (filters.maxArea) query.area.$lte = parseInt(filters.maxArea);
  }
  
  // Amenities filter
  if (filters.amenities && filters.amenities.length > 0) {
    query.amenities = { $in: filters.amenities };
  }
  
  // Search term filter (search in title and description)
  if (filters.search) {
    query.$or = [
      { title: new RegExp(filters.search, 'i') },
      { description: new RegExp(filters.search, 'i') },
      { 'location.address': new RegExp(filters.search, 'i') }
    ];
  }
  
  // Owner filter
  if (filters.owner_id) query.owner = filters.owner_id;
  
  // Status filter
  if (filters.status) query.status = filters.status;
  else query.status = 'active';
  
  return this.countDocuments(query);
};

export default mongoose.model('Property', propertySchema);
