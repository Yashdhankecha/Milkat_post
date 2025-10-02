import express from 'express';
import { body, validationResult } from 'express-validator';
import Society from '../models/Society.js';
import Profile from '../models/Profile.js';
import User from '../models/User.js';
import SocietyMember from '../models/SocietyMember.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { catchAsync } from '../middleware/errorHandler.js';

const router = express.Router();

// Validation middleware
const validateRequest = (req, res, next) => {
  console.log('Running validation on request body:', JSON.stringify(req.body, null, 2));
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('Validation errors found:', errors.array());
    return res.status(400).json({
      status: 'error',
      message: 'Validation failed',
      errors: errors.array().map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value
      }))
    });
  }
  console.log('Validation passed successfully');
  next();
};

// Get all societies with filters
router.get('/',
  catchAsync(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    const filters = {
      city: req.query.city,
      state: req.query.state,
      societyType: req.query.societyType,
      status: req.query.status || 'active'
    };

    const societies = await Society.searchSocieties(filters, page, limit);
    const total = await Society.countDocuments(filters);

    res.status(200).json({
      status: 'success',
      data: {
        societies,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  })
);

// Get society by ID
router.get('/:id',
  catchAsync(async (req, res) => {
    const society = await Society.findById(req.params.id)
      .populate('owner', 'phone profile');

    if (!society) {
      return res.status(404).json({
        status: 'error',
        message: 'Society not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: { society }
    });
  })
);

// Create new society
router.post('/',
  authenticate,
  [
    body('name')
      .trim()
      .isLength({ min: 5, max: 200 })
      .withMessage('Society name must be between 5 and 200 characters'),
    body('address')
      .trim()
      .isLength({ min: 5, max: 500 })
      .withMessage('Address must be between 5 and 500 characters'),
    body('city')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('City must be between 2 and 100 characters'),
    body('state')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('State must be between 2 and 100 characters'),
    body('total_flats')
      .isNumeric()
      .withMessage('Total flats must be a number')
      .custom((value) => {
        const num = parseInt(value);
        if (isNaN(num) || num < 1) {
          throw new Error('Total flats must be a positive integer');
        }
        return true;
      }),
    body('society_type')
      .optional()
      .isIn(['Apartment', 'Villa', 'Row House', 'Bungalow', 'Duplex', 'Penthouse', 'Studio', 'Independent House'])
      .withMessage('Invalid society type'),
    body('number_of_blocks')
      .optional()
      .custom((value) => {
        if (value === undefined || value === null || value === '') return true;
        const num = parseInt(value);
        if (isNaN(num) || num < 1) {
          throw new Error('Number of blocks must be a positive integer');
        }
        return true;
      }),
    body('total_area')
      .optional()
      .custom((value) => {
        if (value === undefined || value === null || value === '') return true;
        const num = parseFloat(value);
        if (isNaN(num) || num < 0) {
          throw new Error('Total area must be a positive number');
        }
        return true;
      }),
    body('year_built')
      .optional()
      .custom((value) => {
        if (value === undefined || value === null || value === '') return true;
        const num = parseInt(value);
        const currentYear = new Date().getFullYear();
        if (isNaN(num) || num < 1900 || num > currentYear) {
          throw new Error('Year built must be a valid year between 1900 and ' + currentYear);
        }
        return true;
      }),
    body('fsi')
      .optional()
      .custom((value) => {
        if (value === undefined || value === null || value === '') return true;
        const num = parseFloat(value);
        if (isNaN(num) || num < 0) {
          throw new Error('FSI must be a positive number');
        }
        return true;
      }),
    body('road_facing')
      .optional()
      .isIn(['main', 'arterial', 'collector', 'local', 'corner'])
      .withMessage('Invalid road facing value'),
    body('condition_status')
      .optional()
      .isIn(['excellent', 'good', 'fair', 'poor', 'critical'])
      .withMessage('Invalid condition status'),
    body('amenities')
      .optional()
      .isArray()
      .withMessage('Amenities must be an array'),
    body('flat_variants')
      .optional()
      .isArray()
      .withMessage('Flat variants must be an array')
      .custom((value) => {
        if (!Array.isArray(value)) return true;
        for (let i = 0; i < value.length; i++) {
          const variant = value[i];
          if (!variant.name || typeof variant.name !== 'string') {
            throw new Error(`Flat variant ${i + 1} must have a valid name`);
          }
          if (variant.area !== undefined && variant.area !== null && variant.area !== '') {
            const area = parseFloat(variant.area);
            if (isNaN(area) || area < 0) {
              throw new Error(`Flat variant ${i + 1} area must be a positive number`);
            }
          }
          if (variant.bathrooms !== undefined && variant.bathrooms !== null && variant.bathrooms !== '') {
            const bathrooms = parseInt(variant.bathrooms);
            if (isNaN(bathrooms) || bathrooms < 0) {
              throw new Error(`Flat variant ${i + 1} bathrooms must be a non-negative integer`);
            }
          }
        }
        return true;
      }),
    body('contact_person_name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Contact person name must be between 2 and 100 characters'),
    body('contact_phone')
      .optional()
      .custom((value) => {
        if (value === undefined || value === null || value === '') return true;
        // Basic phone number validation - allow various formats
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        if (!phoneRegex.test(value.replace(/[\s\-\(\)]/g, ''))) {
          throw new Error('Contact phone must be a valid phone number');
        }
        return true;
      }),
    body('contact_email')
      .optional()
      .isEmail()
      .withMessage('Contact email must be a valid email address'),
    body('registration_documents')
      .optional()
      .isArray()
      .withMessage('Registration documents must be an array')
      .custom((value) => {
        if (value === undefined || value === null) return true;
        return Array.isArray(value);
      }),
    body('flat_plan_documents')
      .optional()
      .isArray()
      .withMessage('Flat plan documents must be an array')
      .custom((value) => {
        if (value === undefined || value === null) return true;
        return Array.isArray(value);
      })
  ],
  validateRequest,
  catchAsync(async (req, res) => {
    console.log('Society creation request received:');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('User:', req.user ? req.user._id : 'No user');
    console.log('Document arrays:', {
      registration_documents: req.body.registration_documents,
      flat_plan_documents: req.body.flat_plan_documents,
      registration_type: typeof req.body.registration_documents,
      flat_plan_type: typeof req.body.flat_plan_documents
    });
    
    try {
      // FIX: Remove any _id field from request body to prevent ObjectId casting errors
      delete req.body._id;
      delete req.body.id;
      
      console.log('Sanitized request body (removed _id/id):', JSON.stringify(req.body, null, 2));
    
    const userId = req.user._id;
    
    const Profile = (await import('../models/Profile.js')).default;
    
    // Check if user has society_owner role, if not create it
    let profile = await Profile.findOne({ user: req.user._id, role: 'society_owner' });
    
    if (!profile) {
      // Create society_owner role for the user
      profile = new Profile({
        user: req.user._id,
        role: 'society_owner',
        fullName: req.body.contact_person_name || req.user.phone,
        companyName: req.body.name,
        status: 'active',
        verificationStatus: 'verified'
      });
      
      await profile.save();
      
      // Update user's current role to society_owner
      req.user.currentRole = 'society_owner';
      req.user.activeRole = 'society_owner';
      await req.user.save();
      
      console.log(`Created society_owner role for user ${req.user._id}`);
    }

    // Map frontend field names to backend model field names
    const societyData = {
      name: req.body.name,
      address: req.body.address,
      city: req.body.city,
      state: req.body.state,
      pincode: req.body.pincode || null,
      societyType: req.body.society_type || 'Apartment',
      totalArea: req.body.total_area ? parseFloat(req.body.total_area) : null,
      totalFlats: parseInt(req.body.total_flats),
      numberOfBlocks: req.body.number_of_blocks ? parseInt(req.body.number_of_blocks) : null,
      yearBuilt: req.body.year_built ? parseInt(req.body.year_built) : null,
      registrationDate: req.body.registration_date ? new Date(req.body.registration_date) : null,
      fsi: req.body.fsi ? parseFloat(req.body.fsi) : null,
      roadFacing: req.body.road_facing || null,
      conditionStatus: req.body.condition_status || 'good',
      amenities: req.body.amenities || [],
      contactPersonName: req.body.contact_person_name || null,
      contactPhone: req.body.contact_phone || null,
      contactEmail: req.body.contact_email || null,
      flatVariants: req.body.flat_variants || [],
      flatPlanDocuments: req.body.flat_plan_documents || [],
      registrationDocuments: req.body.registration_documents || [],
      owner: userId
    };

    const society = new Society(societyData);
    await society.save();

    console.log('Society created successfully:', society._id);

    // Transform field names from backend camelCase to frontend snake_case
    const transformedSociety = {
      ...society.toObject(),
      society_type: society.societyType,
      number_of_blocks: society.numberOfBlocks,
      total_area: society.totalArea,
      total_flats: society.totalFlats,
      year_built: society.yearBuilt,
      registration_date: society.registrationDate,
      condition_status: society.conditionStatus,
      contact_person_name: society.contactPersonName,
      contact_phone: society.contactPhone,
      contact_email: society.contactEmail,
      society_code: society.societyCode,
      flat_variants: society.flatVariants,
      registration_documents: society.registrationDocuments,
      flat_plan_documents: society.flatPlanDocuments,
      created_at: society.createdAt
    };

    res.status(201).json({
      status: 'success',
      message: 'Society created successfully',
      data: { 
        society: transformedSociety,
        roleCreated: !profile._id // Indicate if role was just created
      }
    });
    
    } catch (error) {
      console.error('Society creation error:', error);
      
      // Handle Mongoose validation errors
      if (error.name === 'ValidationError') {
        const validationErrors = Object.values(error.errors).map((err) => ({
          field: err.path,
          message: err.message,
          value: err.value
        }));
        
        return res.status(400).json({
          status: 'error',
          message: 'Validation failed',
          errors: validationErrors,
          details: 'Please check the required fields and try again'
        });
      }
      
      // Handle duplicate key errors
      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0];
        return res.status(400).json({
          status: 'error',
          message: 'Duplicate entry',
          field: field,
          details: `${field} already exists. Please use a different value.`
        });
      }
      
      res.status(500).json({
        status: 'error',
        message: 'Failed to create society',
        error: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  })
);

// Update society
router.put('/:id',
  authenticate,
  [
    body('name')
      .optional()
      .trim()
      .isLength({ min: 5, max: 200 })
      .withMessage('Society name must be between 5 and 200 characters'),
    body('address')
      .optional()
      .trim()
      .isLength({ min: 5, max: 500 })
      .withMessage('Address must be between 5 and 500 characters')
  ],
  validateRequest,
  catchAsync(async (req, res) => {
    console.log('Society update request received:');
    console.log('Society ID:', req.params.id);
    console.log('User:', req.user ? req.user._id : 'No user');
    
    // Debug document updates
    if (req.body.registration_documents || req.body.flat_plan_documents) {
      console.log('=== DOCUMENT UPDATE DEBUG ===');
      console.log('Registration documents in request:', req.body.registration_documents);
      console.log('Flat plan documents in request:', req.body.flat_plan_documents);
    }
    
    // FIX: Remove any _id field from request body to prevent ObjectId casting errors
    delete req.body._id;
    delete req.body.id;
    
    console.log('Sanitized request body (removed _id/id):', JSON.stringify(req.body, null, 2));

    const society = await Society.findById(req.params.id);

    if (!society) {
      return res.status(404).json({
        status: 'error',
        message: 'Society not found'
      });
    }

    // Check ownership or admin role
    if (society.owner.toString() !== req.user._id.toString() && req.profile.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. You can only update your own societies.'
      });
    }

    const allowedUpdates = [
      'name', 'address', 'city', 'state', 'pincode', 'coordinates', 'societyType',
      'totalArea', 'totalFlats', 'numberOfBlocks', 'yearBuilt', 'registrationDate',
      'fsi', 'roadFacing', 'conditionStatus', 'amenities', 'contactPersonName',
      'contactPhone', 'contactEmail', 'status', 'registrationDocuments', 'flatPlanDocuments',
      'registration_documents', 'flat_plan_documents', 'flatVariants'
    ];

    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        // Map snake_case to camelCase for database fields
        if (key === 'registration_documents') {
          updates.registrationDocuments = req.body[key];
        } else if (key === 'flat_plan_documents') {
          updates.flatPlanDocuments = req.body[key];
        } else {
          updates[key] = req.body[key];
        }
      }
    });

    let updatedSociety;
    try {
      updatedSociety = await Society.findByIdAndUpdate(
        req.params.id,
        updates,
        { new: true, runValidators: true }
      );
      
      if (!updatedSociety) {
        return res.status(404).json({
          status: 'error',
          message: 'Society not found after update'
        });
      }
    } catch (updateError) {
      console.error('Society update error:', updateError);
      return res.status(500).json({
        status: 'error',
        message: 'Failed to update society',
        error: updateError.message
      });
    }
    
    // Debug document updates
    if (updates.registrationDocuments || updates.flatPlanDocuments) {
      console.log('=== AFTER UPDATE DEBUG ===');
      console.log('Updated society registrationDocuments:', updatedSociety.registrationDocuments);
      console.log('Updated society flatPlanDocuments:', updatedSociety.flatPlanDocuments);
    }

    // Transform field names from backend camelCase to frontend snake_case
    const transformedSociety = {
      ...updatedSociety.toObject(),
      society_type: updatedSociety.societyType,
      number_of_blocks: updatedSociety.numberOfBlocks,
      total_area: updatedSociety.totalArea,
      total_flats: updatedSociety.totalFlats,
      year_built: updatedSociety.yearBuilt,
      registration_date: updatedSociety.registrationDate,
      condition_status: updatedSociety.conditionStatus,
      contact_person_name: updatedSociety.contactPersonName,
      contact_phone: updatedSociety.contactPhone,
      contact_email: updatedSociety.contactEmail,
      society_code: updatedSociety.societyCode,
      flat_variants: updatedSociety.flatVariants,
      registration_documents: updatedSociety.registrationDocuments,
      flat_plan_documents: updatedSociety.flatPlanDocuments,
      created_at: updatedSociety.createdAt
    };

    res.status(200).json({
      status: 'success',
      message: 'Society updated successfully',
      data: { society: transformedSociety }
    });
  })
);

// Delete society
router.delete('/:id',
  authenticate,
  catchAsync(async (req, res) => {
    const society = await Society.findById(req.params.id);

    if (!society) {
      return res.status(404).json({
        status: 'error',
        message: 'Society not found'
      });
    }

    // Check ownership or admin role
    if (society.owner.toString() !== req.user._id.toString() && req.profile.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. You can only delete your own societies.'
      });
    }

    await Society.findByIdAndDelete(req.params.id);

    res.status(200).json({
      status: 'success',
      message: 'Society deleted successfully'
    });
  })
);

// Get user's societies (owned + member)
router.get('/my/societies',
  authenticate,
  catchAsync(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Get societies where user is owner
    const ownedSocieties = await Society.find({ owner: req.user._id })
      .sort({ createdAt: -1 })
      .lean();

    // Get societies where user is a member
    const memberRecords = await SocietyMember.find({ 
      user: req.user._id,
      status: 'active'
    })
      .populate('society')
      .sort({ joinedAt: -1 })
      .lean();

    // Extract society objects from member records
    const memberSocieties = memberRecords
      .filter(record => record.society) // Filter out null societies
      .map(record => ({
        ...record.society,
        membershipRole: record.role, // Add membership role info
        joinedAt: record.joinedAt
      }));

    // Combine both arrays and remove duplicates (in case user owns a society they're also a member of)
    const societyMap = new Map();
    
    // Add owned societies first
    ownedSocieties.forEach(society => {
      societyMap.set(society._id.toString(), {
        ...society,
        isOwner: true
      });
    });

    // Add member societies (won't override if already exists as owner)
    memberSocieties.forEach(society => {
      const societyId = society._id.toString();
      if (!societyMap.has(societyId)) {
        societyMap.set(societyId, {
          ...society,
          isOwner: false,
          isMember: true
        });
      } else {
        // User is both owner and member, update the record
        const existing = societyMap.get(societyId);
        societyMap.set(societyId, {
          ...existing,
          isMember: true,
          membershipRole: society.membershipRole
        });
      }
    });

    // Convert map to array and sort by creation date
    const allSocieties = Array.from(societyMap.values())
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Transform field names from backend camelCase to frontend snake_case
    const transformedSocieties = allSocieties.map(society => ({
      ...society,
      society_type: society.societyType,
      number_of_blocks: society.numberOfBlocks,
      total_area: society.totalArea,
      total_flats: society.totalFlats,
      year_built: society.yearBuilt,
      registration_date: society.registrationDate,
      condition_status: society.conditionStatus,
      contact_person_name: society.contactPersonName,
      contact_phone: society.contactPhone,
      contact_email: society.contactEmail,
      society_code: society.societyCode,
      flat_variants: society.flatVariants,
      registration_documents: society.registrationDocuments,
      flat_plan_documents: society.flatPlanDocuments,
      created_at: society.createdAt
    }));

    // Apply pagination
    const total = transformedSocieties.length;
    const paginatedSocieties = transformedSocieties.slice(skip, skip + limit);

    res.status(200).json({
      status: 'success',
      data: {
        societies: paginatedSocieties,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  })
);

// Get society members
router.get('/:id/members',
  authenticate,
  catchAsync(async (req, res) => {
    const { id: societyId } = req.params;
    
    // Verify the user has access to this society (either owner or member)
    const society = await Society.findById(societyId);
    if (!society) {
      return res.status(404).json({
        status: 'error',
        message: 'Society not found'
      });
    }

    // Check if user is the owner or a member
    const userProfile = await Profile.findOne({
      user: req.user._id,
      companyName: societyId,
      status: 'active'
    });

    if (!userProfile && society.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. You are not a member of this society.'
      });
    }

    // Get all active members of the society using SocietyMember
    const societyMembers = await SocietyMember.find({
      society: societyId,
      status: 'active'
    }).populate('user', 'phone email isVerified lastLogin');

    // Get the society owner
    const owner = await User.findById(society.owner).select('phone email isVerified lastLogin');
    
    // Get profiles for all users to get their names
    const userIds = societyMembers.map(member => member.user._id);
    if (owner) {
      userIds.push(owner._id);
    }
    
    const profiles = await Profile.find({
      user: { $in: userIds }
    }).select('user fullName profilePicture');
    
    // Create a map of user ID to profile for quick lookup
    const profileMap = new Map();
    profiles.forEach(profile => {
      profileMap.set(profile.user.toString(), profile);
    });

    // Format the response
    const members = societyMembers.map(member => {
      const profile = profileMap.get(member.user._id.toString());
      return {
        id: member._id,
        userId: member.user._id,
        phone: member.user.phone,
        email: member.user.email,
        fullName: profile?.fullName || null,
        profilePicture: profile?.profilePicture || null,
        role: member.role,
        status: member.status,
        joinedAt: member.joinedAt,
        isOwner: false
      };
    });

    // Add the society owner to the members list if they exist
    if (owner) {
      const ownerProfile = profileMap.get(owner._id.toString());
      members.unshift({
        id: `owner_${society.owner}`,
        userId: society.owner,
        phone: owner.phone,
        email: owner.email,
        fullName: ownerProfile?.fullName || null,
        profilePicture: ownerProfile?.profilePicture || null,
        role: 'society_owner',
        status: 'active',
        joinedAt: society.createdAt,
        isOwner: true
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        society: {
          id: society._id,
          name: society.name
        },
        members,
        total: members.length
      }
    });
  })
);

// Get society documents
router.get('/:id/documents',
  authenticate,
  catchAsync(async (req, res) => {
    const society = await Society.findById(req.params.id);

    if (!society) {
      return res.status(404).json({
        status: 'error',
        message: 'Society not found'
      });
    }

    // Check if user is owner or member
    const isOwner = society.owner.toString() === req.user._id.toString();
    const isMember = await SocietyMember.findOne({
      society: society._id,
      user: req.user._id,
      status: 'active'
    });

    if (!isOwner && !isMember) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. You can only view documents of societies you own or are a member of.'
      });
    }

    // Combine all documents with metadata
    const documents = [];

    // Add registration documents
    if (society.registrationDocuments && society.registrationDocuments.length > 0) {
      society.registrationDocuments.forEach((docItem, index) => {
        // Handle both string URLs (legacy) and document objects (new format)
        const docUrl = typeof docItem === 'string' ? docItem : docItem.url;
        const docName = typeof docItem === 'string' ? 
          (docItem.split('/').pop() || `Society Document ${index + 1}`) : 
          (docItem.name || docItem.url.split('/').pop() || `Society Document ${index + 1}`);
        const docMediaId = typeof docItem === 'object' ? docItem.mediaId : null;
        const docSize = typeof docItem === 'object' ? docItem.size : null;
        
        documents.push({
          id: `doc_${index}`,
          name: docName,
          type: 'society_document',
          url: docUrl,
          mediaId: docMediaId,
          uploadedAt: society.createdAt,
          size: docSize
        });
      });
    }

    // Add flat plan documents (for backward compatibility)
    if (society.flatPlanDocuments && society.flatPlanDocuments.length > 0) {
      society.flatPlanDocuments.forEach((docItem, index) => {
        // Handle both string URLs (legacy) and document objects (new format)
        const docUrl = typeof docItem === 'string' ? docItem : docItem.url;
        const docName = typeof docItem === 'string' ? 
          (docItem.split('/').pop() || `Society Document ${documents.length + index + 1}`) : 
          (docItem.name || docItem.url.split('/').pop() || `Society Document ${documents.length + index + 1}`);
        const docMediaId = typeof docItem === 'object' ? docItem.mediaId : null;
        const docSize = typeof docItem === 'object' ? docItem.size : null;
        
        documents.push({
          id: `doc_${documents.length + index}`,
          name: docName,
          type: 'society_document',
          url: docUrl,
          mediaId: docMediaId,
          uploadedAt: society.createdAt,
          size: docSize
        });
      });
    }

    
    res.status(200).json({
      status: 'success',
      data: {
        documents,
        total: documents.length
      }
    });
  })
);

export default router;
