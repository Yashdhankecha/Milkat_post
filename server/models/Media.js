import mongoose from 'mongoose';

const MediaSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true
  },
  public_id: {
    type: String,
    required: true
  },
  resource_type: {
    type: String,
    enum: ['image', 'video', 'raw', 'auto'],
    required: true
  },
  format: {
    type: String,
    required: true
  },
  bytes: {
    type: Number,
    required: true
  },
  width: {
    type: Number,
    default: null
  },
  height: {
    type: Number,
    default: null
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tags: [{
    type: String
  }],
  alt: {
    type: String,
    default: ''
  },
  caption: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Index for performance
MediaSchema.index({ uploadedBy: 1 });
MediaSchema.index({ resource_type: 1 });
MediaSchema.index({ public_id: 1 }, { unique: true });

// Virtual for file size in human readable format
MediaSchema.virtual('fileSizeFormatted').get(function() {
  const bytes = this.bytes;
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
});

// Method to get Cloudinary transformation URL (only for Cloudinary URLs)
MediaSchema.methods.getTransformedUrl = function(transformations = {}) {
  if (!this.url) return null;
  
  // Only apply transformations to Cloudinary URLs
  if (!this.url.startsWith('http') || !this.url.includes('cloudinary.com')) {
    return this.url;
  }
  
  // Default transformations
  const defaultTransformations = {
    quality: 'auto',
    fetch_format: 'auto'
  };
  
  const finalTransformations = { ...defaultTransformations, ...transformations };
  
  // Build transformation string
  const transformString = Object.entries(finalTransformations)
    .map(([key, value]) => `${key}_${value}`)
    .join(',');
  
  if (!transformString) return this.url;
  
  // Insert transformation into URL
  const urlParts = this.url.split('/upload/');
  if (urlParts.length === 2) {
    return `${urlParts[0]}/upload/${transformString}/${urlParts[1]}`;
  }
  
  return this.url;
};

// Method to get storage type
MediaSchema.methods.getStorageType = function() {
  if (this.url.startsWith('http') && this.url.includes('cloudinary.com')) {
    return 'cloudinary';
  } else if (this.url.startsWith('/uploads/')) {
    return 'local';
  }
  return 'unknown';
};

// Method to delete from Cloudinary
MediaSchema.methods.deleteFromCloudinary = async function() {
  const cloudinary = require('cloudinary').v2;
  
  try {
    const result = await cloudinary.uploader.destroy(this.public_id, {
      resource_type: this.resource_type
    });
    return result;
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    throw error;
  }
};

// Method to delete file based on storage type
MediaSchema.methods.deleteFile = async function() {
  const storageType = this.getStorageType();
  
  if (storageType === 'cloudinary') {
    return await this.deleteFromCloudinary();
  } else if (storageType === 'local') {
    const fs = require('fs');
    const path = require('path');
    
    try {
      const filepath = path.join(process.cwd(), this.url);
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
        return { result: 'ok' };
      }
      return { result: 'not_found' };
    } catch (error) {
      console.error('Error deleting local file:', error);
      throw error;
    }
  }
  
  throw new Error('Unknown storage type');
};

export default mongoose.model('Media', MediaSchema);
