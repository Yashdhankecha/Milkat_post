import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import User from '../models/User.js';
import Profile from '../models/Profile.js';
import Property from '../models/Property.js';
import Project from '../models/Project.js';
import Society from '../models/Society.js';
import Broker from '../models/Broker.js';
import Developer from '../models/Developer.js';
import { logger } from '../utils/logger.js';

// Load environment variables
dotenv.config();

// Supabase configuration
const supabaseUrl = 'https://xwpwkatpplinbtgoiayl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3cHdrYXRwcGxpbmJ0Z29pYXlsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY4MTM2NzUsImV4cCI6MjA3MjM4OTY3NX0.BlkGefwxmwhokAuK37zJm7nKC2beZF3x6gJB_rf8FXQ';

const supabase = createClient(supabaseUrl, supabaseKey);

// MongoDB connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    logger.info('MongoDB connected successfully');
  } catch (error) {
    logger.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Migration functions
const migrateUsers = async () => {
  logger.info('Starting user migration...');
  
  try {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*');

    if (error) {
      throw error;
    }

    logger.info(`Found ${profiles.length} profiles to migrate`);

    for (const profile of profiles) {
      try {
        // Create user
        const user = new User({
          _id: new mongoose.Types.ObjectId(profile.id),
          phone: profile.phone,
          email: profile.email || null,
          isVerified: true,
          isActive: profile.status !== 'suspended',
          isSuspended: profile.status === 'suspended',
          authMethod: 'phone',
          createdAt: new Date(profile.created_at),
          updatedAt: new Date(profile.updated_at)
        });

        await user.save();

        // Create profile
        const newProfile = new Profile({
          user: user._id,
          fullName: profile.full_name,
          bio: profile.bio,
          profilePicture: profile.profile_picture,
          role: profile.role,
          businessType: profile.business_type,
          companyName: profile.company_name,
          website: profile.website,
          socialMedia: profile.social_media || {},
          status: profile.status || 'active',
          verificationStatus: profile.verification_status || 'unverified',
          createdAt: new Date(profile.created_at),
          updatedAt: new Date(profile.updated_at)
        });

        await newProfile.save();

        logger.info(`Migrated user: ${profile.full_name} (${profile.role})`);
      } catch (error) {
        logger.error(`Error migrating user ${profile.id}:`, error.message);
      }
    }

    logger.info('User migration completed');
  } catch (error) {
    logger.error('User migration failed:', error);
  }
};

const migrateProperties = async () => {
  logger.info('Starting property migration...');
  
  try {
    const { data: properties, error } = await supabase
      .from('properties')
      .select('*');

    if (error) {
      throw error;
    }

    logger.info(`Found ${properties.length} properties to migrate`);

    for (const property of properties) {
      try {
        const newProperty = new Property({
          _id: new mongoose.Types.ObjectId(property.id),
          title: property.title,
          description: property.description,
          propertyType: property.property_type,
          listingType: property.listing_type,
          price: property.price,
          monthlyRent: property.monthly_rent,
          securityDeposit: property.security_deposit,
          maintenanceCost: property.maintenance_cost,
          area: property.area,
          location: {
            address: property.location,
            city: property.city,
            state: property.state,
            country: property.country || 'India'
          },
          amenities: property.amenities || [],
          furnishedStatus: property.furnished_status,
          availableFrom: property.available_from ? new Date(property.available_from) : null,
          leaseTerm: property.lease_term,
          minLeasePeriod: property.min_lease_period,
          images: property.images ? property.images.map(url => ({ url, isPrimary: false })) : [],
          videos: property.videos || [],
          owner: new mongoose.Types.ObjectId(property.owner_id),
          broker: property.broker_id ? new mongoose.Types.ObjectId(property.broker_id) : null,
          status: property.status,
          views: 0,
          likes: 0,
          inquiries: 0,
          createdAt: new Date(property.created_at),
          updatedAt: new Date(property.updated_at)
        });

        await newProperty.save();
        logger.info(`Migrated property: ${property.title}`);
      } catch (error) {
        logger.error(`Error migrating property ${property.id}:`, error.message);
      }
    }

    logger.info('Property migration completed');
  } catch (error) {
    logger.error('Property migration failed:', error);
  }
};

const migrateProjects = async () => {
  logger.info('Starting project migration...');
  
  try {
    const { data: projects, error } = await supabase
      .from('projects')
      .select('*');

    if (error) {
      throw error;
    }

    logger.info(`Found ${projects.length} projects to migrate`);

    for (const project of projects) {
      try {
        const newProject = new Project({
          _id: new mongoose.Types.ObjectId(project.id),
          name: project.name,
          description: project.description,
          builder: project.builder,
          developer: project.developer_id ? new mongoose.Types.ObjectId(project.developer_id) : null,
          projectType: project.project_type || 'residential',
          location: {
            address: project.location,
            city: project.location.split(',')[0] || '',
            state: project.location.split(',')[1] || '',
            country: 'India'
          },
          priceRange: {
            min: parseFloat(project.price_range.split('-')[0]) || 0,
            max: parseFloat(project.price_range.split('-')[1]) || 0,
            unit: 'lakh'
          },
          totalUnits: project.total_units,
          availableUnits: project.available_units,
          completionDate: project.completion_date ? new Date(project.completion_date) : null,
          amenities: project.amenities || [],
          images: project.images ? project.images.map(url => ({ url, isPrimary: false })) : [],
          videos: [],
          status: project.status,
          views: 0,
          inquiries: 0,
          createdAt: new Date(project.created_at),
          updatedAt: new Date(project.updated_at)
        });

        await newProject.save();
        logger.info(`Migrated project: ${project.name}`);
      } catch (error) {
        logger.error(`Error migrating project ${project.id}:`, error.message);
      }
    }

    logger.info('Project migration completed');
  } catch (error) {
    logger.error('Project migration failed:', error);
  }
};

const migrateSocieties = async () => {
  logger.info('Starting society migration...');
  
  try {
    const { data: societies, error } = await supabase
      .from('societies')
      .select('*');

    if (error) {
      throw error;
    }

    logger.info(`Found ${societies.length} societies to migrate`);

    for (const society of societies) {
      try {
        const newSociety = new Society({
          _id: new mongoose.Types.ObjectId(society.id),
          name: society.name,
          societyCode: society.society_code,
          address: society.address,
          city: society.city,
          state: society.state,
          pincode: society.pincode,
          societyType: society.society_type || 'residential',
          totalArea: society.total_area,
          totalFlats: society.total_flats,
          numberOfBlocks: society.number_of_blocks,
          yearBuilt: society.year_built,
          registrationDate: society.registration_date ? new Date(society.registration_date) : null,
          fsi: society.fsi,
          roadFacing: society.road_facing,
          conditionStatus: society.condition_status || 'good',
          amenities: society.amenities || [],
          contactPersonName: society.contact_person_name,
          contactPhone: society.contact_phone,
          contactEmail: society.contact_email,
          owner: new mongoose.Types.ObjectId(society.owner_id),
          flatVariants: society.flat_variants || [],
          flatPlanDocuments: society.flat_plan_documents || [],
          registrationDocuments: society.registration_documents || [],
          images: [],
          status: 'active',
          isVerified: false,
          verificationStatus: 'unverified',
          createdAt: new Date(society.created_at),
          updatedAt: new Date(society.updated_at)
        });

        await newSociety.save();
        logger.info(`Migrated society: ${society.name}`);
      } catch (error) {
        logger.error(`Error migrating society ${society.id}:`, error.message);
      }
    }

    logger.info('Society migration completed');
  } catch (error) {
    logger.error('Society migration failed:', error);
  }
};

const migrateBrokers = async () => {
  logger.info('Starting broker migration...');
  
  try {
    const { data: brokers, error } = await supabase
      .from('brokers')
      .select('*');

    if (error) {
      throw error;
    }

    logger.info(`Found ${brokers.length} brokers to migrate`);

    for (const broker of brokers) {
      try {
        const newBroker = new Broker({
          _id: new mongoose.Types.ObjectId(broker.id),
          user: new mongoose.Types.ObjectId(broker.user_id),
          licenseNumber: broker.license_number,
          yearsExperience: broker.years_experience,
          specialization: broker.specialization || [],
          commissionRate: broker.commission_rate || 2.5,
          officeAddress: broker.office_address ? {
            address: broker.office_address
          } : undefined,
          contactInfo: broker.contact_info || {},
          status: broker.status || 'active',
          verificationStatus: 'unverified',
          isVerified: false,
          createdAt: new Date(broker.created_at),
          updatedAt: new Date(broker.updated_at)
        });

        await newBroker.save();
        logger.info(`Migrated broker: ${broker.user_id}`);
      } catch (error) {
        logger.error(`Error migrating broker ${broker.id}:`, error.message);
      }
    }

    logger.info('Broker migration completed');
  } catch (error) {
    logger.error('Broker migration failed:', error);
  }
};

const migrateDevelopers = async () => {
  logger.info('Starting developer migration...');
  
  try {
    const { data: developers, error } = await supabase
      .from('developers')
      .select('*');

    if (error) {
      throw error;
    }

    logger.info(`Found ${developers.length} developers to migrate`);

    for (const developer of developers) {
      try {
        const newDeveloper = new Developer({
          _id: new mongoose.Types.ObjectId(developer.id),
          user: new mongoose.Types.ObjectId(developer.user_id),
          companyName: developer.company_name,
          companyDescription: developer.company_description,
          establishedYear: developer.established_year,
          website: developer.website,
          contactInfo: developer.contact_info || {},
          socialMedia: developer.social_media || {},
          status: developer.status || 'active',
          verificationStatus: developer.verification_status || 'unverified',
          isVerified: false,
          createdAt: new Date(developer.created_at),
          updatedAt: new Date(developer.updated_at)
        });

        await newDeveloper.save();
        logger.info(`Migrated developer: ${developer.company_name}`);
      } catch (error) {
        logger.error(`Error migrating developer ${developer.id}:`, error.message);
      }
    }

    logger.info('Developer migration completed');
  } catch (error) {
    logger.error('Developer migration failed:', error);
  }
};

// Main migration function
const runMigration = async () => {
  try {
    await connectDB();
    
    logger.info('Starting migration from Supabase to MongoDB...');
    
    // Clear existing data (optional - remove if you want to keep existing data)
    logger.info('Clearing existing data...');
    await User.deleteMany({});
    await Profile.deleteMany({});
    await Property.deleteMany({});
    await Project.deleteMany({});
    await Society.deleteMany({});
    await Broker.deleteMany({});
    await Developer.deleteMany({});
    
    // Run migrations
    await migrateUsers();
    await migrateProperties();
    await migrateProjects();
    await migrateSocieties();
    await migrateBrokers();
    await migrateDevelopers();
    
    logger.info('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    logger.error('Migration failed:', error);
    process.exit(1);
  }
};

// Run migration if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigration();
}

export { runMigration };
