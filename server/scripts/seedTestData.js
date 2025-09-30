import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Import models
import User from '../models/User.js';
import Profile from '../models/Profile.js';
import Society from '../models/Society.js';
import SocietyMember from '../models/SocietyMember.js';
import Invitation from '../models/Invitation.js';
import RedevelopmentProject from '../models/RedevelopmentProject.js';
import DeveloperProposal from '../models/DeveloperProposal.js';
import Query from '../models/Query.js';
import Notification from '../models/Notification.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Test data configuration
const TEST_DATA = {
  users: [
    {
      phone: '+918866189928',
      name: 'Rajesh Kumar',
      role: 'society_owner'
    },
    {
      phone: '+919925500691',
      name: 'Priya Sharma',
      role: 'society_member'
    },
    {
      phone: '+918154000351',
      name: 'Amit Patel',
      role: 'society_member'
    },
    {
      phone: '+919876543210',
      name: 'Green Builders Ltd',
      role: 'developer'
    },
    {
      phone: '+919876543211',
      name: 'Skyline Developers',
      role: 'developer'
    }
  ],
  society: {
    name: 'Green Residency',
    address: '123 Green Park, Sector 15',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400001',
    societyType: 'Apartment',
    totalFlats: 120,
    numberOfBlocks: 4,
    yearBuilt: 1995,
    conditionStatus: 'fair',
    amenities: ['Parking', 'Security', 'Garden Area', 'Gym', 'Power Backup'],
    flatVariants: [
      { name: '2BHK', area: 850, bathrooms: 2 },
      { name: '3BHK', area: 1200, bathrooms: 3 },
      { name: '4BHK', area: 1500, bathrooms: 4 }
    ]
  }
};

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

async function createTestUsers() {
  console.log('📝 Creating test users...');
  const createdUsers = [];
  
  for (const userData of TEST_DATA.users) {
    try {
      // Check if user already exists
      let user = await User.findOne({ phone: userData.phone });
      
      if (!user) {
        user = new User({
          phone: userData.phone,
          name: userData.name,
          isVerified: true,
          verificationStatus: 'verified'
        });
        await user.save();
        console.log(`✅ Created user: ${userData.name} (${userData.phone})`);
      } else {
        console.log(`⚠️  User already exists: ${userData.name} (${userData.phone})`);
      }
      
      // Create profile for the user
      let profile = await Profile.findOne({ 
        user: user._id, 
        role: userData.role 
      });
      
      if (!profile) {
        profile = new Profile({
          user: user._id,
          fullName: userData.name,
          role: userData.role,
          status: 'active',
          verificationStatus: 'verified'
        });
        
        if (userData.role === 'society_owner') {
          profile.companyName = null; // Will be set when society is created
        }
        
        await profile.save();
        console.log(`✅ Created profile: ${userData.name} (${userData.role})`);
      } else {
        console.log(`⚠️  Profile already exists: ${userData.name} (${userData.role})`);
      }
      
      createdUsers.push({ user, profile, role: userData.role });
    } catch (error) {
      console.error(`❌ Error creating user ${userData.name}:`, error.message);
    }
  }
  
  return createdUsers;
}

async function createTestSociety(users) {
  console.log('🏢 Creating test society...');
  
  const ownerUser = users.find(u => u.role === 'society_owner');
  if (!ownerUser) {
    throw new Error('No society owner found in test data');
  }
  
  try {
    // Check if society already exists
    let society = await Society.findOne({ name: TEST_DATA.society.name });
    
    if (!society) {
      society = new Society({
        ...TEST_DATA.society,
        owner: ownerUser.user._id
      });
      await society.save();
      console.log(`✅ Created society: ${society.name}`);
    } else {
      console.log(`⚠️  Society already exists: ${society.name}`);
    }
    
    // Update owner profile with company name
    if (ownerUser.profile.companyName !== society._id.toString()) {
      ownerUser.profile.companyName = society._id.toString();
      await ownerUser.profile.save();
      console.log(`✅ Updated owner profile with society reference`);
    }
    
    return society;
  } catch (error) {
    console.error('❌ Error creating society:', error.message);
    throw error;
  }
}

async function createSocietyMembers(society, users) {
  console.log('👥 Creating society members...');
  
  const memberUsers = users.filter(u => u.role === 'society_member');
  const createdMembers = [];
  
  for (const memberUser of memberUsers) {
    try {
      // Check if member already exists
      let member = await SocietyMember.findOne({
        user: memberUser.user._id,
        society: society._id
      });
      
      if (!member) {
        member = new SocietyMember({
          user: memberUser.user._id,
          society: society._id,
          role: 'society_member',
          status: 'active',
          flatNumber: `A-${Math.floor(Math.random() * 30) + 1}`,
          blockNumber: `Block-${Math.floor(Math.random() * 4) + 1}`,
          ownershipType: 'owner',
          joinedAt: new Date()
        });
        await member.save();
        console.log(`✅ Created society member: ${memberUser.profile.fullName}`);
      } else {
        console.log(`⚠️  Society member already exists: ${memberUser.profile.fullName}`);
      }
      
      createdMembers.push(member);
    } catch (error) {
      console.error(`❌ Error creating society member ${memberUser.profile.fullName}:`, error.message);
    }
  }
  
  return createdMembers;
}

async function createTestInvitations(society, ownerUser, memberUsers) {
  console.log('📧 Creating test invitations...');
  
  const invitations = [];
  
  // Create some pending invitations
  const pendingInvitations = [
    {
      invitedPhone: '+919876543212',
      invitedName: 'Test User 1',
      invitedEmail: 'test1@example.com',
      message: 'Welcome to our society!'
    },
    {
      invitedPhone: '+919876543213',
      invitedName: 'Test User 2',
      invitedEmail: 'test2@example.com',
      message: 'Please join our community.'
    }
  ];
  
  for (const invData of pendingInvitations) {
    try {
      // Check if invitation already exists
      let invitation = await Invitation.findOne({
        society: society._id,
        invitedPhone: invData.invitedPhone
      });
      
      if (!invitation) {
        invitation = new Invitation({
          society: society._id,
          invitedBy: ownerUser.user._id,
          invitedPhone: invData.invitedPhone,
          invitedName: invData.invitedName,
          invitedEmail: invData.invitedEmail,
          invitationType: 'society_member',
          message: invData.message,
          status: 'pending',
          isUserRegistered: false,
          metadata: {
            source: 'dashboard',
            ipAddress: '127.0.0.1',
            userAgent: 'Seeder Script'
          }
        });
        await invitation.save();
        console.log(`✅ Created invitation for: ${invData.invitedName}`);
      } else {
        console.log(`⚠️  Invitation already exists for: ${invData.invitedName}`);
      }
      
      invitations.push(invitation);
    } catch (error) {
      console.error(`❌ Error creating invitation for ${invData.invitedName}:`, error.message);
    }
  }
  
  return invitations;
}

async function createTestRedevelopmentProjects(society, ownerUser) {
  console.log('🏗️  Creating test redevelopment projects...');
  
  const projects = [];
  
  const projectData = [
    {
      title: 'Green Residency Redevelopment Phase 1',
      description: 'Complete redevelopment of Green Residency with modern amenities and increased FSI.',
      status: 'planning',
      budget: 50000000,
      expectedCompletion: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
      requirements: {
        fsi: 2.5,
        corpus: 2000000,
        rent: 15000,
        amenities: ['Swimming Pool', 'Gym', 'Club House', 'Parking']
      }
    },
    {
      title: 'Green Residency Redevelopment Phase 2',
      description: 'Second phase of redevelopment focusing on additional amenities and infrastructure.',
      status: 'tender_open',
      budget: 30000000,
      expectedCompletion: new Date(Date.now() + 730 * 24 * 60 * 60 * 1000), // 2 years from now
      requirements: {
        fsi: 3.0,
        corpus: 1500000,
        rent: 12000,
        amenities: ['Garden', 'Playground', 'Security', 'Power Backup']
      }
    }
  ];
  
  for (const projData of projectData) {
    try {
      // Check if project already exists
      let project = await RedevelopmentProject.findOne({
        society: society._id,
        title: projData.title
      });
      
      if (!project) {
        project = new RedevelopmentProject({
          ...projData,
          society: society._id,
          owner: ownerUser.user._id,
          createdBy: ownerUser.user._id,
          progress: projData.status === 'planning' ? 10 : 25,
          votingDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          updates: [
            {
              title: 'Project Initiated',
              description: 'Redevelopment project has been initiated and planning phase started.',
              type: 'milestone',
              isRead: false
            }
          ]
        });
        await project.save();
        console.log(`✅ Created redevelopment project: ${project.title}`);
      } else {
        console.log(`⚠️  Redevelopment project already exists: ${project.title}`);
      }
      
      projects.push(project);
    } catch (error) {
      console.error(`❌ Error creating redevelopment project ${projData.title}:`, error.message);
    }
  }
  
  return projects;
}

async function createTestQueries(society, memberUsers) {
  console.log('❓ Creating test member queries...');
  
  const queries = [];
  
  const queryData = [
    {
      queryText: 'The elevator in Block A is not working properly. It makes strange noises and sometimes gets stuck.',
      category: 'maintenance',
      priority: 'high'
    },
    {
      queryText: 'Can we have more security cameras in the parking area? There have been some incidents recently.',
      category: 'security',
      priority: 'medium'
    },
    {
      queryText: 'The gym equipment needs maintenance. Some machines are not functioning properly.',
      category: 'amenities',
      priority: 'medium'
    },
    {
      queryText: 'Suggestion: Can we organize a monthly community event for residents?',
      category: 'suggestion',
      priority: 'low'
    }
  ];
  
  for (let i = 0; i < queryData.length; i++) {
    const queryInfo = queryData[i];
    const memberUser = memberUsers[i % memberUsers.length]; // Distribute queries among members
    
    try {
      // Check if query already exists
      let query = await Query.findOne({
        society: society._id,
        member: memberUser.user._id,
        queryText: queryInfo.queryText
      });
      
      if (!query) {
        query = new Query({
          society: society._id,
          member: memberUser.user._id,
          memberProfile: memberUser.profile._id,
          queryText: queryInfo.queryText,
          category: queryInfo.category,
          priority: queryInfo.priority,
          status: i < 2 ? 'open' : 'resolved', // First 2 are open, rest are resolved
          metadata: {
            source: 'dashboard',
            ipAddress: '127.0.0.1',
            userAgent: 'Seeder Script'
          }
        });
        
        // Add response for resolved queries
        if (query.status === 'resolved') {
          query.response = {
            text: 'Thank you for your feedback. We have noted your concern and will address it soon.',
            respondedBy: null, // Will be set by admin
            respondedAt: new Date()
          };
        }
        
        await query.save();
        console.log(`✅ Created query: ${queryInfo.queryText.substring(0, 50)}...`);
      } else {
        console.log(`⚠️  Query already exists: ${queryInfo.queryText.substring(0, 50)}...`);
      }
      
      queries.push(query);
    } catch (error) {
      console.error(`❌ Error creating query:`, error.message);
    }
  }
  
  return queries;
}

async function createTestNotifications(society, ownerUser, memberUsers) {
  console.log('🔔 Creating test notifications...');
  
  const notifications = [];
  
  const notificationData = [
    {
      recipient: ownerUser.user._id,
      sender: ownerUser.user._id,
      type: 'redevelopment_project_created',
      title: 'Redevelopment Project Created',
      message: 'A new redevelopment project has been created for Green Residency.',
      data: {
        societyId: society._id,
        redevelopmentProjectId: null // Will be set if project exists
      },
      priority: 'medium'
    },
    {
      recipient: memberUsers[0].user._id,
      sender: ownerUser.user._id,
      type: 'society_announcement',
      title: 'Society Maintenance Update',
      message: 'Monthly maintenance work will be carried out this weekend.',
      data: {
        societyId: society._id
      },
      priority: 'low'
    }
  ];
  
  for (const notifData of notificationData) {
    try {
      // Check if notification already exists
      let notification = await Notification.findOne({
        recipient: notifData.recipient,
        title: notifData.title
      });
      
      if (!notification) {
        notification = new Notification({
          ...notifData,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
        });
        await notification.save();
        console.log(`✅ Created notification: ${notification.title}`);
      } else {
        console.log(`⚠️  Notification already exists: ${notification.title}`);
      }
      
      notifications.push(notification);
    } catch (error) {
      console.error(`❌ Error creating notification:`, error.message);
    }
  }
  
  return notifications;
}

async function main() {
  try {
    console.log('🚀 Starting test data seeding...');
    
    await connectDB();
    
    // Create test users and profiles
    const users = await createTestUsers();
    
    // Create test society
    const society = await createTestSociety(users);
    
    // Create society members
    const members = await createSocietyMembers(society, users);
    
    // Create test invitations
    const ownerUser = users.find(u => u.role === 'society_owner');
    const memberUsers = users.filter(u => u.role === 'society_member');
    const invitations = await createTestInvitations(society, ownerUser, memberUsers);
    
    // Create test redevelopment projects
    const projects = await createTestRedevelopmentProjects(society, ownerUser);
    
    // Create test queries
    const queries = await createTestQueries(society, memberUsers);
    
    // Create test notifications
    const notifications = await createTestNotifications(society, ownerUser, memberUsers);
    
    console.log('\n✅ Test data seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`👥 Users created: ${users.length}`);
    console.log(`🏢 Societies created: 1`);
    console.log(`👥 Society members created: ${members.length}`);
    console.log(`📧 Invitations created: ${invitations.length}`);
    console.log(`🏗️  Redevelopment projects created: ${projects.length}`);
    console.log(`❓ Queries created: ${queries.length}`);
    console.log(`🔔 Notifications created: ${notifications.length}`);
    
    console.log('\n🔑 Test Credentials:');
    console.log('Society Owner: +918866189928');
    console.log('Society Members: +919925500691, +918154000351');
    console.log('Developers: +919876543210, +919876543211');
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📡 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the seeder
main();
