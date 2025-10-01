import mongoose from 'mongoose';
import User from '../models/User.js';
import Society from '../models/Society.js';
import SocietyMember from '../models/SocietyMember.js';
import Query from '../models/Query.js';
import Profile from '../models/Profile.js';

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

// Test member queries functionality
const testMemberQueries = async () => {
  try {
    console.log('Testing member queries functionality...');

    // Get test users
    const societyOwner = await User.findOne({ phone: '+91886618928' });
    const societyMember = await User.findOne({ phone: '+919925500691' });
    
    if (!societyOwner || !societyMember) {
      console.error('Test users not found. Please run seedData.js first.');
      return;
    }

    // Get test society
    const society = await Society.findOne({ name: 'Green Valley Society' });
    if (!society) {
      console.error('Test society not found. Please run seedData.js first.');
      return;
    }

    console.log('Found test users and society:', {
      societyOwner: societyOwner.phone,
      societyMember: societyMember.phone,
      society: society.name
    });

    // Check if society member exists
    const membership = await SocietyMember.findOne({
      user: societyMember._id,
      society: society._id,
      status: 'active'
    });

    if (!membership) {
      console.error('Society membership not found for test member');
      return;
    }

    console.log('Society membership found:', {
      member: societyMember.phone,
      society: society.name,
      role: membership.role
    });

    // Get member profile
    const memberProfile = await Profile.findOne({
      user: societyMember._id,
      role: 'society_member'
    });

    if (!memberProfile) {
      console.error('Member profile not found for test member');
      return;
    }

    console.log('Member profile found:', {
      user: societyMember.phone,
      fullName: memberProfile.fullName,
      role: memberProfile.role
    });

    // Test creating a query
    const testQuery = {
      society: society._id,
      member: societyMember._id,
      memberProfile: memberProfile._id,
      queryText: 'Test query from member - Is the lift working properly?',
      category: 'maintenance',
      priority: 'medium',
      status: 'open'
    };

    console.log('Creating test query:', testQuery);

    const query = new Query(testQuery);
    await query.save();

    console.log('✅ Query created successfully!');
    console.log('Query ID:', query._id);
    console.log('Query text:', query.queryText);

    // Test retrieving queries for society
    const societyQueries = await Query.find({ society: society._id })
      .populate('member', 'phone')
      .populate('memberProfile', 'fullName');

    console.log('✅ Society queries retrieved successfully!');
    console.log('Total queries for society:', societyQueries.length);
    societyQueries.forEach((q, index) => {
      console.log(`Query ${index + 1}:`, {
        text: q.queryText.substring(0, 50) + '...',
        member: q.member?.phone,
        status: q.status,
        category: q.category
      });
    });

    // Clean up test query
    await Query.findByIdAndDelete(query._id);
    console.log('✅ Test query cleaned up');

  } catch (error) {
    console.error('❌ Error testing member queries:', error.message);
    if (error.message.includes('Cast to ObjectId failed')) {
      console.error('❌ ObjectId casting error in queries!');
    }
  }
};

// Run the test
const runTest = async () => {
  await connectDB();
  await testMemberQueries();
  await mongoose.connection.close();
  console.log('Database connection closed');
  process.exit(0);
};

runTest();
