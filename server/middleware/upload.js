import multer from 'multer';
import path from 'path';
import { v2 as cloudinary } from 'cloudinary';
import { AppError } from './errorHandler.js';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure multer for local storage (fallback)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = process.env.ALLOWED_FILE_TYPES?.split(',') || [
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Invalid file type. Only images and PDFs are allowed.', 400), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB default
    files: 10 // Maximum 10 files
  }
});

// Upload to Cloudinary
export const uploadToCloudinary = async (file, folder = 'nestly-estate') => {
  try {
    const result = await cloudinary.uploader.upload(file.path, {
      folder: folder,
      resource_type: 'auto',
      quality: 'auto',
      fetch_format: 'auto'
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
      format: result.format,
      size: result.bytes
    };
  } catch (error) {
    throw new AppError('Failed to upload file to cloud storage', 500);
  }
};

// Delete from Cloudinary
export const deleteFromCloudinary = async (publicId) => {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Error deleting file from Cloudinary:', error);
  }
};

// Upload single file
export const uploadSingle = (fieldName) => {
  return upload.single(fieldName);
};

// Upload multiple files
export const uploadMultiple = (fieldName, maxCount = 10) => {
  return upload.array(fieldName, maxCount);
};

// Upload multiple fields
export const uploadFields = (fields) => {
  return upload.fields(fields);
};

// Process uploaded files
export const processUploadedFiles = async (req, res, next) => {
  try {
    if (!req.files && !req.file) {
      return next();
    }

    const uploadedFiles = [];

    // Handle single file
    if (req.file) {
      if (process.env.NODE_ENV === 'production' && process.env.CLOUDINARY_CLOUD_NAME) {
        const result = await uploadToCloudinary(req.file, 'nestly-estate');
        uploadedFiles.push(result);
      } else {
        // Local development
        uploadedFiles.push({
          url: `/uploads/${req.file.filename}`,
          filename: req.file.filename,
          originalName: req.file.originalname,
          size: req.file.size,
          mimetype: req.file.mimetype
        });
      }
    }

    // Handle multiple files
    if (req.files) {
      for (const file of req.files) {
        if (process.env.NODE_ENV === 'production' && process.env.CLOUDINARY_CLOUD_NAME) {
          const result = await uploadToCloudinary(file, 'nestly-estate');
          uploadedFiles.push(result);
        } else {
          // Local development
          uploadedFiles.push({
            url: `/uploads/${file.filename}`,
            filename: file.filename,
            originalName: file.originalname,
            size: file.size,
            mimetype: file.mimetype
          });
        }
      }
    }

    req.uploadedFiles = uploadedFiles;
    next();
  } catch (error) {
    next(error);
  }
};

// Validate image dimensions
export const validateImageDimensions = (minWidth = 100, minHeight = 100, maxWidth = 5000, maxHeight = 5000) => {
  return (req, res, next) => {
    if (!req.file && !req.files) {
      return next();
    }

    const files = req.files || [req.file];
    
    for (const file of files) {
      if (file.mimetype.startsWith('image/')) {
        // In a real implementation, you would use a library like 'sharp' or 'jimp'
        // to get image dimensions and validate them
        // For now, we'll just pass through
      }
    }

    next();
  };
};

// Clean up temporary files
export const cleanupTempFiles = (req, res, next) => {
  res.on('finish', () => {
    if (req.file && req.file.path) {
      const fs = require('fs');
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting temp file:', err);
      });
    }
    
    if (req.files) {
      const fs = require('fs');
      req.files.forEach(file => {
        if (file.path) {
          fs.unlink(file.path, (err) => {
            if (err) console.error('Error deleting temp file:', err);
          });
        }
      });
    }
  });
  
  next();
};

export default upload;
