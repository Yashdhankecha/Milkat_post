import mongoose from 'mongoose';
import User from '../models/User.js';
import Profile from '../models/Profile.js';
import Society from '../models/Society.js';
import Invitation from '../models/Invitation.js';
import Notification from '../models/Notification.js';
import Requirement from '../models/Requirement.js';
import Project from '../models/Project.js';
import config from '../config-loader.js';

// Connect to MongoDB
mongoose.connect(config.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB for seeding data');
});

// Dummy data arrays
const societyNames = [
  'Green Valley Apartments',
  'Royal Gardens Society',
  'Sunrise Heights',
  'Park View Residency',
  'Golden Meadows',
  'Blue Sky Apartments',
  'Garden City Society',
  'Modern Heights',
  'Peaceful Gardens',
  'Royal Residency'
];

const cities = [
  'Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Pune', 'Hyderabad', 'Ahmedabad', 'Jaipur', 'Lucknow'
];

const states = [
  'Maharashtra', 'Delhi', 'Karnataka', 'Tamil Nadu', 'West Bengal', 'Maharashtra', 'Telangana', 'Gujarat', 'Rajasthan', 'Uttar Pradesh'
];

const amenities = [
  'Swimming Pool', 'Gym', 'Parking', 'Security', 'Garden Area', 'Club House', 'Elevator', 'Power Backup', 'Water Supply', 'Playground'
];

const flatVariants = [
  { name: '1 BHK', area: '500', bedrooms: 1, bathrooms: 1 },
  { name: '2 BHK', area: '800', bedrooms: 2, bathrooms: 2 },
  { name: '3 BHK', area: '1200', bedrooms: 3, bathrooms: 2 },
  { name: '4 BHK', area: '1500', bedrooms: 4, bathrooms: 3 }
];

const requirementTypes = [
  'Redevelopment',
  'Maintenance',
  'Security Upgrade',
  'Amenity Addition',
  'Parking Solution',
  'Water Management',
  'Power Infrastructure',
  'Garden Development'
];

const budgetRanges = [
  'Under ₹50 Lakh',
  '₹50 Lakh - ₹1 Crore',
  '₹1 Crore - ₹2 Crore',
  '₹2 Crore - ₹5 Crore',
  'Above ₹5 Crore'
];

// Generate random phone number
const generatePhoneNumber = () => {
  const prefixes = ['98765', '98764', '98763', '98762', '98761'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const suffix = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
  return prefix + suffix;
};

// Generate random email
const generateEmail = (name, index) => {
  const domains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
  const domain = domains[Math.floor(Math.random() * domains.length)];
  const timestamp = Date.now();
  return `${name.toLowerCase().replace(/\s+/g, '')}${index}${timestamp}@${domain}`;
};

// Generate random name
const generateName = () => {
  const firstNames = ['Raj', 'Priya', 'Amit', 'Sneha', 'Vikram', 'Kavya', 'Arjun', 'Meera', 'Rohit', 'Ananya'];
  const lastNames = ['Sharma', 'Patel', 'Singh', 'Kumar', 'Gupta', 'Jain', 'Agarwal', 'Reddy', 'Nair', 'Mehta'];
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  return `${firstName} ${lastName}`;
};

// Create dummy users
const createUsers = async () => {
  console.log('Creating dummy users...');
  const users = [];
  
  for (let i = 0; i < 20; i++) {
    const name = generateName();
    const phone = generatePhoneNumber();
    const email = generateEmail(name, i);
    
    try {
      const user = new User({
        phone,
        email,
        isVerified: true,
        verificationCode: '123456',
        lastLogin: new Date()
      });
      
      await user.save();
      users.push(user);
      console.log(`Created user: ${name} (${phone})`);
    } catch (error) {
      if (error.code === 11000) {
        console.log(`User with phone ${phone} or email ${email} already exists, skipping...`);
        continue;
      }
      throw error;
    }
  }
  
  return users;
};

// Create dummy societies
const createSocieties = async (users) => {
  console.log('Creating dummy societies...');
  const societies = [];
  
  for (let i = 0; i < 8; i++) {
    const societyName = societyNames[i];
    const city = cities[Math.floor(Math.random() * cities.length)];
    const state = states[Math.floor(Math.random() * states.length)];
    const owner = users[i]; // First 8 users become society owners
    
    // Create society
    const society = new Society({
      name: societyName,
      societyType: 'Apartment',
      numberOfBlocks: Math.floor(Math.random() * 5) + 1,
      totalArea: Math.floor(Math.random() * 5000) + 1000,
      registrationDate: new Date(2020 + Math.floor(Math.random() * 4), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
      address: `${Math.floor(Math.random() * 999) + 1} Main Street`,
      city,
      state,
      pincode: Math.floor(Math.random() * 900000) + 100000,
      totalFlats: Math.floor(Math.random() * 100) + 20,
      yearBuilt: 2010 + Math.floor(Math.random() * 14),
      conditionStatus: ['excellent', 'good', 'fair', 'poor'][Math.floor(Math.random() * 4)],
      amenities: amenities.slice(0, Math.floor(Math.random() * 6) + 3),
      flatVariants: flatVariants.slice(0, Math.floor(Math.random() * 3) + 2),
      fsi: (Math.random() * 2 + 1).toFixed(2),
      roadFacing: ['main', 'arterial', 'collector', 'local', 'corner'][Math.floor(Math.random() * 5)],
      contactPersonName: generateName(),
      contactPhone: generatePhoneNumber(),
      contactEmail: generateEmail('contact', i),
      owner: owner._id,
      registrationDocuments: [],
      flatPlanDocuments: []
    });
    
    await society.save();
    societies.push(society);
    console.log(`Created society: ${societyName} in ${city}`);
    
    // Create society owner profile
    try {
      const ownerProfile = new Profile({
        user: owner._id,
        companyName: society._id,
        role: 'society_owner',
        status: 'active',
        phone: owner.phone,
        joinedAt: new Date()
      });
      await ownerProfile.save();
    } catch (error) {
      if (error.code === 11000) {
        console.log(`Owner profile already exists for society ${societyName}, skipping...`);
      } else {
        throw error;
      }
    }
  }
  
  return societies;
};

// Create dummy members for societies
const createMembers = async (users, societies) => {
  console.log('Creating dummy society members...');
  
  for (const society of societies) {
    // Add 5-15 random members to each society
    const memberCount = Math.floor(Math.random() * 11) + 5;
    const availableUsers = users.filter(user => 
      user._id.toString() !== society.owner.toString()
    );
    
    for (let i = 0; i < memberCount && i < availableUsers.length; i++) {
      const user = availableUsers[i];
      
      try {
        const memberProfile = new Profile({
          user: user._id,
          companyName: society._id,
          role: 'society_member',
          status: 'active',
          phone: user.phone,
          joinedAt: new Date(Date.now() - Math.floor(Math.random() * 365 * 24 * 60 * 60 * 1000)) // Random date within last year
        });
        
        await memberProfile.save();
        console.log(`Added member ${user.phone} to ${society.name}`);
      } catch (error) {
        if (error.code === 11000) {
          console.log(`Member profile already exists for user ${user.phone}, skipping...`);
          continue;
        }
        throw error;
      }
    }
  }
};

// Create dummy requirements
const createRequirements = async (societies) => {
  console.log('Creating dummy requirements...');
  
  for (const society of societies) {
    // Skip requirements for now as the model is for property requirements, not society redevelopment
    console.log(`Skipping requirements for ${society.name} - using property requirement model`);
  }
};

// Create dummy invitations
const createInvitations = async (societies, users) => {
  console.log('Creating dummy invitations...');
  
  for (const society of societies) {
    // Create 3-8 invitations per society
    const invitationCount = Math.floor(Math.random() * 6) + 3;
    
    for (let i = 0; i < invitationCount; i++) {
      const invitedPhone = generatePhoneNumber();
      const invitedName = generateName();
      const invitationType = ['society_member', 'broker', 'developer'][Math.floor(Math.random() * 3)];
      const status = ['pending', 'sent', 'accepted', 'declined', 'expired'][Math.floor(Math.random() * 5)];
      
      // Check if user exists
      const existingUser = users.find(user => user.phone === invitedPhone);
      
      const invitation = new Invitation({
        society: society._id,
        invitedBy: society.owner,
        invitedPhone,
        invitedName,
        invitedEmail: generateEmail(invitedName, i),
        invitationType,
        status,
        message: `You are invited to join ${society.name} as a ${invitationType.replace('_', ' ')}. We would love to have you as part of our community.`,
        isUserRegistered: !!existingUser,
        registeredUserId: existingUser?._id,
        sentAt: status !== 'pending' ? new Date() : null,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        acceptedAt: status === 'accepted' ? new Date() : null,
        declinedAt: status === 'declined' ? new Date() : null,
        metadata: {
          source: 'dashboard',
          ipAddress: '127.0.0.1',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      await invitation.save();
      console.log(`Created invitation: ${invitationType} for ${invitedPhone} to ${society.name}`);
    }
  }
};

// Create dummy notifications
const createNotifications = async (users, societies, invitations) => {
  console.log('Creating dummy notifications...');
  
  for (const user of users) {
    // Create 3-10 notifications per user
    const notificationCount = Math.floor(Math.random() * 8) + 3;
    
    for (let i = 0; i < notificationCount; i++) {
      const notificationTypes = [
        { type: 'property_inquiry', title: 'New Property Inquiry', message: 'You have a new inquiry for your property' },
        { type: 'property_like', title: 'Property Liked', message: 'Someone liked your property' },
        { type: 'property_share', title: 'Property Shared', message: 'Your property was shared by someone' },
        { type: 'system_alert', title: 'System Alert', message: 'Important system notification' },
        { type: 'property_update', title: 'Property Update', message: 'Your property listing has been updated' }
      ];
      
      const notificationType = notificationTypes[Math.floor(Math.random() * notificationTypes.length)];
      const priority = ['low', 'medium', 'high'][Math.floor(Math.random() * 3)];
      const isRead = Math.random() > 0.3; // 70% chance of being read
      
      const notification = new Notification({
        recipient: user._id,
        type: notificationType.type,
        title: notificationType.title,
        message: notificationType.message,
        priority,
        isRead,
        readAt: isRead ? new Date() : null,
        data: {
          societyId: societies[Math.floor(Math.random() * societies.length)]._id,
          timestamp: new Date()
        }
      });
      
      await notification.save();
      console.log(`Created notification: ${notificationType.title} for user ${user.phone}`);
    }
  }
};

// Create dummy projects (if Project model exists)
const createProjects = async (societies) => {
  console.log('Creating dummy projects...');
  
  for (const society of societies) {
    // Create 1-3 projects per society
    const projectCount = Math.floor(Math.random() * 3) + 1;
    
    for (let i = 0; i < projectCount; i++) {
      try {
        const project = new Project({
          society: society._id,
          title: `${society.name} Redevelopment Project ${i + 1}`,
          description: `This is a comprehensive redevelopment project for ${society.name}. The project aims to modernize the building infrastructure, improve amenities, and enhance the overall living experience for residents.`,
          status: ['planning', 'in_progress', 'completed'][Math.floor(Math.random() * 3)],
          budget: Math.floor(Math.random() * 50000000) + 10000000, // 1-50 crores
          startDate: new Date(Date.now() - Math.floor(Math.random() * 365 * 24 * 60 * 60 * 1000)),
          endDate: new Date(Date.now() + Math.floor(Math.random() * 365 * 24 * 60 * 60 * 1000)),
          createdBy: society.owner
        });
        
        await project.save();
        console.log(`Created project: ${project.title}`);
      } catch (error) {
        console.log(`Project model not found or error creating project: ${error.message}`);
        break;
      }
    }
  }
};

// Main seeding function
const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Clear existing data (optional - comment out if you want to keep existing data)
    // console.log('Clearing existing data...');
    // await User.deleteMany({});
    // await Profile.deleteMany({});
    // await Society.deleteMany({});
    // await Invitation.deleteMany({});
    // await Notification.deleteMany({});
    // await Requirement.deleteMany({});
    // await Project.deleteMany({});
    
    // Create dummy data
    const users = await createUsers();
    const societies = await createSocieties(users);
    await createMembers(users, societies);
    await createRequirements(societies);
    const invitations = await createInvitations(societies, users);
    await createNotifications(users, societies, invitations);
    await createProjects(societies);
    
    console.log('✅ Database seeding completed successfully!');
    console.log(`📊 Created:`);
    console.log(`   - ${users.length} users`);
    console.log(`   - ${societies.length} societies`);
    console.log(`   - Multiple profiles and members`);
    console.log(`   - Multiple requirements`);
    console.log(`   - Multiple invitations`);
    console.log(`   - Multiple notifications`);
    console.log(`   - Multiple projects`);
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
};

// Run the seeding
seedDatabase();
