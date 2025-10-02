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
    fileSize: 100 * 1024 * 1024, // 100MB limit for videos
  },
  fileFilter: (req, file, cb) => {
    // Accept images, videos, and documents
    if (file.mimetype.startsWith('image/') || 
        file.mimetype.startsWith('video/') ||
        file.mimetype === 'application/pdf' ||
        file.mimetype === 'application/msword' ||
        file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        file.mimetype === 'application/vnd.ms-excel' ||
        file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
      cb(null, true);
    } else {
      cb(new Error('Only image, video, and document files are allowed'), false);
    }
  }
});

// Helper function to save files locally on server (both development and production)
const uploadToServer = async (filePath, options = {}) => {
  try {
    console.log('Saving file to server:', { filePath, options });
    
    const stats = fs.statSync(filePath);
    const fileName = path.basename(filePath);
    const publicId = `server_${Date.now()}_${Math.round(Math.random() * 1E9)}`;
    
    // Move file from temp-uploads to uploads directory with folder structure
    const baseUploadsDir = path.join(path.dirname(filePath), '../uploads');
    const folderPath = options.folder ? options.folder.replace('nestly_estate/', '') : 'general';
    const uploadsDir = path.join(baseUploadsDir, folderPath);
    
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    const newFilePath = path.join(uploadsDir, fileName);
    fs.renameSync(filePath, newFilePath);
    
    // Get server base URL from environment or use default
    const serverBaseUrl = process.env.SERVER_BASE_URL || 'http://localhost:5000';
    
    // Create response object similar to Cloudinary
    const relativePath = path.relative(baseUploadsDir, newFilePath).replace(/\\/g, '/');
    const result = {
      public_id: publicId,
      secure_url: `${serverBaseUrl}/uploads/${relativePath}`,
      url: `${serverBaseUrl}/uploads/${relativePath}`,
      resource_type: 'raw', // Use 'raw' for documents
      format: path.extname(fileName).substring(1),
      bytes: stats.size,
      width: null,
      height: null,
      created_at: new Date().toISOString()
    };
    
    console.log('File saved to server:', newFilePath);
    console.log('Access URL:', result.url);
    
    return result;
  } catch (error) {
    console.error('Upload error:', error);
    // Clean up temp file on error
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    throw error;
  }
};

// Helper function to save media to database
const saveMediaToDB = async (cloudinaryResult, userId, additionalData = {}) => {
  try {
    console.log('Saving media to database:', { userId, additionalData });
    
    // Extract format from file extension if not provided by Cloudinary
    let format = cloudinaryResult.format;
    if (!format && cloudinaryResult.secure_url) {
      const url = cloudinaryResult.secure_url;
      const match = url.match(/\.([^.]+)(?:\?|$)/);
      if (match) {
        format = match[1].toLowerCase();
      }
    }
    
    // Fallback format for raw files
    if (!format) {
      format = 'unknown';
    }
    
    const media = new Media({
      url: cloudinaryResult.secure_url,
      public_id: cloudinaryResult.public_id,
      resource_type: cloudinaryResult.resource_type,
      format: format,
      bytes: cloudinaryResult.bytes,
      width: cloudinaryResult.width,
      height: cloudinaryResult.height,
      uploadedBy: userId,
      ...additionalData
    });
    
    const savedMedia = await media.save();
    console.log('Media saved to database:', savedMedia._id, 'Format:', format);
    return savedMedia;
  } catch (error) {
    console.error('Error saving media to database:', error);
    throw error;
  }
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
      console.log('Single file upload request received');
      console.log('File:', req.file.originalname, 'Size:', req.file.size);
      console.log('User:', req.user._id);
      
      // Determine upload folder based on context
      let uploadOptions = {
        folder: req.body.folder || 'nestly_estate/general'
      };
      
      // Check if this is a society document upload (based on request headers or body)
      if (req.headers['x-upload-type'] === 'society-document') {
        const documentType = req.body.documentType || 'general';
        uploadOptions.folder = `nestly_estate/society_documents/${documentType}`;
        uploadOptions.tags = ['society_document', documentType];
      }
      
      // For proposal documents, use the specified folder
      if (req.body.folder === 'proposal_documents') {
        uploadOptions.folder = 'nestly_estate/proposal_documents';
        uploadOptions.tags = ['proposal_document'];
      }
      
      // Upload to server
      const uploadResult = await uploadToServer(req.file.path, uploadOptions);
      
      // Save to database
      const media = await saveMediaToDB(uploadResult, req.user._id, {
        documentType: req.body.documentType || 'general'
      });

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
          error: 'File size exceeds the maximum allowed limit of 100MB'
        });
      }
      
      if (error.message.includes('Invalid file type')) {
        return res.status(400).json({
          success: false,
          message: 'Invalid file type',
          error: 'Only image, video, and document files are allowed'
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
        uploadToServer(file.path)
      );
      
      const uploadResults = await Promise.all(uploadPromises);
      
      const mediaPromises = uploadResults.map(result => 
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
    console.log('Property images upload request received');
    console.log('Request body:', req.body);
    console.log('Request files:', req.files ? req.files.length : 'No files');
    console.log('User:', req.user ? req.user._id : 'No user');
    
    if (!req.files || req.files.length === 0) {
      console.log('No files uploaded');
      return res.status(400).json({
        success: false,
        message: 'No images uploaded'
      });
    }

    try {
      const uploadPromises = req.files.map((file, index) => 
        uploadToServer(file.path, {
          folder: 'nestly_estate/properties',
          tags: ['property', `primary_${index === 0}`]
        })
      );
      
      const uploadResults = await Promise.all(uploadPromises);
      
      const mediaPromises = uploadResults.map((result, index) => 
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

// Upload society documents
router.post('/society-documents',
  authenticate,
  upload.array('documents', 20),
  catchAsync(async (req, res) => {
    console.log('Society documents upload request received');
    console.log('Request body:', req.body);
    console.log('Request files:', req.files ? req.files.length : 'No files');
    console.log('User:', req.user ? req.user._id : 'No user');
    
    if (!req.files || req.files.length === 0) {
      console.log('No files uploaded');
      return res.status(400).json({
        success: false,
        message: 'No documents uploaded'
      });
    }

    try {
      const uploadPromises = req.files.map((file, index) => 
        uploadToServer(file.path, {
          folder: 'nestly_estate/society_documents',
          tags: ['society_document', req.body.type || 'general']
        })
      );
      
      const uploadResults = await Promise.all(uploadPromises);
      
      const mediaPromises = uploadResults.map((result, index) => 
        saveMediaToDB(result, req.user._id, {
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
      // Upload to server with specific folder
      const uploadResult = await uploadToServer(req.file.path, {
        folder: 'nestly_estate/profile_pictures',
        tags: ['profile_picture']
      });
      
      // Save to database
      const media = await saveMediaToDB(uploadResult, req.user._id, {
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

// Serve uploaded files (for development mode when not using Cloudinary)
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