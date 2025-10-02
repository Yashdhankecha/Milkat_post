import mongoose from 'mongoose';

const shareSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  property: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: true
  },
  shareMethod: {
    type: String,
    enum: ['email', 'whatsapp', 'facebook', 'twitter', 'linkedin', 'copy_link', 'other'],
    required: true
  },
  sharedWith: {
    type: String,
    trim: true
  },
  sharedAt: {
    type: Date,
    default: Date.now
  },
  metadata: {
    userAgent: String,
    ipAddress: String,
    referrer: String
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
shareSchema.index({ property: 1 });
shareSchema.index({ user: 1 });
shareSchema.index({ shareMethod: 1 });
shareSchema.index({ sharedAt: -1 });

// Static method to get share count for a property
shareSchema.statics.getShareCount = function(propertyId) {
  return this.countDocuments({ property: propertyId });
};

// Static method to get share count by method
shareSchema.statics.getShareCountByMethod = function(propertyId) {
  return this.aggregate([
    { $match: { property: new mongoose.Types.ObjectId(propertyId) } },
    { $group: { _id: '$shareMethod', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);
};

// Static method to get user's shared properties
shareSchema.statics.getUserShares = function(userId, page = 1, limit = 10) {
  const skip = (page - 1) * limit;
  return this.find({ user: userId })
    .populate('property', 'title price location images propertyType listingType')
    .sort({ sharedAt: -1 })
    .skip(skip)
    .limit(limit);
};

export default mongoose.model('Share', shareSchema);
