import mongoose from 'mongoose';

const requirementSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  purpose: {
    type: String,
    required: true,
    enum: ['buy', 'rent', 'lease', 'invest', 'other']
  },
  budget: {
    min: {
      type: Number,
      min: 0
    },
    max: {
      type: Number,
      min: 0
    },
    currency: {
      type: String,
      default: 'INR'
    }
  },
  propertyType: {
    type: String,
    required: true,
    enum: ['apartment', 'villa', 'house', 'plot', 'commercial', 'office', 'shop', 'warehouse', 'other']
  },
  location: {
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
    area: {
      type: String,
      trim: true
    },
    pincode: {
      type: String,
      trim: true
    }
  },
  area: {
    min: {
      type: Number,
      min: 0
    },
    max: {
      type: Number,
      min: 0
    },
    unit: {
      type: String,
      default: 'sqft'
    }
  },
  description: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  preferences: {
    furnished: {
      type: String,
      enum: ['furnished', 'semi_furnished', 'unfurnished', 'any']
    },
    age: {
      type: String,
      enum: ['new', '1-5_years', '5-10_years', '10+_years', 'any']
    },
    floor: {
      type: String,
      enum: ['ground', '1-3', '4-6', '7+', 'any']
    },
    facing: {
      type: String,
      enum: ['north', 'south', 'east', 'west', 'north_east', 'north_west', 'south_east', 'south_west', 'any']
    }
  },
  amenities: [{
    type: String,
    enum: [
      'parking', 'security', 'gym', 'swimming_pool', 'garden', 'playground',
      'clubhouse', 'power_backup', 'water_supply', 'elevator', 'balcony',
      'terrace', 'modular_kitchen', 'wardrobe', 'ac', 'furnished', 'semi_furnished'
    ]
  }],
  contact: {
    phone: {
      type: String,
      required: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true
    },
    preferredTime: {
      type: String,
      enum: ['morning', 'afternoon', 'evening', 'any']
    }
  },
  status: {
    type: String,
    enum: ['active', 'fulfilled', 'cancelled', 'expired'],
    default: 'active'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  timeline: {
    type: String,
    enum: ['immediate', '1_month', '3_months', '6_months', '1_year', 'flexible'],
    default: 'flexible'
  },
  matches: [{
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property'
    },
    score: {
      type: Number,
      min: 0,
      max: 100
    },
    matchedAt: {
      type: Date,
      default: Date.now
    }
  }],
  views: {
    type: Number,
    default: 0
  },
  inquiries: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes for better query performance
requirementSchema.index({ user: 1 });
requirementSchema.index({ status: 1 });
requirementSchema.index({ 'location.city': 1 });
requirementSchema.index({ 'location.state': 1 });
requirementSchema.index({ propertyType: 1 });
requirementSchema.index({ purpose: 1 });
requirementSchema.index({ createdAt: -1 });

// Compound indexes for search
requirementSchema.index({ 
  'location.city': 1, 
  propertyType: 1, 
  purpose: 1, 
  status: 1 
});

// Virtual for requirement URL
requirementSchema.virtual('requirementUrl').get(function() {
  return `/api/requirements/${this._id}`;
});

// Method to increment views
requirementSchema.methods.incrementViews = function() {
  this.views += 1;
  return this.save();
};

// Method to increment inquiries
requirementSchema.methods.incrementInquiries = function() {
  this.inquiries += 1;
  return this.save();
};

// Method to add match
requirementSchema.methods.addMatch = function(propertyId, score) {
  // Remove existing match for this property if any
  this.matches = this.matches.filter(match => 
    match.property.toString() !== propertyId.toString()
  );
  
  // Add new match
  this.matches.push({
    property: propertyId,
    score: score
  });
  
  return this.save();
};

// Static method to search requirements
requirementSchema.statics.searchRequirements = function(filters, page = 1, limit = 10) {
  const query = {};
  
  if (filters.city) query['location.city'] = new RegExp(filters.city, 'i');
  if (filters.state) query['location.state'] = new RegExp(filters.state, 'i');
  if (filters.propertyType) query.propertyType = filters.propertyType;
  if (filters.purpose) query.purpose = filters.purpose;
  if (filters.minBudget) query['budget.min'] = { $gte: filters.minBudget };
  if (filters.maxBudget) query['budget.max'] = { $lte: filters.maxBudget };
  if (filters.status) query.status = filters.status;
  else query.status = 'active';
  
  const skip = (page - 1) * limit;
  
  return this.find(query)
    .populate('user', 'phone profile')
    .sort({ priority: -1, createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

export default mongoose.model('Requirement', requirementSchema);
