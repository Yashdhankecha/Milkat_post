import mongoose from 'mongoose';
import User from '../models/User.js';
import Society from '../models/Society.js';

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/nestly_estate');
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Test field mapping
const testFieldMapping = async () => {
  try {
    console.log('Testing society field mapping...');

    // Get a test society
    const society = await Society.findOne({ name: 'Green Valley Society' });
    if (!society) {
      console.error('Test society not found. Please run seedData.js first.');
      return;
    }

    console.log('Original society data from database:');
    console.log({
      name: society.name,
      societyType: society.societyType,
      totalArea: society.totalArea,
      totalFlats: society.totalFlats,
      yearBuilt: society.yearBuilt,
      contactPersonName: society.contactPersonName,
      contactPhone: society.contactPhone,
      contactEmail: society.contactEmail
    });

    // Test the transformation
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

    console.log('\nTransformed society data for frontend:');
    console.log({
      name: transformedSociety.name,
      society_type: transformedSociety.society_type,
      total_area: transformedSociety.total_area,
      total_flats: transformedSociety.total_flats,
      year_built: transformedSociety.year_built,
      contact_person_name: transformedSociety.contact_person_name,
      contact_phone: transformedSociety.contact_phone,
      contact_email: transformedSociety.contact_email
    });

    console.log('\n✅ Field mapping test completed successfully!');

  } catch (error) {
    console.error('❌ Error testing field mapping:', error.message);
  }
};

// Run the test
const runTest = async () => {
  await connectDB();
  await testFieldMapping();
  await mongoose.connection.close();
  console.log('Database connection closed');
  process.exit(0);
};

runTest();
