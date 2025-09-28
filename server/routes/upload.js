import express from 'express';
import multer from 'multer';
import { authenticate, authorize } from '../middleware/auth.js';
import { catchAsync } from '../middleware/errorHandler.js';
import cloudinary from '../config/cloudinary.js';
import Media from '../models/Media.js';
import fs from 'fs';
import path from 'path';

const router = express.Router();

// Configure multer for temporary file storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'temp-uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept both images and videos
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image and video files are allowed'), false);
    }
  }
});

// Helper function to upload file to Cloudinary
const uploadToCloudinary = async (filePath, options = {}) => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      resource_type: 'auto', // Automatically detect image or video
      folder: 'nestly_estate',
      ...options
    });
    
    // Delete temporary file
    fs.unlinkSync(filePath);
    
    return result;
  } catch (error) {
    // Clean up temp file on error
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    throw error;
  }
};

// Helper function to save media to database
const saveMediaToDB = async (cloudinaryResult, userId, additionalData = {}) => {
  const media = new Media({
    url: cloudinaryResult.secure_url,
    public_id: cloudinaryResult.public_id,
    resource_type: cloudinaryResult.resource_type,
    format: cloudinaryResult.format,
    bytes: cloudinaryResult.bytes,
    width: cloudinaryResult.width,
    height: cloudinaryResult.height,
    uploadedBy: userId,
    ...additionalData
  });
  
  return await media.save();
};

// Upload single file (image or video)
router.post('/single',
  authenticate,
  upload.single('file'),
  catchAsync(async (req, res) => {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    try {
      // Upload to Cloudinary
      const cloudinaryResult = await uploadToCloudinary(req.file.path);
      
      // Save to database
      const media = await saveMediaToDB(cloudinaryResult, req.user._id);

      res.status(200).json({
        success: true,
        media: {
          id: media._id,
          url: media.url,
          public_id: media.public_id,
          resource_type: media.resource_type,
          format: media.format,
          bytes: media.bytes,
          width: media.width,
          height: media.height,
          createdAt: media.createdAt
        }
      });
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({
        success: false,
        message: 'Upload failed',
        error: error.message
      });
    }
  })
);

// Upload multiple files (images and/or videos)
router.post('/multiple',
  authenticate,
  upload.array('files', 10), // Max 10 files
  catchAsync(async (req, res) => {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    try {
      const uploadPromises = req.files.map(file => 
        uploadToCloudinary(file.path)
      );
      
      const cloudinaryResults = await Promise.all(uploadPromises);
      
      const mediaPromises = cloudinaryResults.map(result => 
        saveMediaToDB(result, req.user._id)
      );
      
      const mediaResults = await Promise.all(mediaPromises);

      res.status(200).json({
        success: true,
        media: mediaResults.map(media => ({
          id: media._id,
          url: media.url,
          public_id: media.public_id,
          resource_type: media.resource_type,
          format: media.format,
          bytes: media.bytes,
          width: media.width,
          height: media.height,
          createdAt: media.createdAt
        }))
      });
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({
        success: false,
        message: 'Upload failed',
        error: error.message
      });
    }
  })
);

// Upload property images
router.post('/property-images',
  authenticate,
  authorize('buyer_seller', 'broker', 'developer', 'society_owner'),
  upload.array('images', 20),
  catchAsync(async (req, res) => {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No images uploaded'
      });
    }

    try {
      const uploadPromises = req.files.map((file, index) => 
        uploadToCloudinary(file.path, {
          folder: 'nestly_estate/properties',
          tags: ['property', `primary_${index === 0}`]
        })
      );
      
      const cloudinaryResults = await Promise.all(uploadPromises);
      
      const mediaPromises = cloudinaryResults.map((result, index) => 
        saveMediaToDB(result, req.user._id, {
          tags: ['property'],
          alt: `Property image ${index + 1}`,
          caption: `Property image ${index + 1}`
        })
      );
      
      const mediaResults = await Promise.all(mediaPromises);

      res.status(200).json({
        success: true,
        images: mediaResults.map((media, index) => ({
          id: media._id,
          url: media.url,
          public_id: media.public_id,
          resource_type: media.resource_type,
          format: media.format,
          bytes: media.bytes,
          width: media.width,
          height: media.height,
          isPrimary: index === 0,
          caption: media.caption,
          createdAt: media.createdAt
        }))
      });
    } catch (error) {
      console.error('Property images upload error:', error);
      res.status(500).json({
        success: false,
        message: 'Property images upload failed',
        error: error.message
      });
    }
  })
);

// Upload profile picture
router.post('/profile-picture',
  authenticate,
  upload.single('profilePicture'),
  catchAsync(async (req, res) => {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No profile picture uploaded'
      });
    }

    try {
      // Upload to Cloudinary with specific folder and transformations
      const cloudinaryResult = await uploadToCloudinary(req.file.path, {
        folder: 'nestly_estate/profile_pictures',
        transformation: [
          { width: 400, height: 400, crop: 'fill', gravity: 'face' }
        ],
        tags: ['profile_picture']
      });
      
      // Save to database
      const media = await saveMediaToDB(cloudinaryResult, req.user._id, {
        tags: ['profile_picture'],
        alt: 'Profile picture'
      });

      // Update user profile with new picture URL
      const Profile = (await import('../models/Profile.js')).default;
      await Profile.findOneAndUpdate(
        { user: req.user._id },
        { profilePicture: media.url },
        { new: true }
      );

      res.status(200).json({
        success: true,
        media: {
          id: media._id,
          url: media.url,
          public_id: media.public_id,
          resource_type: media.resource_type,
          format: media.format,
          bytes: media.bytes,
          width: media.width,
          height: media.height,
          createdAt: media.createdAt
        }
      });
    } catch (error) {
      console.error('Profile picture upload error:', error);
      res.status(500).json({
        success: false,
        message: 'Profile picture upload failed',
        error: error.message
      });
    }
  })
);

// Delete media file
router.delete('/:mediaId',
  authenticate,
  catchAsync(async (req, res) => {
    const { mediaId } = req.params;
    
    try {
      // Find media in database
      const media = await Media.findById(mediaId);
      
      if (!media) {
        return res.status(404).json({
          success: false,
          message: 'Media not found'
        });
      }
      
      // Check if user owns this media
      if (media.uploadedBy.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'You can only delete your own media'
        });
      }
      
      // Delete from Cloudinary
      const deleteResult = await cloudinary.uploader.destroy(media.public_id, {
        resource_type: media.resource_type
      });
      
      if (deleteResult.result !== 'ok') {
        console.warn('Cloudinary deletion warning:', deleteResult);
      }
      
      // Delete from database
      await Media.findByIdAndDelete(mediaId);
      
      res.status(200).json({
        success: true,
        message: 'Media deleted successfully'
      });
    } catch (error) {
      console.error('Delete media error:', error);
      res.status(500).json({
        success: false,
        message: 'Delete failed',
        error: error.message
      });
    }
  })
);

// Get user's media
router.get('/my-media',
  authenticate,
  catchAsync(async (req, res) => {
    try {
      const media = await Media.find({ uploadedBy: req.user._id })
        .sort({ createdAt: -1 })
        .limit(50);
      
      res.status(200).json({
        success: true,
        media: media.map(item => ({
          id: item._id,
          url: item.url,
          public_id: item.public_id,
          resource_type: item.resource_type,
          format: item.format,
          bytes: item.bytes,
          width: item.width,
          height: item.height,
          tags: item.tags,
          alt: item.alt,
          caption: item.caption,
          createdAt: item.createdAt
        }))
      });
    } catch (error) {
      console.error('Get media error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch media',
        error: error.message
      });
    }
  })
);

export default router;