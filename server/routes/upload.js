import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { uploadSingle, uploadMultiple, processUploadedFiles, cleanupTempFiles } from '../middleware/upload.js';
import { catchAsync } from '../middleware/errorHandler.js';

const router = express.Router();

// Upload single image
router.post('/image',
  authenticate,
  uploadSingle('image'),
  processUploadedFiles,
  cleanupTempFiles,
  catchAsync(async (req, res) => {
    if (!req.uploadedFiles || req.uploadedFiles.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'No image uploaded'
      });
    }

    const uploadedFile = req.uploadedFiles[0];

    res.status(200).json({
      status: 'success',
      message: 'Image uploaded successfully',
      data: {
        url: uploadedFile.url,
        filename: uploadedFile.filename,
        size: uploadedFile.size,
        mimetype: uploadedFile.mimetype
      }
    });
  })
);

// Upload multiple images
router.post('/images',
  authenticate,
  uploadMultiple('images', 10),
  processUploadedFiles,
  cleanupTempFiles,
  catchAsync(async (req, res) => {
    if (!req.uploadedFiles || req.uploadedFiles.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'No images uploaded'
      });
    }

    const uploadedFiles = req.uploadedFiles.map(file => ({
      url: file.url,
      filename: file.filename,
      size: file.size,
      mimetype: file.mimetype
    }));

    res.status(200).json({
      status: 'success',
      message: 'Images uploaded successfully',
      data: {
        files: uploadedFiles,
        count: uploadedFiles.length
      }
    });
  })
);

// Upload document (PDF, etc.)
router.post('/document',
  authenticate,
  uploadSingle('document'),
  processUploadedFiles,
  cleanupTempFiles,
  catchAsync(async (req, res) => {
    if (!req.uploadedFiles || req.uploadedFiles.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'No document uploaded'
      });
    }

    const uploadedFile = req.uploadedFiles[0];

    res.status(200).json({
      status: 'success',
      message: 'Document uploaded successfully',
      data: {
        url: uploadedFile.url,
        filename: uploadedFile.filename,
        size: uploadedFile.size,
        mimetype: uploadedFile.mimetype
      }
    });
  })
);

// Upload profile picture
router.post('/profile-picture',
  authenticate,
  uploadSingle('profilePicture'),
  processUploadedFiles,
  cleanupTempFiles,
  catchAsync(async (req, res) => {
    if (!req.uploadedFiles || req.uploadedFiles.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'No profile picture uploaded'
      });
    }

    const uploadedFile = req.uploadedFiles[0];

    // Update user profile with new picture URL
    const Profile = (await import('../models/Profile.js')).default;
    await Profile.findOneAndUpdate(
      { user: req.user._id },
      { profilePicture: uploadedFile.url },
      { new: true }
    );

    res.status(200).json({
      status: 'success',
      message: 'Profile picture uploaded successfully',
      data: {
        url: uploadedFile.url,
        filename: uploadedFile.filename
      }
    });
  })
);

// Upload property images
router.post('/property-images',
  authenticate,
  authorize('buyer_seller', 'broker', 'developer', 'society_owner'),
  uploadMultiple('images', 20),
  processUploadedFiles,
  cleanupTempFiles,
  catchAsync(async (req, res) => {
    if (!req.uploadedFiles || req.uploadedFiles.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'No images uploaded'
      });
    }

    const uploadedFiles = req.uploadedFiles.map((file, index) => ({
      url: file.url,
      filename: file.filename,
      size: file.size,
      mimetype: file.mimetype,
      isPrimary: index === 0 // First image is primary by default
    }));

    res.status(200).json({
      status: 'success',
      message: 'Property images uploaded successfully',
      data: {
        images: uploadedFiles,
        count: uploadedFiles.length
      }
    });
  })
);

// Upload project images
router.post('/project-images',
  authenticate,
  authorize('developer'),
  uploadMultiple('images', 20),
  processUploadedFiles,
  cleanupTempFiles,
  catchAsync(async (req, res) => {
    if (!req.uploadedFiles || req.uploadedFiles.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'No images uploaded'
      });
    }

    const uploadedFiles = req.uploadedFiles.map((file, index) => ({
      url: file.url,
      filename: file.filename,
      size: file.size,
      mimetype: file.mimetype,
      isPrimary: index === 0 // First image is primary by default
    }));

    res.status(200).json({
      status: 'success',
      message: 'Project images uploaded successfully',
      data: {
        images: uploadedFiles,
        count: uploadedFiles.length
      }
    });
  })
);

// Upload verification documents
router.post('/verification-documents',
  authenticate,
  uploadMultiple('documents', 5),
  processUploadedFiles,
  cleanupTempFiles,
  catchAsync(async (req, res) => {
    if (!req.uploadedFiles || req.uploadedFiles.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'No documents uploaded'
      });
    }

    const uploadedFiles = req.uploadedFiles.map(file => ({
      url: file.url,
      filename: file.filename,
      size: file.size,
      mimetype: file.mimetype
    }));

    res.status(200).json({
      status: 'success',
      message: 'Verification documents uploaded successfully',
      data: {
        documents: uploadedFiles,
        count: uploadedFiles.length
      }
    });
  })
);

// Upload society images
router.post('/society-images',
  authenticate,
  authorize('society_owner'),
  uploadMultiple('images', 15),
  processUploadedFiles,
  cleanupTempFiles,
  catchAsync(async (req, res) => {
    if (!req.uploadedFiles || req.uploadedFiles.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'No images uploaded'
      });
    }

    const uploadedFiles = req.uploadedFiles.map((file, index) => ({
      url: file.url,
      filename: file.filename,
      size: file.size,
      mimetype: file.mimetype,
      isPrimary: index === 0 // First image is primary by default
    }));

    res.status(200).json({
      status: 'success',
      message: 'Society images uploaded successfully',
      data: {
        images: uploadedFiles,
        count: uploadedFiles.length
      }
    });
  })
);

// Upload floor plans
router.post('/floor-plans',
  authenticate,
  authorize('developer', 'society_owner'),
  uploadMultiple('floorPlans', 10),
  processUploadedFiles,
  cleanupTempFiles,
  catchAsync(async (req, res) => {
    if (!req.uploadedFiles || req.uploadedFiles.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'No floor plans uploaded'
      });
    }

    const uploadedFiles = req.uploadedFiles.map(file => ({
      url: file.url,
      filename: file.filename,
      size: file.size,
      mimetype: file.mimetype
    }));

    res.status(200).json({
      status: 'success',
      message: 'Floor plans uploaded successfully',
      data: {
        floorPlans: uploadedFiles,
        count: uploadedFiles.length
      }
    });
  })
);

export default router;
