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
    // Find the qwqwqw society
    const qwqwqwSociety = await Society.findOne({ name: /qwqwqw/i });
    if (!qwqwqwSociety) {
      console.log('qwqwqw society not found');
      return;
    }
    
    console.log('Found qwqwqw society:', qwqwqwSociety.name, 'ID:', qwqwqwSociety._id);
    
    // Check if there's already a society owner
    const existingOwner = await Profile.findOne({
      companyName: qwqwqwSociety._id,
      role: 'society_owner'
    });
    
    if (existingOwner) {
      console.log('Society owner already exists:', existingOwner.user);
    } else {
      console.log('No society owner found, creating one...');
      
      // Find a user to make the owner (or create one)
      let ownerUser = await User.findOne({ phone: '8866189928' });
      
      if (!ownerUser) {
        console.log('User 8866189928 not found, creating...');
        ownerUser = new User({
          phone: '8866189928',
          email: 'owner8866189928@example.com',
          isVerified: true,
          verificationCode: '123456',
          lastLogin: new Date()
        });
        await ownerUser.save();
        console.log('Created owner user:', ownerUser.phone);
      }
      
      // Create society owner profile
      const ownerProfile = new Profile({
        user: ownerUser._id,
        companyName: qwqwqwSociety._id,
        role: 'society_owner',
        status: 'active',
        phone: ownerUser.phone,
        joinedAt: new Date()
      });
      
      await ownerProfile.save();
      console.log('Created society owner profile for user:', ownerUser.phone);
      
      // Update the society to have this owner
      qwqwqwSociety.owner = ownerUser._id;
      await qwqwqwSociety.save();
      console.log('Updated society owner');
    }
    
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

