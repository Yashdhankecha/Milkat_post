import mongoose from 'mongoose';
import User from '../models/User.js';
import Profile from '../models/Profile.js';
import config from '../config-loader.js';

const fixUserRoles = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get all users with multiple profiles
    const users = await User.find({}).populate('profiles');
    
    for (const user of users) {
      const profiles = await Profile.find({ user: user._id, status: 'active' });
      
      if (profiles.length > 1) {
        console.log(`\nUser ${user.phone} has ${profiles.length} profiles:`);
        profiles.forEach(profile => {
          console.log(`  - ${profile.role} (${profile.companyName || 'No company'}) - Status: ${profile.status}`);
        });
        
        // Check if user has developer profile
        const developerProfile = profiles.find(p => p.role === 'developer');
        const brokerProfile = profiles.find(p => p.role === 'broker');
        
        if (developerProfile && brokerProfile) {
          console.log(`  ⚠️  User has both developer and broker profiles`);
          console.log(`  📝 Developer profile: ${developerProfile.companyName || 'No company'}`);
          console.log(`  📝 Broker profile: ${brokerProfile.companyName || 'No company'}`);
        }
      }
    }

    console.log('\n✅ Profile analysis complete');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

fixUserRoles();
