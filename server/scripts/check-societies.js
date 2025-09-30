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
    // Find all societies
    const societies = await Society.find({});
    console.log('Existing societies:');
    societies.forEach(society => {
      console.log(`- ${society.name} (ID: ${society._id})`);
    });
    
    // Find society with name containing 'qwqwqw'
    const qwqwqwSociety = await Society.findOne({ name: /qwqwqw/i });
    if (qwqwqwSociety) {
      console.log('\nFound qwqwqw society:', qwqwqwSociety.name, 'ID:', qwqwqwSociety._id);
      
      // Check members for this society
      const members = await Profile.find({ companyName: qwqwqwSociety._id });
      console.log('Members count:', members.length);
      members.forEach(member => {
        console.log(`- Member: ${member.role}, Status: ${member.status}, User: ${member.user}`);
      });
    } else {
      console.log('\nNo society found with qwqwqw in name');
    }
    
    // Check all profiles
    const allProfiles = await Profile.find({});
    console.log('\nAll profiles:');
    allProfiles.forEach(profile => {
      console.log(`- Profile: ${profile.role}, Company: ${profile.companyName}, Status: ${profile.status}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.connection.close();
  }
});
