import mongoose from 'mongoose';
import User from '../models/User.js';
import Profile from '../models/Profile.js';
import Broker from '../models/Broker.js';
import Developer from '../models/Developer.js';
import { config } from 'dotenv';

// Load environment variables
config();

const convertToE164 = (phone) => {
  if (!phone) return phone;
  
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // If it's already in E.164 format (starts with +), return as is
  if (phone.startsWith('+')) {
    return phone;
  }
  
  // If it's a 10-digit Indian number, add +91
  if (cleaned.length === 10) {
    return `+91${cleaned}`;
  }
  
  // If it's an 11-digit number starting with 0, remove 0 and add +91
  if (cleaned.length === 11 && cleaned.startsWith('0')) {
    return `+91${cleaned.substring(1)}`;
  }
  
  // If it's a 12-digit number starting with 91, add +
  if (cleaned.length === 12 && cleaned.startsWith('91')) {
    return `+${cleaned}`;
  }
  
  // For other cases, return as is (might need manual review)
  return phone;
};

const migratePhoneNumbers = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    let totalUpdated = 0;

    // Migrate User phone numbers
    console.log('\n--- Migrating User phone numbers ---');
    const users = await User.find({});
    console.log(`Found ${users.length} users`);
    
    for (const user of users) {
      if (user.phone && !user.phone.startsWith('+')) {
        const newPhone = convertToE164(user.phone);
        if (newPhone !== user.phone) {
          await User.updateOne(
            { _id: user._id },
            { phone: newPhone }
          );
          console.log(`Updated user ${user._id}: ${user.phone} -> ${newPhone}`);
          totalUpdated++;
        }
      }
    }

    // Migrate Broker phone numbers
    console.log('\n--- Migrating Broker phone numbers ---');
    const brokers = await Broker.find({});
    console.log(`Found ${brokers.length} brokers`);
    
    for (const broker of brokers) {
      let updated = false;
      const updateData = {};
      
      if (broker.contactInfo?.phone && !broker.contactInfo.phone.startsWith('+')) {
        updateData['contactInfo.phone'] = convertToE164(broker.contactInfo.phone);
        updated = true;
      }
      
      if (broker.contactInfo?.alternatePhone && !broker.contactInfo.alternatePhone.startsWith('+')) {
        updateData['contactInfo.alternatePhone'] = convertToE164(broker.contactInfo.alternatePhone);
        updated = true;
      }
      
      if (updated) {
        await Broker.updateOne({ _id: broker._id }, { $set: updateData });
        console.log(`Updated broker ${broker._id}:`, updateData);
        totalUpdated++;
      }
    }

    // Migrate Developer phone numbers
    console.log('\n--- Migrating Developer phone numbers ---');
    const developers = await Developer.find({});
    console.log(`Found ${developers.length} developers`);
    
    for (const developer of developers) {
      let updated = false;
      const updateData = {};
      
      if (developer.contactInfo?.phone && !developer.contactInfo.phone.startsWith('+')) {
        updateData['contactInfo.phone'] = convertToE164(developer.contactInfo.phone);
        updated = true;
      }
      
      if (developer.contactInfo?.alternatePhone && !developer.contactInfo.alternatePhone.startsWith('+')) {
        updateData['contactInfo.alternatePhone'] = convertToE164(developer.contactInfo.alternatePhone);
        updated = true;
      }
      
      if (updated) {
        await Developer.updateOne({ _id: developer._id }, { $set: updateData });
        console.log(`Updated developer ${developer._id}:`, updateData);
        totalUpdated++;
      }
    }

    console.log(`\n--- Migration completed ---`);
    console.log(`Total records updated: ${totalUpdated}`);
    
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run migration if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migratePhoneNumbers();
}

export default migratePhoneNumbers;
