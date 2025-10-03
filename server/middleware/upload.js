import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v2 as cloudinary } from 'cloudinary';
import { AppError } from './errorHandler.js';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// File type validation
const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/webp',
  'image/gif'
];

const ALLOWED_VIDEO_TYPES = [
  'video/mp4',
  'video/avi',
  'video/mov',
  'video/wmv',
  'video/flv',
  'video/webm'
];

const ALLOWED_PDF_TYPES = [
  'application/pdf'
];

const ALLOWED_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES, ...ALLOWED_PDF_TYPES];

// File type checker
export const getFileType = (mimetype) => {
  if (ALLOWED_IMAGE_TYPES.includes(mimetype)) return 'image';
  if (ALLOWED_VIDEO_TYPES.includes(mimetype)) return 'video';
  if (ALLOWED_PDF_TYPES.includes(mimetype)) return 'pdf';
  return 'unknown';
};

// File type validation middleware
export const validateFileType = (req, res, next) => {
  const files = req.files || (req.file ? [req.file] : []);
  
  for (const file of files) {
    if (!ALLOWED_TYPES.includes(file.mimetype)) {
      return next(new AppError(
        `Invalid file type: ${file.mimetype}. Only images (JPEG, PNG, WebP, GIF), videos (MP4, AVI, MOV, WMV, FLV, WebM), and PDFs are allowed.`,
        400
      ));
    }
  }
  
  next();
};

// Multer configuration for Cloudinary files (images/videos) - memory storage
const cloudinaryStorage = multer.memoryStorage();

// Multer configuration for PDFs - disk storage
const pdfStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/';
    
    // Ensure uploads directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
      console.log('Created uploads directory:', uploadDir);
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter for Cloudinary uploads (images/videos)
const cloudinaryFileFilter = (req, file, cb) => {
  const fileType = getFileType(file.mimetype);
  if (fileType === 'image' || fileType === 'video') {
    cb(null, true);
  } else {
    cb(new AppError('Only images and videos are allowed for this upload type.', 400), false);
  }
};

// File filter for PDF uploads
const pdfFileFilter = (req, file, cb) => {
  const fileType = getFileType(file.mimetype);
  if (fileType === 'pdf') {
    cb(null, true);
  } else {
    cb(new AppError('Only PDF files are allowed for this upload type.', 400), false);
  }
};

// Create multer instances
export const cloudinaryUpload = multer({
  storage: cloudinaryStorage,
  fileFilter: cloudinaryFileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB for videos
    files: 10
  }
});

export const pdfUpload = multer({
  storage: pdfStorage,
  fileFilter: pdfFileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB for PDFs
    files: 10
  }
});

// Universal upload middleware that routes based on file type
export const smartUpload = (fieldName, maxCount = 10) => {
  return (req, res, next) => {
    // First, we need to check the files to determine the upload strategy
    // This is a bit tricky with multer, so we'll use a different approach
    
    // For now, we'll create a combined middleware that handles both
    const combinedUpload = multer({
      storage: multer.memoryStorage(), // Use memory for all files initially
      fileFilter: (req, file, cb) => {
        const fileType = getFileType(file.mimetype);
        if (fileType === 'unknown') {
          cb(new AppError(
            `Invalid file type: ${file.mimetype}. Only images, videos, and PDFs are allowed.`,
            400
          ), false);
        } else {
          cb(null, true);
        }
      },
      limits: {
        fileSize: 100 * 1024 * 1024, // 100MB
        files: maxCount
      }
    });

    const uploadMiddleware = maxCount === 1 ? 
      combinedUpload.single(fieldName) : 
      combinedUpload.array(fieldName, maxCount);

    uploadMiddleware(req, res, next);
  };
};

// Cloudinary upload helper
export const uploadToCloudinary = async (buffer, options = {}) => {
  try {
    const {
      folder = 'nestly-estate',
      resource_type = 'auto',
      public_id,
      tags = []
    } = options;

    return new Promise((resolve, reject) => {
      const uploadOptions = {
        folder,
        resource_type,
        tags,
        quality: 'auto',
        fetch_format: 'auto'
      };

      if (public_id) {
        uploadOptions.public_id = public_id;
      }

      cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error);
            reject(new AppError('Failed to upload file to cloud storage', 500));
          } else {
            resolve({
              url: result.secure_url,
              public_id: result.public_id,
              resource_type: result.resource_type,
              format: result.format,
              size: result.bytes,
              width: result.width,
              height: result.height
            });
          }
        }
      ).end(buffer);
    });
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new AppError('Failed to upload file to cloud storage', 500);
  }
};

// Process uploaded files based on type
export const processUploadedFiles = async (req, res, next) => {
  try {
    if (!req.files && !req.file) {
      return next();
    }

    const files = req.files || [req.file];
    const processedFiles = [];

    for (const file of files) {
      const fileType = getFileType(file.mimetype);
      
      if (fileType === 'image' || fileType === 'video') {
        // Upload to Cloudinary
        const cloudinaryResult = await uploadToCloudinary(file.buffer, {
          folder: req.body.folder || 'nestly-estate',
          resource_type: fileType === 'video' ? 'video' : 'image',
          tags: req.body.tags ? req.body.tags.split(',') : []
        });

        processedFiles.push({
          url: cloudinaryResult.url,
          public_id: cloudinaryResult.public_id,
          resource_type: cloudinaryResult.resource_type,
          format: cloudinaryResult.format,
          size: cloudinaryResult.size,
          width: cloudinaryResult.width,
          height: cloudinaryResult.height,
          originalName: file.originalname,
          mimetype: file.mimetype,
          storageType: 'cloudinary'
        });
      } else if (fileType === 'pdf') {
        // Save PDF locally
        const filename = `pdf-${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
        const filepath = path.join('uploads', filename);
        
        // Ensure uploads directory exists
        if (!fs.existsSync('uploads')) {
          fs.mkdirSync('uploads', { recursive: true });
        }
        
        // Write buffer to file
        fs.writeFileSync(filepath, file.buffer);
        
        processedFiles.push({
          url: `/uploads/${filename}`,
          public_id: `local_${Date.now()}_${Math.round(Math.random() * 1E9)}`,
          resource_type: 'raw',
          format: 'pdf',
          size: file.size,
          width: null,
          height: null,
          originalName: file.originalname,
          mimetype: file.mimetype,
          storageType: 'local',
          filepath: filepath
        });
      }
    }

    req.processedFiles = processedFiles;
    next();
  } catch (error) {
    next(error);
  }
};

// Clean up temporary files
export const cleanupTempFiles = (req, res, next) => {
  res.on('finish', () => {
    if (req.processedFiles) {
      req.processedFiles.forEach(file => {
        if (file.storageType === 'local' && file.filepath && fs.existsSync(file.filepath)) {
          // Only clean up if there was an error or if explicitly requested
          // For successful uploads, we keep the files
        }
      });
    }
  });
  
  next();
};

// Delete from Cloudinary
export const deleteFromCloudinary = async (publicId, resourceType = 'image') => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType
    });
    return result;
  } catch (error) {
    console.error('Error deleting file from Cloudinary:', error);
    throw error;
  }
};

// Delete local file
export const deleteLocalFile = async (filepath) => {
  try {
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error deleting local file:', error);
    throw error;
  }
};

// Convenience functions for common upload patterns
export const uploadSingle = (fieldName) => smartUpload(fieldName, 1);
export const uploadMultiple = (fieldName, maxCount = 10) => smartUpload(fieldName, maxCount);
export const uploadFields = (fields) => {
  return smartUpload('files', 10); // This is a simplified version
};

export default {
  cloudinaryUpload,
  pdfUpload,
  smartUpload,
  uploadSingle,
  uploadMultiple,
  uploadFields,
  processUploadedFiles,
  validateFileType,
  cleanupTempFiles,
  uploadToCloudinary,
  deleteFromCloudinary,
  deleteLocalFile,
  getFileType
};