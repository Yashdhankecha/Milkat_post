import mongoose from 'mongoose';

const likeSchema = new mongoose.Schema({
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
  likedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index to ensure one like per user per property
likeSchema.index({ user: 1, property: 1 }, { unique: true });

// Index for efficient queries
likeSchema.index({ property: 1 });
likeSchema.index({ user: 1 });

// Static method to get like count for a property
likeSchema.statics.getLikeCount = function(propertyId) {
  return this.countDocuments({ property: propertyId });
};

// Static method to check if user liked a property
likeSchema.statics.hasUserLiked = function(userId, propertyId) {
  return this.findOne({ user: userId, property: propertyId });
};

// Static method to get user's liked properties
likeSchema.statics.getUserLikes = function(userId, page = 1, limit = 10) {
  const skip = (page - 1) * limit;
  return this.find({ user: userId })
    .populate({
      path: 'property',
      select: 'title description price location images propertyType listingType status area builtUpArea carpetArea amenities furnishedStatus floorNumber totalFloors ageOfProperty facing parkingSpaces createdAt updatedAt'
    })
    .sort({ likedAt: -1 })
    .skip(skip)
    .limit(limit);
};

export default mongoose.model('Like', likeSchema);
