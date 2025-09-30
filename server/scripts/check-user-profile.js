import mongoose from 'mongoose';
import User from '../models/User.js';
import Profile from '../models/Profile.js';
import config from '../config-loader.js';

mongoose.connect(config.MONGODB_URI);
const db = mongoose.connection;

db.once('open', async () => {
  console.log('Connected to MongoDB');
  
  try {
    // Find the user with phone 8866189928
    const user = await User.findOne({ phone: '8866189928' });
    if (!user) {
      console.log('User 8866189928 not found');
      return;
    }
    
    console.log('User found:', user.phone, 'ID:', user._id);
    
    // Find all profiles for this user
    const profiles = await Profile.find({ user: user._id });
    console.log('\nAll profiles for this user:');
    profiles.forEach((profile, index) => {
      console.log(`${index + 1}. Role: ${profile.role}, Company: ${profile.companyName}, Status: ${profile.status}`);
    });
    
    // Find the society_owner profile specifically
    const ownerProfile = await Profile.findOne({
      user: user._id,
      role: 'society_owner'
    });
    
    if (ownerProfile) {
      console.log('\nSociety owner profile found:');
      console.log('- Role:', ownerProfile.role);
      console.log('- Company:', ownerProfile.companyName);
      console.log('- Status:', ownerProfile.status);
    } else {
      console.log('\nNo society_owner profile found for this user');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.connection.close();
  }
});
