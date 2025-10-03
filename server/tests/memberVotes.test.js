import request from 'supertest';
import mongoose from 'mongoose';
import app from '../server.js';
import MemberVote from '../models/MemberVote.js';
import RedevelopmentProject from '../models/RedevelopmentProject.js';
import SocietyMember from '../models/SocietyMember.js';
import Society from '../models/Society.js';
import User from '../models/User.js';
import Profile from '../models/Profile.js';

describe('Member Voting API Tests', () => {
  let authToken;
  let societyOwnerId;
  let memberId;
  let societyId;
  let projectId;
  let memberProfile;
  
  beforeAll(async () => {
    // Connect to test database
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI_TEST || process.env.MONGODB_URI);
    }
    
    // Clear test data
    await Promise.all([
      MemberVote.deleteMany({}),
      RedevelopmentProject.deleteMany({}),
      SocietyMember.deleteMany({}),
      Society.deleteMany({}),
      User.deleteMany({ phone: { $regex: /^test/ } }),
      Profile.deleteMany({})
    ]);
    
    // Create test users
    const ownerUser = await User.create({
      phone: '+91test1234567890',
      isVerified: true
    });
    
    const memberUser = await User.create({
      phone: '+91test0987654321',
      isVerified: true
    });
    
    societyOwnerId = ownerUser._id;
    memberId = memberUser._id;
    
    // Create profiles
    await Profile.create({
      user: societyOwnerId,
      fullName: 'Test Owner',
      role: 'society_owner',
      status: 'active'
    });
    
    memberProfile = await Profile.create({
      user: memberId,
      fullName: 'Test Member',
      role: 'society_member',
      status: 'active'
    });
    
    // Create test society
    const society = await Society.create({
      name: 'Test Society',
      address: '123 Test St',
      city: 'Test City',
      state: 'Test State',
      totalFlats: 100,
      owner: societyOwnerId
    });
    
    societyId = society._id;
    
    // Create society member
    await SocietyMember.create({
      society: societyId,
      user: memberId,
      role: 'member',
      status: 'active'
    });
    
    // Create test project
    const project = await RedevelopmentProject.create({
      title: 'Test Redevelopment Project',
      description: 'Test project for voting',
      society: societyId,
      owner: societyOwnerId,
      status: 'voting',
      votingDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
    });
    
    projectId = project._id;
    
    // Generate auth token for member
    const jwt = await import('jsonwebtoken');
    authToken = jwt.default.sign(
      { 
        userId: memberId.toString(),
        currentRole: 'society_member',
        activeRole: 'society_member'
      },
      process.env.JWT_SECRET || 'test-secret-key',
      { expiresIn: '1h' }
    );
  });
  
  afterAll(async () => {
    // Clean up test data
    await Promise.all([
      MemberVote.deleteMany({}),
      RedevelopmentProject.deleteMany({}),
      SocietyMember.deleteMany({}),
      Society.deleteMany({}),
      User.deleteMany({ phone: { $regex: /^test/ } }),
      Profile.deleteMany({})
    ]);
    
    await mongoose.connection.close();
  });
  
  describe('POST /api/member-votes', () => {
    it('should submit a vote successfully', async () => {
      const voteData = {
        redevelopmentProject: projectId.toString(),
        vote: 'yes',
        votingSession: 'initial_approval',
        reason: 'I support this project'
      };
      
      const response = await request(app)
        .post('/api/member-votes')
        .set('Authorization', `Bearer ${authToken}`)
        .send(voteData)
        .expect(201);
      
      expect(response.body.status).toBe('success');
      expect(response.body.data.vote).toBe('yes');
      expect(response.body.data.member.toString()).toBe(memberId.toString());
    });
    
    it('should reject duplicate votes', async () => {
      const voteData = {
        redevelopmentProject: projectId.toString(),
        vote: 'no',
        votingSession: 'initial_approval'
      };
      
      const response = await request(app)
        .post('/api/member-votes')
        .set('Authorization', `Bearer ${authToken}`)
        .send(voteData)
        .expect(409);
      
      expect(response.body.status).toBe('error');
      expect(response.body.message).toContain('already voted');
    });
    
    it('should reject invalid vote values', async () => {
      const voteData = {
        redevelopmentProject: projectId.toString(),
        vote: 'invalid_vote',
        votingSession: 'test_session'
      };
      
      const response = await request(app)
        .post('/api/member-votes')
        .set('Authorization', `Bearer ${authToken}`)
        .send(voteData)
        .expect(400);
      
      expect(response.body.status).toBe('error');
    });
    
    it('should reject votes without authentication', async () => {
      const voteData = {
        redevelopmentProject: projectId.toString(),
        vote: 'yes',
        votingSession: 'test_session'
      };
      
      await request(app)
        .post('/api/member-votes')
        .send(voteData)
        .expect(401);
    });
  });
  
  describe('GET /api/member-votes/project/:projectId/statistics', () => {
    it('should get voting statistics', async () => {
      const response = await request(app)
        .get(`/api/member-votes/project/${projectId}/statistics`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(response.body.status).toBe('success');
      expect(response.body.data).toHaveProperty('totalVotes');
      expect(response.body.data).toHaveProperty('yesVotes');
      expect(response.body.data).toHaveProperty('noVotes');
      expect(response.body.data).toHaveProperty('abstainVotes');
      expect(response.body.data).toHaveProperty('approvalPercentage');
      expect(response.body.data.totalVotes).toBeGreaterThanOrEqual(1);
    });
    
    it('should filter statistics by session', async () => {
      const response = await request(app)
        .get(`/api/member-votes/project/${projectId}/statistics?session=initial_approval`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(response.body.status).toBe('success');
      expect(response.body.data.totalVotes).toBeGreaterThanOrEqual(1);
    });
  });
  
  describe('GET /api/member-votes/my-vote/:projectId/:session', () => {
    it('should get member\'s own vote', async () => {
      const response = await request(app)
        .get(`/api/member-votes/my-vote/${projectId}/initial_approval`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(response.body.status).toBe('success');
      expect(response.body.data.vote).toBe('yes');
      expect(response.body.data.member.toString()).toBe(memberId.toString());
    });
    
    it('should return 404 for non-existent vote', async () => {
      const response = await request(app)
        .get(`/api/member-votes/my-vote/${projectId}/non_existent_session`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
      
      expect(response.body.status).toBe('error');
    });
  });
  
  describe('GET /api/member-votes/my-votes', () => {
    it('should get member\'s voting history', async () => {
      const response = await request(app)
        .get('/api/member-votes/my-votes')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(response.body.status).toBe('success');
      expect(response.body.results).toBeGreaterThanOrEqual(1);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });
  
  describe('Vote verification and audit', () => {
    it('should have proper audit fields', async () => {
      const vote = await MemberVote.findOne({ member: memberId });
      
      expect(vote).toBeDefined();
      expect(vote.ipAddress).toBeDefined();
      expect(vote.userAgent).toBeDefined();
      expect(vote.createdAt).toBeDefined();
      expect(vote.isVerified).toBe(false); // Initially unverified
    });
  });
});

export default describe;





