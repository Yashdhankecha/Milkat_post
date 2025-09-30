import mongoose from 'mongoose';
import User from '../models/User.js';
import Profile from '../models/Profile.js';
import Society from '../models/Society.js';
import Invitation from '../models/Invitation.js';
import Notification from '../models/Notification.js';
import config from '../config-loader.js';

// Connect to MongoDB
mongoose.connect(config.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB for seeding specific user data');
});

// Specific user data
const targetPhone = '8866189928';
const targetEmail = 'user8866189928@example.com';

// Create or find the specific user
const createSpecificUser = async () => {
  console.log(`Creating/finding user with phone: ${targetPhone}`);
  
  let user = await User.findOne({ phone: targetPhone });
  
  if (!user) {
    user = new User({
      phone: targetPhone,
      email: targetEmail,
      isVerified: true,
      verificationCode: '123456',
      lastLogin: new Date()
    });
    
    await user.save();
    console.log(`✅ Created new user: ${targetPhone}`);
  } else {
    console.log(`✅ Found existing user: ${targetPhone}`);
  }
  
  return user;
};

// Create a society owned by this user
const createUserSociety = async (user) => {
  console.log(`Creating society for user: ${targetPhone}`);
  
  const society = new Society({
    name: 'Elite Gardens Apartments',
    societyType: 'Apartment',
    numberOfBlocks: 3,
    totalArea: 2500,
    registrationDate: new Date('2022-03-15'),
    address: '123 Elite Gardens, Sector 45',
    city: 'Gurgaon',
    state: 'Haryana',
    pincode: '122001',
    totalFlats: 45,
    yearBuilt: 2020,
    conditionStatus: 'excellent',
    amenities: ['Swimming Pool', 'Gym', 'Parking', 'Security', 'Garden Area', 'Club House'],
    flatVariants: [
      { name: '2 BHK', area: '850', bedrooms: 2, bathrooms: 2 },
      { name: '3 BHK', area: '1200', bedrooms: 3, bathrooms: 2 },
      { name: '4 BHK', area: '1500', bedrooms: 4, bathrooms: 3 }
    ],
    fsi: '2.5',
    roadFacing: 'main',
    contactPersonName: 'Rajesh Kumar',
    contactPhone: '9876543210',
    contactEmail: 'contact@elitegardens.com',
    owner: user._id,
    registrationDocuments: [],
    flatPlanDocuments: []
  });
  
  await society.save();
  console.log(`✅ Created society: ${society.name}`);
  
  // Create society owner profile
  const ownerProfile = new Profile({
    user: user._id,
    companyName: society._id,
    role: 'society_owner',
    status: 'active',
    phone: user.phone,
    joinedAt: new Date()
  });
  
  await ownerProfile.save();
  console.log(`✅ Created society owner profile`);
  
  return society;
};

// Create some members for the society
const createSocietyMembers = async (society) => {
  console.log(`Creating members for society: ${society.name}`);
  
  const memberPhones = [
    '9876543211', '9876543212', '9876543213', '9876543214', '9876543215',
    '9876543216', '9876543217', '9876543218', '9876543219', '9876543220'
  ];
  
  const memberNames = [
    'Priya Sharma', 'Amit Kumar', 'Sneha Patel', 'Vikram Singh', 'Kavya Gupta',
    'Arjun Jain', 'Meera Reddy', 'Rohit Agarwal', 'Ananya Nair', 'Raj Mehta'
  ];
  
  for (let i = 0; i < memberPhones.length; i++) {
    try {
      // Create member user
      const memberUser = new User({
        phone: memberPhones[i],
        email: `${memberNames[i].toLowerCase().replace(/\s+/g, '')}@example.com`,
        isVerified: true,
        verificationCode: '123456',
        lastLogin: new Date()
      });
      
      await memberUser.save();
      console.log(`✅ Created member user: ${memberNames[i]} (${memberPhones[i]})`);
      
      // Create member profile
      const memberProfile = new Profile({
        user: memberUser._id,
        companyName: society._id,
        role: 'society_member',
        status: 'active',
        phone: memberUser.phone,
        joinedAt: new Date(Date.now() - Math.floor(Math.random() * 365 * 24 * 60 * 60 * 1000))
      });
      
      await memberProfile.save();
      console.log(`✅ Added member: ${memberNames[i]} to ${society.name}`);
      
    } catch (error) {
      if (error.code === 11000) {
        console.log(`Member user ${memberPhones[i]} already exists, skipping...`);
      } else {
        console.error(`Error creating member ${memberPhones[i]}:`, error.message);
      }
    }
  }
};

// Create invitations for the society
const createSocietyInvitations = async (society, user) => {
  console.log(`Creating invitations for society: ${society.name}`);
  
  const invitations = [
    {
      phone: '9876543221',
      name: 'Suresh Kumar',
      email: 'suresh.kumar@example.com',
      type: 'society_member',
      status: 'sent',
      message: 'You are invited to join our prestigious society as a member. We have excellent amenities and a great community.'
    },
    {
      phone: '9876543222',
      name: 'Deepak Sharma',
      email: 'deepak.sharma@example.com',
      type: 'broker',
      status: 'accepted',
      message: 'We would like to invite you as a broker to help our members with property transactions.'
    },
    {
      phone: '9876543223',
      name: 'Ravi Construction',
      email: 'ravi.construction@example.com',
      type: 'developer',
      status: 'pending',
      message: 'We are looking for a developer for our upcoming redevelopment project. Please consider joining us.'
    },
    {
      phone: '9876543224',
      name: 'Anita Gupta',
      email: 'anita.gupta@example.com',
      type: 'society_member',
      status: 'declined',
      message: 'Join our community and enjoy world-class amenities and facilities.'
    },
    {
      phone: '9876543225',
      name: 'Tech Solutions Ltd',
      email: 'tech.solutions@example.com',
      type: 'developer',
      status: 'sent',
      message: 'We need experienced developers for our smart society initiative.'
    }
  ];
  
  for (const inv of invitations) {
    try {
      const invitation = new Invitation({
        society: society._id,
        invitedBy: user._id,
        invitedPhone: inv.phone,
        invitedName: inv.name,
        invitedEmail: inv.email,
        invitationType: inv.type,
        status: inv.status,
        message: inv.message,
        isUserRegistered: Math.random() > 0.5, // Random registration status
        sentAt: inv.status !== 'pending' ? new Date() : null,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        acceptedAt: inv.status === 'accepted' ? new Date() : null,
        declinedAt: inv.status === 'declined' ? new Date() : null,
        metadata: {
          source: 'dashboard',
          ipAddress: '127.0.0.1',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      await invitation.save();
      console.log(`✅ Created invitation: ${inv.type} for ${inv.name} (${inv.phone}) - Status: ${inv.status}`);
      
    } catch (error) {
      console.error(`Error creating invitation for ${inv.phone}:`, error.message);
    }
  }
};

// Create notifications for the user
const createUserNotifications = async (user) => {
  console.log(`Creating notifications for user: ${targetPhone}`);
  
  const notifications = [
    {
      type: 'property_inquiry',
      title: 'New Property Inquiry',
      message: 'Someone is interested in your property listing at Elite Gardens.',
      priority: 'high',
      isRead: false
    },
    {
      type: 'property_like',
      title: 'Property Liked',
      message: 'Your society profile has been liked by 5 users today.',
      priority: 'medium',
      isRead: true
    },
    {
      type: 'system_alert',
      title: 'Society Registration Complete',
      message: 'Your society Elite Gardens Apartments has been successfully registered.',
      priority: 'high',
      isRead: true
    },
    {
      type: 'property_share',
      title: 'Property Shared',
      message: 'Your society listing was shared 3 times this week.',
      priority: 'low',
      isRead: false
    },
    {
      type: 'property_update',
      title: 'Profile Updated',
      message: 'Your society profile has been updated successfully.',
      priority: 'medium',
      isRead: true
    },
    {
      type: 'property_inquiry',
      title: 'Member Inquiry',
      message: 'New inquiry about joining your society from a potential member.',
      priority: 'high',
      isRead: false
    }
  ];
  
  for (const notif of notifications) {
    try {
      const notification = new Notification({
        recipient: user._id,
        type: notif.type,
        title: notif.title,
        message: notif.message,
        priority: notif.priority,
        isRead: notif.isRead,
        readAt: notif.isRead ? new Date() : null,
        data: {
          timestamp: new Date(),
          source: 'system'
        }
      });
      
      await notification.save();
      console.log(`✅ Created notification: ${notif.title} - Priority: ${notif.priority}`);
      
    } catch (error) {
      console.error(`Error creating notification:`, error.message);
    }
  }
};

// Main seeding function
const seedSpecificUser = async () => {
  try {
    console.log('🌱 Starting specific user data seeding...');
    console.log(`Target phone number: ${targetPhone}`);
    
    // Create or find the specific user
    const user = await createSpecificUser();
    
    // Create society owned by this user
    const society = await createUserSociety(user);
    
    // Create members for the society
    await createSocietyMembers(society);
    
    // Create invitations for the society
    await createSocietyInvitations(society, user);
    
    // Create notifications for the user
    await createUserNotifications(user);
    
    console.log('✅ Specific user data seeding completed successfully!');
    console.log(`📊 Created for user ${targetPhone}:`);
    console.log(`   - User profile (verified)`);
    console.log(`   - Society: ${society.name}`);
    console.log(`   - Society owner profile`);
    console.log(`   - 10 society members`);
    console.log(`   - 5 invitations (various statuses)`);
    console.log(`   - 6 notifications (mix of read/unread)`);
    
    console.log('\n🎯 You can now:');
    console.log(`   - Login with phone: ${targetPhone}`);
    console.log(`   - View society: ${society.name}`);
    console.log(`   - Manage invitations and members`);
    console.log(`   - Check notifications`);
    
  } catch (error) {
    console.error('❌ Error seeding specific user data:', error);
  } finally {
    mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
};

// Run the seeding
seedSpecificUser();
