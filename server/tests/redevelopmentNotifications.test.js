import mongoose from 'mongoose';
import Notification from '../models/Notification.js';
import Society from '../models/Society.js';
import SocietyMember from '../models/SocietyMember.js';
import User from '../models/User.js';
import {
  notifySocietyOwner,
  notifyAllMembers,
  notifyUser,
  createProjectCreatedNotification,
  createVotingOpenedNotification,
  createDocumentUploadedNotification,
  createProposalSubmittedNotification
} from '../utils/redevelopmentNotifications.js';

describe('Redevelopment Notifications Tests', () => {
  let ownerId;
  let member1Id;
  let member2Id;
  let societyId;
  let projectMock;
  
  beforeAll(async () => {
    // Connect to test database
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI_TEST || process.env.MONGODB_URI);
    }
    
    // Clear test data
    await Promise.all([
      Notification.deleteMany({}),
      SocietyMember.deleteMany({}),
      Society.deleteMany({}),
      User.deleteMany({ phone: { $regex: /^notiftest/ } })
    ]);
    
    // Create test users
    const ownerUser = await User.create({
      phone: '+91notiftest1111111111',
      isVerified: true
    });
    
    const member1 = await User.create({
      phone: '+91notiftest2222222222',
      isVerified: true
    });
    
    const member2 = await User.create({
      phone: '+91notiftest3333333333',
      isVerified: true
    });
    
    ownerId = ownerUser._id;
    member1Id = member1._id;
    member2Id = member2._id;
    
    // Create test society
    const society = await Society.create({
      name: 'Test Notification Society',
      address: '123 Notification St',
      city: 'Notification City',
      state: 'Notification State',
      totalFlats: 50,
      owner: ownerId
    });
    
    societyId = society._id;
    
    // Create society members
    await SocietyMember.create({
      society: societyId,
      user: member1Id,
      role: 'member',
      status: 'active'
    });
    
    await SocietyMember.create({
      society: societyId,
      user: member2Id,
      role: 'member',
      status: 'active'
    });
    
    // Mock project object
    projectMock = {
      _id: new mongoose.Types.ObjectId(),
      title: 'Test Redevelopment Project',
      society: societyId,
      status: 'planning',
      votingDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    };
  });
  
  afterAll(async () => {
    // Clean up test data
    await Promise.all([
      Notification.deleteMany({}),
      SocietyMember.deleteMany({}),
      Society.deleteMany({}),
      User.deleteMany({ phone: { $regex: /^notiftest/ } })
    ]);
    
    await mongoose.connection.close();
  });
  
  beforeEach(async () => {
    // Clear notifications before each test
    await Notification.deleteMany({});
  });
  
  describe('notifySocietyOwner', () => {
    it('should send notification to society owner', async () => {
      const notification = createProjectCreatedNotification(projectMock, member1Id);
      const result = await notifySocietyOwner(societyId, notification);
      
      expect(result).toBeDefined();
      expect(result.recipient.toString()).toBe(ownerId.toString());
      expect(result.type).toBe('redevelopment_project_created');
      expect(result.title).toBe('New Redevelopment Project Created');
      
      const savedNotification = await Notification.findById(result._id);
      expect(savedNotification).toBeDefined();
    });
    
    it('should handle invalid society ID gracefully', async () => {
      const notification = createProjectCreatedNotification(projectMock, member1Id);
      const invalidSocietyId = new mongoose.Types.ObjectId();
      
      const result = await notifySocietyOwner(invalidSocietyId, notification);
      expect(result).toBeNull();
    });
  });
  
  describe('notifyAllMembers', () => {
    it('should send notification to all active society members', async () => {
      const notification = createVotingOpenedNotification(
        projectMock,
        ownerId,
        projectMock.votingDeadline
      );
      
      const results = await notifyAllMembers(societyId, notification);
      
      expect(results).toHaveLength(2);
      expect(results.every(r => r.type === 'voting_opened')).toBe(true);
      
      const notifications = await Notification.find({ society: societyId });
      expect(notifications.length).toBeGreaterThanOrEqual(2);
    });
    
    it('should return empty array for society with no members', async () => {
      const emptySociety = await Society.create({
        name: 'Empty Society',
        address: '456 Empty St',
        city: 'Empty City',
        state: 'Empty State',
        totalFlats: 10,
        owner: ownerId
      });
      
      const notification = createProjectCreatedNotification(projectMock, ownerId);
      const results = await notifyAllMembers(emptySociety._id, notification);
      
      expect(results).toHaveLength(0);
      
      await Society.findByIdAndDelete(emptySociety._id);
    });
  });
  
  describe('notifyUser', () => {
    it('should send notification to specific user', async () => {
      const notification = {
        type: 'project_update_posted',
        title: 'Project Update',
        message: 'A new update has been posted',
        sender: ownerId,
        priority: 'medium',
        data: {
          redevelopmentProjectId: projectMock._id,
          societyId: societyId
        }
      };
      
      const result = await notifyUser(member1Id, notification);
      
      expect(result).toBeDefined();
      expect(result.recipient.toString()).toBe(member1Id.toString());
      expect(result.type).toBe('project_update_posted');
      
      const savedNotification = await Notification.findById(result._id);
      expect(savedNotification).toBeDefined();
    });
  });
  
  describe('Notification Templates', () => {
    it('should create project created notification with correct structure', () => {
      const notification = createProjectCreatedNotification(projectMock, ownerId);
      
      expect(notification.type).toBe('redevelopment_project_created');
      expect(notification.title).toBe('New Redevelopment Project Created');
      expect(notification.message).toContain(projectMock.title);
      expect(notification.priority).toBe('high');
      expect(notification.data.redevelopmentProjectId).toEqual(projectMock._id);
      expect(notification.data.societyId).toEqual(societyId);
    });
    
    it('should create voting opened notification with expiration', () => {
      const notification = createVotingOpenedNotification(
        projectMock,
        ownerId,
        projectMock.votingDeadline
      );
      
      expect(notification.type).toBe('voting_opened');
      expect(notification.priority).toBe('urgent');
      expect(notification.expiresAt).toEqual(projectMock.votingDeadline);
      expect(notification.message).toContain(projectMock.title);
    });
    
    it('should create document uploaded notification', () => {
      const notification = createDocumentUploadedNotification(
        projectMock,
        ownerId,
        'Agreement Document.pdf',
        'agreement'
      );
      
      expect(notification.type).toBe('project_document_uploaded');
      expect(notification.message).toContain('Agreement Document.pdf');
      expect(notification.message).toContain('agreement');
      expect(notification.priority).toBe('medium');
    });
    
    it('should create proposal submitted notification', () => {
      const proposalMock = {
        _id: new mongoose.Types.ObjectId(),
        title: 'Developer Proposal 1',
        corpusAmount: 5000000,
        rentAmount: 25000
      };
      
      const notification = createProposalSubmittedNotification(
        proposalMock,
        projectMock,
        ownerId
      );
      
      expect(notification.type).toBe('developer_proposal_submitted');
      expect(notification.priority).toBe('high');
      expect(notification.message).toContain(proposalMock.title);
      expect(notification.data.proposalId).toEqual(proposalMock._id);
      expect(notification.data.metadata.corpusAmount).toBe(5000000);
    });
  });
  
  describe('Notification Priority Levels', () => {
    it('should set urgent priority for critical notifications', () => {
      const votingNotif = createVotingOpenedNotification(projectMock, ownerId, projectMock.votingDeadline);
      expect(votingNotif.priority).toBe('urgent');
    });
    
    it('should set high priority for important notifications', () => {
      const projectNotif = createProjectCreatedNotification(projectMock, ownerId);
      expect(projectNotif.priority).toBe('high');
    });
    
    it('should set medium priority for regular notifications', () => {
      const docNotif = createDocumentUploadedNotification(projectMock, ownerId, 'doc.pdf', 'other');
      expect(docNotif.priority).toBe('medium');
    });
  });
  
  describe('Notification Metadata', () => {
    it('should include comprehensive metadata in notifications', () => {
      const notification = createProjectCreatedNotification(projectMock, ownerId);
      
      expect(notification.data).toBeDefined();
      expect(notification.data.redevelopmentProjectId).toBeDefined();
      expect(notification.data.societyId).toBeDefined();
      expect(notification.data.metadata).toBeDefined();
      expect(notification.data.metadata.projectTitle).toBe(projectMock.title);
      expect(notification.data.metadata.status).toBe(projectMock.status);
    });
  });
});

export default describe;




