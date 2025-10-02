import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

class SocketService {
  constructor() {
    this.io = null;
    this.connectedUsers = new Map(); // Map to store user connections
  }

  initialize(server) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.CLIENT_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
      }
    });

    this.setupMiddleware();
    this.setupEventHandlers();
    
    console.log('🚀 WebSocket server initialized');
    return this.io;
  }

  setupMiddleware() {
    // Authentication middleware
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
          return next(new Error('Authentication error: No token provided'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId).select('-password');
        
        if (!user) {
          return next(new Error('Authentication error: User not found'));
        }

        socket.userId = user._id.toString();
        socket.user = user;
        next();
      } catch (error) {
        console.error('Socket authentication error:', error);
        next(new Error('Authentication error: Invalid token'));
      }
    });
  }

  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`👤 User connected: ${socket.user.fullName} (${socket.userId})`);
      
      // Store user connection
      this.connectedUsers.set(socket.userId, {
        socketId: socket.id,
        user: socket.user,
        connectedAt: new Date()
      });

      // Join user to their society room
      if (socket.user.society) {
        socket.join(`society_${socket.user.society}`);
        console.log(`🏠 User joined society room: ${socket.user.society}`);
      }

      // Join user to specific project rooms if they have active projects
      this.joinProjectRooms(socket);

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log(`👋 User disconnected: ${socket.user.fullName} (${socket.userId})`);
        this.connectedUsers.delete(socket.userId);
      });

      // Handle joining specific project room
      socket.on('join_project', (projectId) => {
        socket.join(`project_${projectId}`);
        console.log(`📁 User joined project room: ${projectId}`);
      });

      // Handle leaving specific project room
      socket.on('leave_project', (projectId) => {
        socket.leave(`project_${projectId}`);
        console.log(`📁 User left project room: ${projectId}`);
      });
    });
  }

  async joinProjectRooms(socket) {
    try {
      // Import here to avoid circular dependency
      const RedevelopmentProject = (await import('../models/RedevelopmentProject.js')).default;
      
      // Find projects where user is owner or member of the society
      const projects = await RedevelopmentProject.find({
        $or: [
          { owner: socket.userId },
          { society: socket.user.society }
        ]
      }).select('_id title');

      projects.forEach(project => {
        socket.join(`project_${project._id}`);
        console.log(`📁 Auto-joined project room: ${project.title} (${project._id})`);
      });
    } catch (error) {
      console.error('Error joining project rooms:', error);
    }
  }

  // Notification methods
  notifyUser(userId, event, data) {
    const userConnection = this.connectedUsers.get(userId);
    if (userConnection) {
      this.io.to(userConnection.socketId).emit(event, {
        ...data,
        timestamp: new Date().toISOString(),
        id: Math.random().toString(36).substr(2, 9)
      });
      console.log(`📨 Notification sent to user ${userId}: ${event}`);
    } else {
      console.log(`⚠️ User ${userId} not connected, notification queued`);
      // TODO: Implement notification queue for offline users
    }
  }

  notifySociety(societyId, event, data) {
    this.io.to(`society_${societyId}`).emit(event, {
      ...data,
      timestamp: new Date().toISOString(),
      id: Math.random().toString(36).substr(2, 9)
    });
    console.log(`📢 Society notification sent to ${societyId}: ${event}`);
  }

  notifyProject(projectId, event, data) {
    this.io.to(`project_${projectId}`).emit(event, {
      ...data,
      timestamp: new Date().toISOString(),
      id: Math.random().toString(36).substr(2, 9)
    });
    console.log(`📁 Project notification sent to ${projectId}: ${event}`);
  }

  notifyAll(event, data) {
    this.io.emit(event, {
      ...data,
      timestamp: new Date().toISOString(),
      id: Math.random().toString(36).substr(2, 9)
    });
    console.log(`🌐 Global notification sent: ${event}`);
  }

  // Specific notification methods for different events
  notifyDeveloperSelected(projectId, selectedProposal, rejectedProposals, societyId) {
    const data = {
      type: 'developer_selected',
      projectId,
      selectedProposal: {
        id: selectedProposal._id,
        title: selectedProposal.title,
        developerName: selectedProposal.developerInfo?.companyName || 'Developer',
        corpusAmount: selectedProposal.corpusAmount,
        rentAmount: selectedProposal.rentAmount
      },
      rejectedCount: rejectedProposals.length,
      message: `Developer "${selectedProposal.developerInfo?.companyName || 'Developer'}" has been selected for the project.`
    };

    // Notify society members
    this.notifySociety(societyId, 'developer_selected', data);
    
    // Notify selected developer specifically
    this.notifyUser(selectedProposal.developer, 'proposal_selected', {
      type: 'proposal_selected',
      projectId,
      proposalTitle: selectedProposal.title,
      message: 'Congratulations! Your proposal has been selected.'
    });

    // Notify rejected developers
    rejectedProposals.forEach(proposal => {
      this.notifyUser(proposal.developer, 'proposal_rejected', {
        type: 'proposal_rejected',
        projectId,
        proposalTitle: proposal.title,
        message: 'Your proposal was not selected for this project.'
      });
    });
  }

  notifyVoteCast(projectId, memberId, proposalId, vote, memberName) {
    const data = {
      type: 'vote_cast',
      projectId,
      proposalId,
      memberId,
      memberName,
      vote: vote === true ? 'yes' : vote === false ? 'no' : 'abstain',
      message: `${memberName} voted ${vote === true ? 'Yes' : vote === false ? 'No' : 'Abstain'} on a proposal.`
    };

    this.notifyProject(projectId, 'vote_cast', data);
  }

  notifyVotingClosed(projectId, results) {
    const data = {
      type: 'voting_closed',
      projectId,
      results,
      message: 'Voting has been closed and results are now available.'
    };

    this.notifyProject(projectId, 'voting_closed', data);
  }

  notifyNewProposal(projectId, proposal, societyId) {
    const data = {
      type: 'new_proposal',
      projectId,
      proposal: {
        id: proposal._id,
        title: proposal.title,
        developerName: proposal.developerInfo?.companyName || 'Developer',
        corpusAmount: proposal.corpusAmount,
        rentAmount: proposal.rentAmount
      },
      message: `New proposal submitted by ${proposal.developerInfo?.companyName || 'Developer'}.`
    };

    this.notifySociety(societyId, 'new_proposal', data);
  }

  notifyProjectUpdate(projectId, update, societyId) {
    const data = {
      type: 'project_update',
      projectId,
      update,
      message: `Project update: ${update.title}`
    };

    this.notifyProject(projectId, 'project_update', data);
    this.notifySociety(societyId, 'project_update', data);
  }

  notifyNewQuery(projectId, query, societyId) {
    const data = {
      type: 'new_query',
      projectId,
      query: {
        id: query._id,
        title: query.title,
        raisedBy: query.raisedBy
      },
      message: `New query posted: ${query.title}`
    };

    this.notifyProject(projectId, 'new_query', data);
  }

  notifyQueryResponse(projectId, queryId, response, societyId) {
    const data = {
      type: 'query_response',
      projectId,
      queryId,
      response,
      message: 'Your query has received a response.'
    };

    this.notifyProject(projectId, 'query_response', data);
  }

  // Get connected users count
  getConnectedUsersCount() {
    return this.connectedUsers.size;
  }

  // Get users in a specific room
  getUsersInRoom(room) {
    const roomSockets = this.io.sockets.adapter.rooms.get(room);
    if (!roomSockets) return [];

    return Array.from(roomSockets).map(socketId => {
      const socket = this.io.sockets.sockets.get(socketId);
      return socket ? {
        userId: socket.userId,
        user: socket.user,
        connectedAt: this.connectedUsers.get(socket.userId)?.connectedAt
      } : null;
    }).filter(Boolean);
  }
}

// Create singleton instance
const socketService = new SocketService();

export default socketService;
