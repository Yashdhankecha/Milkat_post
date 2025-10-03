import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    unique: true,
    sparse: true, // Allows multiple null values
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: function() {
      return this.authMethod === 'email';
    },
    minlength: 6
  },
  authMethod: {
    type: String,
    enum: ['phone', 'email'],
    default: 'phone'
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationCode: String,
  verificationCodeExpires: Date,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  refreshTokens: [{
    token: String,
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 2592000 // 30 days
    }
  }],
  lastLogin: Date,
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: Date,
  isActive: {
    type: Boolean,
    default: true
  },
  isSuspended: {
    type: Boolean,
    default: false
  },
  suspensionReason: String,
  suspensionExpires: Date,
  currentRole: {
    type: String,
    enum: ['admin', 'buyer_seller', 'broker', 'developer', 'society_owner', 'society_member'],
    default: 'buyer_seller'
  },
  activeRole: {
    type: String,
    enum: ['admin', 'buyer_seller', 'broker', 'developer', 'society_owner', 'society_member'],
    default: 'buyer_seller'
  },
  savedProjects: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  }]
}, {
  timestamps: true
});

// Index for performance - phone and email already have unique indexes from schema definition
userSchema.index({ isActive: 1, isSuspended: 1 });

// Virtual for account lock status
userSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to increment login attempts
userSchema.methods.incLoginAttempts = function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  
  // Lock account after 5 failed attempts for 2 hours
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 }; // 2 hours
  }
  
  return this.updateOne(updates);
};

// Method to reset login attempts
userSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 }
  });
};

// Method to add refresh token
userSchema.methods.addRefreshToken = function(token) {
  this.refreshTokens.push({ token });
  return this.save();
};

// Method to remove refresh token
userSchema.methods.removeRefreshToken = function(token) {
  this.refreshTokens = this.refreshTokens.filter(rt => rt.token !== token);
  return this.save();
};

// Method to clear all refresh tokens
userSchema.methods.clearRefreshTokens = function() {
  this.refreshTokens = [];
  return this.save();
};

// Transform output
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  delete user.verificationCode;
  delete user.resetPasswordToken;
  delete user.refreshTokens;
  delete user.loginAttempts;
  delete user.lockUntil;
  return user;
};

export default mongoose.model('User', userSchema);
