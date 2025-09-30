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
    // Find the user with phone 8866189928
    const ownerUser = await User.findOne({ phone: '8866189928' });
    if (!ownerUser) {
      console.log('User 8866189928 not found');
      return;
    }
    
    console.log('Found user:', ownerUser.phone, 'ID:', ownerUser._id);
    
    // Find their society owner profile
    const ownerProfile = await Profile.findOne({
      user: ownerUser._id,
      role: 'society_owner'
    });
    
    if (ownerProfile) {
      console.log('User is already owner of society:', ownerProfile.companyName);
    }
    
    // Find the qwqwqw society
    const qwqwqwSociety = await Society.findOne({ name: /qwqwqw/i });
    if (!qwqwqwSociety) {
      console.log('qwqwqw society not found');
      return;
    }
    
    console.log('Found qwqwqw society:', qwqwqwSociety.name, 'Current owner:', qwqwqwSociety.owner);
    
    // Update the qwqwqw society to have the correct owner
    qwqwqwSociety.owner = ownerUser._id;
    await qwqwqwSociety.save();
    console.log('Updated qwqwqw society owner to:', ownerUser._id);
    
    // Update the owner profile to point to qwqwqw society
    ownerProfile.companyName = qwqwqwSociety._id;
    await ownerProfile.save();
    console.log('Updated owner profile to point to qwqwqw society');
    
    // Check members count
    const members = await Profile.find({
      companyName: qwqwqwSociety._id,
      status: 'active'
    }).populate('user', 'phone email');
    
    console.log('\nSociety members:', members.length);
    members.forEach(member => {
      console.log(`- ${member.role}: ${member.user?.phone || 'No user'} (${member.status})`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.connection.close();
  }
});

