import mongoose from 'mongoose';
import User from '../models/User.js';
import Profile from '../models/Profile.js';
import Society from '../models/Society.js';
import SocietyMember from '../models/SocietyMember.js';
import RedevelopmentProject from '../models/RedevelopmentProject.js';
import DeveloperProposal from '../models/DeveloperProposal.js';
import Query from '../models/Query.js';
import Developer from '../models/Developer.js';

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/nestly_estate');
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Seed data function
const seedData = async () => {
  try {
    console.log('Starting seed data insertion...');

    // 1. Create Users
    const users = [
      {
        phone: '+91886618928',
        isVerified: true,
        currentRole: 'society_owner',
        activeRole: 'society_owner'
      },
      {
        phone: '+919925500691',
        isVerified: true,
        currentRole: 'society_member',
        activeRole: 'society_member'
      },
      {
        phone: '+918154000351',
        isVerified: true,
        currentRole: 'society_member',
        activeRole: 'society_member'
      },
      {
        phone: '+919876543210',
        isVerified: true,
        currentRole: 'developer',
        activeRole: 'developer'
      },
      {
        phone: '+919876543211',
        isVerified: true,
        currentRole: 'developer',
        activeRole: 'developer'
      }
    ];

    const createdUsers = [];
    for (const userData of users) {
      const existingUser = await User.findOne({ phone: userData.phone });
      if (!existingUser) {
        const user = new User(userData);
        await user.save();
        createdUsers.push(user);
        console.log(`Created user: ${userData.phone}`);
      } else {
        createdUsers.push(existingUser);
        console.log(`User already exists: ${userData.phone}`);
      }
    }

    // 2. Create Profiles
    const profiles = [
      {
        user: createdUsers[0]._id,
        fullName: 'Rajesh Kumar',
        role: 'society_owner',
        companyName: 'Green Valley Society',
        status: 'active',
        verificationStatus: 'verified'
      },
      {
        user: createdUsers[1]._id,
        fullName: 'Priya Sharma',
        role: 'society_member',
        status: 'active',
        verificationStatus: 'verified'
      },
      {
        user: createdUsers[2]._id,
        fullName: 'Amit Patel',
        role: 'society_member',
        status: 'active',
        verificationStatus: 'verified'
      },
      {
        user: createdUsers[3]._id,
        fullName: 'Vikram Singh',
        role: 'developer',
        companyName: 'Metro Builders',
        status: 'active',
        verificationStatus: 'verified'
      },
      {
        user: createdUsers[4]._id,
        fullName: 'Sunil Gupta',
        role: 'developer',
        companyName: 'Elite Constructions',
        status: 'active',
        verificationStatus: 'verified'
      }
    ];

    const createdProfiles = [];
    for (const profileData of profiles) {
      const existingProfile = await Profile.findOne({ 
        user: profileData.user, 
        role: profileData.role 
      });
      if (!existingProfile) {
        const profile = new Profile(profileData);
        await profile.save();
        createdProfiles.push(profile);
        console.log(`Created profile: ${profileData.fullName} - ${profileData.role}`);
      } else {
        createdProfiles.push(existingProfile);
        console.log(`Profile already exists: ${profileData.fullName} - ${profileData.role}`);
      }
    }

    // 3. Create Society
    const societyData = {
      name: 'Green Valley Society',
      address: '123 Green Valley Road, Sector 15',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001',
      societyType: 'Apartment',
      totalArea: 50000,
      totalFlats: 120,
      numberOfBlocks: 4,
      yearBuilt: 1995,
      conditionStatus: 'fair',
      amenities: ['Swimming Pool', 'Gym', 'Parking', 'Security', 'Garden Area'],
      contactPersonName: 'Rajesh Kumar',
      contactPhone: '+91886618928',
      contactEmail: 'rajesh@greenvalley.com',
      flatVariants: [
        { name: '2BHK', area: 850, bathrooms: 2 },
        { name: '3BHK', area: 1200, bathrooms: 3 },
        { name: '4BHK', area: 1500, bathrooms: 4 }
      ],
      owner: createdUsers[0]._id,
      status: 'active',
      isVerified: true,
      verificationStatus: 'verified'
    };

    let society = await Society.findOne({ name: societyData.name });
    if (!society) {
      society = new Society(societyData);
      await society.save();
      console.log(`Created society: ${societyData.name}`);
    } else {
      console.log(`Society already exists: ${societyData.name}`);
    }

    // 4. Create Society Members
    const memberData = [
      {
        society: society._id,
        user: createdUsers[0]._id,
        role: 'secretary',
        status: 'active',
        flatNumber: 'A-101',
        blockNumber: 'Block A',
        ownershipType: 'owner'
      },
      {
        society: society._id,
        user: createdUsers[1]._id,
        role: 'society_member',
        status: 'active',
        flatNumber: 'B-205',
        blockNumber: 'Block B',
        ownershipType: 'owner'
      },
      {
        society: society._id,
        user: createdUsers[2]._id,
        role: 'society_member',
        status: 'active',
        flatNumber: 'C-301',
        blockNumber: 'Block C',
        ownershipType: 'owner'
      }
    ];

    for (const member of memberData) {
      const existingMember = await SocietyMember.findOne({ 
        society: member.society, 
        user: member.user 
      });
      if (!existingMember) {
        const societyMember = new SocietyMember(member);
        await societyMember.save();
        console.log(`Created society member: ${member.flatNumber}`);
      } else {
        console.log(`Society member already exists: ${member.flatNumber}`);
      }
    }

    // 5. Create Redevelopment Project
    const redevelopmentData = {
      title: 'Green Valley Redevelopment Project',
      description: 'Complete redevelopment of Green Valley Society with modern amenities and increased FSI',
      society: society._id,
      owner: createdUsers[0]._id,
      expectedAmenities: [
        'Swimming Pool',
        'Gym',
        'Club House',
        'Children Playground',
        'Senior Citizen Area',
        'Parking',
        'Security',
        'Garden'
      ],
      timeline: {
        startDate: new Date('2024-06-01'),
        expectedCompletionDate: new Date('2026-12-31'),
        phases: [
          {
            name: 'Planning & Approval',
            description: 'Get all necessary approvals and finalize plans',
            startDate: new Date('2024-06-01'),
            endDate: new Date('2024-12-31'),
            status: 'in_progress'
          },
          {
            name: 'Demolition',
            description: 'Demolish existing structures',
            startDate: new Date('2025-01-01'),
            endDate: new Date('2025-06-30'),
            status: 'pending'
          },
          {
            name: 'Construction',
            description: 'Build new structures',
            startDate: new Date('2025-07-01'),
            endDate: new Date('2026-12-31'),
            status: 'pending'
          }
        ]
      },
      status: 'tender_open',
      progress: 15,
      estimatedBudget: 50000000,
      corpusAmount: 2000000,
      rentAmount: 15000,
      isPublic: true,
      allowMemberQueries: true,
      requireVotingApproval: true,
      minimumApprovalPercentage: 75
    };

    let redevelopmentProject = await RedevelopmentProject.findOne({ 
      society: society._id 
    });
    if (!redevelopmentProject) {
      redevelopmentProject = new RedevelopmentProject(redevelopmentData);
      await redevelopmentProject.save();
      console.log(`Created redevelopment project: ${redevelopmentData.title}`);
    } else {
      console.log(`Redevelopment project already exists for society`);
    }

    // 6. Create Developer Proposals
    const proposalData = [
      {
        title: 'Metro Builders Proposal',
        description: 'Comprehensive redevelopment proposal with modern amenities and efficient construction timeline',
        redevelopmentProject: redevelopmentProject._id,
        developer: createdUsers[3]._id,
        corpusAmount: 1800000,
        rentAmount: 12000,
        fsi: 2.5,
        proposedAmenities: [
          { name: 'Swimming Pool', description: 'Olympic size swimming pool', category: 'recreation' },
          { name: 'Gym', description: 'Fully equipped gym with modern equipment', category: 'recreation' },
          { name: 'Club House', description: 'Multi-purpose club house for events', category: 'recreation' }
        ],
        timeline: '24 months from start to completion',
        proposedTimeline: {
          startDate: new Date('2025-01-01'),
          completionDate: new Date('2026-12-31'),
          phases: [
            { name: 'Planning', description: 'Final planning and approvals', duration: 6, milestones: ['Approval', 'Design Finalization'] },
            { name: 'Demolition', description: 'Demolish existing structures', duration: 6, milestones: ['Demolition Complete'] },
            { name: 'Construction', description: 'Build new structures', duration: 12, milestones: ['Foundation', 'Structure', 'Finishing'] }
          ]
        },
        financialBreakdown: {
          constructionCost: 35000000,
          amenitiesCost: 8000000,
          legalCost: 2000000,
          contingencyCost: 5000000,
          totalCost: 50000000,
          paymentSchedule: [
            { phase: 'Foundation', percentage: 20, amount: 10000000, dueDate: new Date('2025-06-01') },
            { phase: 'Structure', percentage: 40, amount: 20000000, dueDate: new Date('2025-12-01') },
            { phase: 'Finishing', percentage: 30, amount: 15000000, dueDate: new Date('2026-06-01') },
            { phase: 'Completion', percentage: 10, amount: 5000000, dueDate: new Date('2026-12-01') }
          ]
        },
        developerInfo: {
          companyName: 'Metro Builders',
          experience: 15,
          completedProjects: 25,
          certifications: ['ISO 9001', 'Green Building Certification'],
          contactPerson: 'Vikram Singh',
          contactPhone: '+919876543210',
          contactEmail: 'vikram@metrobuilders.com',
          website: 'www.metrobuilders.com'
        },
        status: 'submitted'
      },
      {
        title: 'Elite Constructions Proposal',
        description: 'Premium redevelopment with luxury amenities and faster completion',
        redevelopmentProject: redevelopmentProject._id,
        developer: createdUsers[4]._id,
        corpusAmount: 2200000,
        rentAmount: 18000,
        fsi: 3.0,
        proposedAmenities: [
          { name: 'Swimming Pool', description: 'Infinity pool with jacuzzi', category: 'recreation' },
          { name: 'Gym', description: 'Premium gym with personal trainers', category: 'recreation' },
          { name: 'Club House', description: 'Luxury club house with banquet hall', category: 'recreation' }
        ],
        timeline: '20 months from start to completion',
        proposedTimeline: {
          startDate: new Date('2025-01-01'),
          completionDate: new Date('2026-08-31'),
          phases: [
            { name: 'Planning', description: 'Final planning and approvals', duration: 4, milestones: ['Approval', 'Design Finalization'] },
            { name: 'Demolition', description: 'Demolish existing structures', duration: 4, milestones: ['Demolition Complete'] },
            { name: 'Construction', description: 'Build new structures', duration: 12, milestones: ['Foundation', 'Structure', 'Finishing'] }
          ]
        },
        financialBreakdown: {
          constructionCost: 40000000,
          amenitiesCost: 10000000,
          legalCost: 2000000,
          contingencyCost: 5000000,
          totalCost: 57000000,
          paymentSchedule: [
            { phase: 'Foundation', percentage: 20, amount: 11400000, dueDate: new Date('2025-05-01') },
            { phase: 'Structure', percentage: 40, amount: 22800000, dueDate: new Date('2025-11-01') },
            { phase: 'Finishing', percentage: 30, amount: 17100000, dueDate: new Date('2026-05-01') },
            { phase: 'Completion', percentage: 10, amount: 5700000, dueDate: new Date('2026-08-01') }
          ]
        },
        developerInfo: {
          companyName: 'Elite Constructions',
          experience: 20,
          completedProjects: 35,
          certifications: ['ISO 9001', 'Green Building Certification', 'LEED Certified'],
          contactPerson: 'Sunil Gupta',
          contactPhone: '+919876543211',
          contactEmail: 'sunil@eliteconstructions.com',
          website: 'www.eliteconstructions.com'
        },
        status: 'submitted'
      }
    ];

    for (const proposal of proposalData) {
      const existingProposal = await DeveloperProposal.findOne({ 
        redevelopmentProject: proposal.redevelopmentProject,
        developer: proposal.developer
      });
      if (!existingProposal) {
        const developerProposal = new DeveloperProposal(proposal);
        await developerProposal.save();
        console.log(`Created developer proposal: ${proposal.title}`);
      } else {
        console.log(`Developer proposal already exists: ${proposal.title}`);
      }
    }

    // 7. Create Sample Queries
    const queryData = [
      {
        society: society._id,
        member: createdUsers[1]._id,
        memberProfile: createdProfiles[1]._id,
        queryText: 'When will the redevelopment project start? I need to plan my temporary accommodation.',
        category: 'other',
        priority: 'high',
        status: 'open'
      },
      {
        society: society._id,
        member: createdUsers[2]._id,
        memberProfile: createdProfiles[2]._id,
        queryText: 'What amenities will be available in the new building? Will there be a swimming pool?',
        category: 'amenities',
        priority: 'medium',
        status: 'open'
      },
      {
        society: society._id,
        member: createdUsers[1]._id,
        memberProfile: createdProfiles[1]._id,
        queryText: 'The lift in Block B is not working properly. Please get it repaired.',
        category: 'maintenance',
        priority: 'urgent',
        status: 'in_progress'
      }
    ];

    for (const query of queryData) {
      const existingQuery = await Query.findOne({ 
        society: query.society,
        member: query.member,
        queryText: query.queryText
      });
      if (!existingQuery) {
        const memberQuery = new Query(query);
        await memberQuery.save();
        console.log(`Created member query: ${query.queryText.substring(0, 50)}...`);
      } else {
        console.log(`Member query already exists`);
      }
    }

    console.log('Seed data insertion completed successfully!');
    console.log('\nSummary:');
    console.log(`- Users created: ${createdUsers.length}`);
    console.log(`- Profiles created: ${createdProfiles.length}`);
    console.log(`- Society: Green Valley Society`);
    console.log(`- Society Members: 3`);
    console.log(`- Redevelopment Project: 1`);
    console.log(`- Developer Proposals: 2`);
    console.log(`- Member Queries: 3`);

  } catch (error) {
    console.error('Error seeding data:', error);
  }
};

// Run the seed function
const runSeed = async () => {
  await connectDB();
  await seedData();
  await mongoose.connection.close();
  console.log('Database connection closed');
  process.exit(0);
};

runSeed();
