import mongoose from 'mongoose';
import Society from '../models/Society.js';
import Profile from '../models/Profile.js';
import User from '../models/User.js';
import config from '../config-loader.js';

mongoose.connect(config.MONGODB_URI);
const db = mongoose.connection;

db.once('open', async () => {
  console.log('Connected to MongoDB');
  
  try {
    // Find the user
    const user = await User.findById('68d91bb55060ec78375e3d2d');
    if (!user) {
      console.log('User not found');
      return;
    }
    
    console.log('User found:', user.phone);
    
    // Find the society
    const society = await Society.findById('68dab9e1e9c3bac501ba52c1');
    if (!society) {
      console.log('Society not found');
      return;
    }
    
    console.log('Society found:', society.name);
    console.log('Society owner:', society.owner);
    
    // Check if society owner matches the user
    if (society.owner.toString() !== user._id.toString()) {
      console.log('User is not the owner of this society');
      console.log('Current owner:', society.owner);
      console.log('User ID:', user._id);
      return;
    }
    
    // Find the society_owner profile for this user
    const ownerProfile = await Profile.findOne({
      user: user._id,
      role: 'society_owner'
    });
    
    if (ownerProfile) {
      console.log('Current owner profile companyName:', ownerProfile.companyName);
      
      // Update the profile to point to the correct society
      ownerProfile.companyName = society._id;
      await ownerProfile.save();
      console.log('Updated owner profile companyName to:', society._id);
    } else {
      console.log('No society_owner profile found for this user');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.connection.close();
  }
});

