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

// Test society creation
const testSocietyCreation = async () => {
  try {
    console.log('Testing society creation...');

    // Get a test user
    const testUser = await User.findOne({ phone: '+91886618928' });
    if (!testUser) {
      console.error('Test user not found. Please run seedData.js first.');
      return;
    }

    // Test data with potential _id field (should be sanitized)
    const testSocietyData = {
      _id: 'undefined', // This should cause the error if not sanitized
      name: 'Test Society for ObjectId Fix',
      address: 'Test Address',
      city: 'Test City',
      state: 'Test State',
      societyType: 'Apartment',
      totalFlats: 50,
      amenities: ['Parking', 'Security'],
      owner: testUser._id
    };

    console.log('Test data with _id field:', testSocietyData);

    // Simulate the sanitization that happens in the route
    delete testSocietyData._id;
    delete testSocietyData.id;

    console.log('Sanitized test data:', testSocietyData);

    // Try to create the society
    const society = new Society(testSocietyData);
    await society.save();

    console.log('✅ Society created successfully without ObjectId error!');
    console.log('Created society ID:', society._id);

    // Clean up - delete the test society
    await Society.findByIdAndDelete(society._id);
    console.log('✅ Test society cleaned up');

  } catch (error) {
    console.error('❌ Error testing society creation:', error.message);
    if (error.message.includes('Cast to ObjectId failed')) {
      console.error('❌ ObjectId casting error still exists!');
    }
  }
};

// Run the test
const runTest = async () => {
  await connectDB();
  await testSocietyCreation();
  await mongoose.connection.close();
  console.log('Database connection closed');
  process.exit(0);
};

runTest();
