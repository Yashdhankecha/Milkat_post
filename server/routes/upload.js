import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { catchAsync } from '../middleware/errorHandler.js';
import {
  smartUpload,
  processUploadedFiles,
  validateFileType,
  cleanupTempFiles,
  deleteFromCloudinary,
  deleteLocalFile,
  getFileType
} from '../middleware/upload.js';
import Media from '../models/Media.js';
import fs from 'fs';
import path from 'path';

const router = express.Router();

// Helper function to save media to database
const saveMediaToDB = async (fileData, userId, additionalData = {}) => {
  try {
    console.log('Saving media to database:', { userId, additionalData });
    
    const media = new Media({
      url: fileData.url,
      public_id: fileData.public_id,
      resource_type: fileData.resource_type,
      format: fileData.format,
      bytes: fileData.size,
      width: fileData.width,
      height: fileData.height,
      uploadedBy: userId,
      ...additionalData
    });
    
    const savedMedia = await media.save();
    console.log('Media saved to database:', savedMedia._id, 'Format:', fileData.format);
    return savedMedia;
  } catch (error) {
    console.error('Error saving media to database:', error);
    throw error;
  }
};

// Upload single file (handles images, videos, and PDFs)
router.post('/single',
  authenticate,
  smartUpload('file', 1),
  validateFileType,
  processUploadedFiles,
  cleanupTempFiles,
  catchAsync(async (req, res) => {
    if (!req.processedFiles || req.processedFiles.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    try {
      console.log('Single file upload request received');
      const fileData = req.processedFiles[0];
      console.log('File:', fileData.originalName, 'Size:', fileData.size, 'Type:', getFileType(fileData.mimetype));
      console.log('User:', req.user._id);
      
      // Determine additional data based on context
      let additionalData = {
        documentType: req.body.documentType || 'general'
      };
      
      // Add tags based on upload context
      if (req.headers['x-upload-type'] === 'society-document') {
        additionalData.tags = ['society_document', req.body.documentType || 'general'];
      } else if (req.body.folder === 'proposal_documents') {
        additionalData.tags = ['proposal_document'];
      } else if (fileData.resource_type === 'image') {
        additionalData.tags = ['image'];
      } else if (fileData.resource_type === 'video') {
        additionalData.tags = ['video'];
      } else if (fileData.resource_type === 'raw') {
        additionalData.tags = ['document'];
      }
      
      // Save to database
      const media = await saveMediaToDB(fileData, req.user._id, additionalData);

      res.status(200).json({
        success: true,
        data: {
          media: {
            id: media._id,
            url: media.url,
            public_id: media.public_id,
            resource_type: media.resource_type,
            format: media.format,
            bytes: media.bytes,
            width: media.width,
            height: media.height,
            storageType: fileData.storageType,
            createdAt: media.createdAt
          }
        },
        message: 'File uploaded successfully'
      });
    } catch (error) {
      console.error('Upload error:', error);
      
      // Handle specific error types
      if (error.message.includes('File too large')) {
        return res.status(413).json({
          success: false,
          message: 'File too large',
          error: 'File size exceeds the maximum allowed limit'
        });
      }
      
      if (error.message.includes('Invalid file type')) {
        return res.status(400).json({
          success: false,
          message: 'Invalid file type',
          error: error.message
        });
      }
      
      if (error.message.includes('Cloudinary')) {
        return res.status(503).json({
          success: false,
          message: 'Upload service unavailable',
          error: 'File upload service is temporarily unavailable. Please try again later.'
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Upload failed',
        error: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  })
);

// Upload multiple files
router.post('/multiple',
  authenticate,
  smartUpload('files', 10),
  validateFileType,
  processUploadedFiles,
  cleanupTempFiles,
  catchAsync(async (req, res) => {
    if (!req.processedFiles || req.processedFiles.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    try {
      const mediaPromises = req.processedFiles.map(fileData => 
        saveMediaToDB(fileData, req.user._id, {
          tags: [fileData.resource_type]
        })
      );
      
      const mediaResults = await Promise.all(mediaPromises);

      res.status(200).json({
        success: true,
        media: mediaResults.map((media, index) => ({
          id: media._id,
          url: media.url,
          public_id: media.public_id,
          resource_type: media.resource_type,
          format: media.format,
          bytes: media.bytes,
          width: media.width,
          height: media.height,
          storageType: req.processedFiles[index].storageType,
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

// Upload property images (images and videos only)
router.post('/property-images',
  authenticate,
  authorize('buyer_seller', 'broker', 'developer', 'society_owner'),
  smartUpload('images', 20),
  validateFileType,
  processUploadedFiles,
  cleanupTempFiles,
  catchAsync(async (req, res) => {
    console.log('Property images upload request received');
    console.log('Request body:', req.body);
    console.log('Request files:', req.processedFiles ? req.processedFiles.length : 'No files');
    console.log('User:', req.user ? req.user._id : 'No user');
    
    if (!req.processedFiles || req.processedFiles.length === 0) {
      console.log('No files uploaded');
      return res.status(400).json({
        success: false,
        message: 'No images uploaded'
      });
    }

    // Filter out PDFs for property images
    const mediaFiles = req.processedFiles.filter(file => 
      file.resource_type === 'image' || file.resource_type === 'video'
    );

    if (mediaFiles.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Only images and videos are allowed for property uploads'
      });
    }

    try {
      const mediaPromises = mediaFiles.map((fileData, index) => 
        saveMediaToDB(fileData, req.user._id, {
          tags: ['property'],
          alt: `Property ${fileData.resource_type} ${index + 1}`,
          caption: `Property ${fileData.resource_type} ${index + 1}`
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
          storageType: mediaFiles[index].storageType,
          createdAt: media.createdAt
        }))
      });
    } catch (error) {
      console.error('Property images upload error:', error);
      console.error('Error stack:', error.stack);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        statusCode: error.statusCode,
        name: error.name
      });
      res.status(500).json({
        success: false,
        message: 'Property images upload failed',
        error: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  })
);

// Upload society documents (PDFs only)
router.post('/society-documents',
  authenticate,
  smartUpload('documents', 20),
  validateFileType,
  processUploadedFiles,
  cleanupTempFiles,
  catchAsync(async (req, res) => {
    console.log('Society documents upload request received');
    console.log('Request body:', req.body);
    console.log('Request files:', req.processedFiles ? req.processedFiles.length : 'No files');
    console.log('User:', req.user ? req.user._id : 'No user');
    
    if (!req.processedFiles || req.processedFiles.length === 0) {
      console.log('No files uploaded');
      return res.status(400).json({
        success: false,
        message: 'No documents uploaded'
      });
    }

    // Filter for PDFs only
    const pdfFiles = req.processedFiles.filter(file => file.resource_type === 'raw');

    if (pdfFiles.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Only PDF documents are allowed for society document uploads'
      });
    }

    try {
      const mediaPromises = pdfFiles.map((fileData, index) => 
        saveMediaToDB(fileData, req.user._id, {
          tags: ['society_document'],
          alt: `Society document ${index + 1}`,
          caption: `Society document ${index + 1}`,
          documentType: req.body.type || 'general'
        })
      );
      
      const mediaResults = await Promise.all(mediaPromises);

      res.status(200).json({
        success: true,
        documents: mediaResults.map((media, index) => ({
          id: media._id,
          url: media.url,
          public_id: media.public_id,
          resource_type: media.resource_type,
          format: media.format,
          bytes: media.bytes,
          width: media.width,
          height: media.height,
          documentType: media.documentType,
          storageType: pdfFiles[index].storageType,
          createdAt: media.createdAt
        }))
      });
    } catch (error) {
      console.error('Society documents upload error:', error);
      console.error('Error stack:', error.stack);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        statusCode: error.statusCode,
        name: error.name
      });
      res.status(500).json({
        success: false,
        message: 'Society documents upload failed',
        error: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  })
);

// Upload profile picture (images only)
router.post('/profile-picture',
  authenticate,
  smartUpload('profilePicture', 1),
  validateFileType,
  processUploadedFiles,
  cleanupTempFiles,
  catchAsync(async (req, res) => {
    if (!req.processedFiles || req.processedFiles.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No profile picture uploaded'
      });
    }

    const fileData = req.processedFiles[0];
    
    // Only allow images for profile pictures
    if (fileData.resource_type !== 'image') {
      return res.status(400).json({
        success: false,
        message: 'Only image files are allowed for profile pictures'
      });
    }

    try {
      // Save to database
      const media = await saveMediaToDB(fileData, req.user._id, {
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
          storageType: fileData.storageType,
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
      
      // Delete based on storage type
      if (media.url.startsWith('http')) {
        // Cloudinary URL
        await deleteFromCloudinary(media.public_id, media.resource_type);
      } else if (media.url.startsWith('/uploads/')) {
        // Local file
        const filepath = path.join(process.cwd(), media.url);
        await deleteLocalFile(filepath);
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
          storageType: item.url.startsWith('http') ? 'cloudinary' : 'local',
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

// Serve uploaded files (for local PDFs)
router.get('/uploads/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join('uploads', filename);
  
  if (fs.existsSync(filePath)) {
    res.sendFile(path.resolve(filePath));
  } else {
    res.status(404).json({
      success: false,
      message: 'File not found'
    });
  }
});

// Serve uploaded files statically
router.use('/uploads', express.static('uploads'));

export default router;