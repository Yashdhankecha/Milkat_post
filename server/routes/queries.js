import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import Query from '../models/Query.js';
import Society from '../models/Society.js';
import SocietyMember from '../models/SocietyMember.js';
import Notification from '../models/Notification.js';

const router = express.Router();

// Get all queries for a society (Secretary/Admin view)
router.get('/society/:societyId', authenticate, authorize('society_owner'), async (req, res) => {
  try {
    const { societyId } = req.params;
    const { status, category, priority, page = 1, limit = 10 } = req.query;
    
    // Verify user has access to this society
    const society = await Society.findById(societyId);
    if (!society) {
      return res.status(404).json({
        success: false,
        message: 'Society not found'
      });
    }
    
    // Check if user is the owner of this society
    if (society.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You are not the owner of this society.'
      });
    }
    
    const filters = {};
    if (status) filters.status = status;
    if (category) filters.category = category;
    if (priority) filters.priority = priority;
    
    const skip = (page - 1) * limit;
    
    const queries = await Query.find({ society: societyId, ...filters })
      .populate('member', 'phone name')
      .populate('memberProfile', 'fullName')
      .populate('response.respondedBy', 'phone name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Query.countDocuments({ society: societyId, ...filters });
    
    res.json({
      success: true,
      message: total === 0 ? 'No queries found for this society' : 'Queries retrieved successfully',
      data: {
        queries: queries || [],
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total,
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching society queries:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get queries by member (Member view)
router.get('/my', authenticate, async (req, res) => {
  try {
    const { societyId, status, page = 1, limit = 10 } = req.query;
    
    const filters = { member: req.user._id };
    if (societyId) filters.society = societyId;
    if (status) filters.status = status;
    
    const skip = (page - 1) * limit;
    
    const queries = await Query.find(filters)
      .populate('society', 'name')
      .populate('response.respondedBy', 'phone name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Query.countDocuments(filters);
    
    res.json({
      success: true,
      data: {
        queries,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total,
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching member queries:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Submit a new query (Member)
router.post('/', authenticate, async (req, res) => {
  try {
    const { societyId, queryText, category = 'other', priority = 'medium' } = req.body;
    
    // Validation
    if (!societyId || !queryText || queryText.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Society ID and query text are required'
      });
    }
    
    if (queryText.trim().length > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Query text must be less than 1000 characters'
      });
    }
    
    // Verify society exists
    const society = await Society.findById(societyId);
    if (!society) {
      return res.status(404).json({
        success: false,
        message: 'Society not found'
      });
    }
    
    // Verify user is a member of this society
    const membership = await SocietyMember.findOne({
      user: req.user._id,
      society: societyId,
      status: 'active'
    });
    
    if (!membership) {
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this society'
      });
    }
    
    // Get member profile
    const Profile = (await import('../models/Profile.js')).default;
    const memberProfile = await Profile.findOne({
      user: req.user._id,
      role: 'society_member'
    });
    
    if (!memberProfile) {
      return res.status(400).json({
        success: false,
        message: 'Member profile not found'
      });
    }
    
    // Create query
    const query = new Query({
      society: societyId,
      member: req.user._id,
      memberProfile: memberProfile._id,
      queryText: queryText.trim(),
      category,
      priority,
      metadata: {
        source: 'dashboard',
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent')
      }
    });
    
    await query.save();
    
    // Create notification for society owner
    const notification = new Notification({
      recipient: society.owner,
      sender: req.user._id,
      type: 'member_query_submitted',
      title: 'New Member Query',
      message: `A new query has been submitted by ${memberProfile.fullName || req.user.name}`,
      data: {
        societyId: society._id,
        queryId: query._id,
        memberId: req.user._id
      },
      priority: priority === 'urgent' || priority === 'high' ? 'high' : 'medium'
    });
    
    await notification.save();
    
    // Populate the created query
    await query.populate([
      { path: 'society', select: 'name' },
      { path: 'member', select: 'phone name' },
      { path: 'memberProfile', select: 'fullName' }
    ]);
    
    res.status(201).json({
      success: true,
      message: 'Query submitted successfully',
      data: query
    });
  } catch (error) {
    console.error('Error submitting query:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Respond to a query (Secretary/Admin)
router.post('/:queryId/respond', authenticate, authorize('society_owner'), async (req, res) => {
  try {
    const { queryId } = req.params;
    const { responseText } = req.body;
    
    if (!responseText || responseText.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Response text is required'
      });
    }
    
    // Find the query
    const query = await Query.findById(queryId)
      .populate('society', 'name owner')
      .populate('member', 'phone name');
    
    if (!query) {
      return res.status(404).json({
        success: false,
        message: 'Query not found'
      });
    }
    
    // Verify user has access to respond to this query
    if (query.society.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You are not authorized to respond to this query.'
      });
    }
    
    // Add response
    await query.addResponse(responseText.trim(), req.user._id);
    
    // Create notification for the member
    const notification = new Notification({
      recipient: query.member._id,
      sender: req.user._id,
      type: 'query_response',
      title: 'Query Response',
      message: `Your query has been responded to by the society management.`,
      data: {
        societyId: query.society._id,
        queryId: query._id
      },
      priority: 'medium'
    });
    
    await notification.save();
    
    // Populate the updated query
    await query.populate([
      { path: 'society', select: 'name' },
      { path: 'member', select: 'phone name' },
      { path: 'memberProfile', select: 'fullName' },
      { path: 'response.respondedBy', select: 'phone name' }
    ]);
    
    res.json({
      success: true,
      message: 'Response added successfully',
      data: query
    });
  } catch (error) {
    console.error('Error responding to query:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update query status (Secretary/Admin)
router.patch('/:queryId/status', authenticate, authorize('society_owner'), async (req, res) => {
  try {
    const { queryId } = req.params;
    const { status } = req.body;
    
    const validStatuses = ['open', 'in_progress', 'resolved', 'closed'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Valid status is required'
      });
    }
    
    // Find the query
    const query = await Query.findById(queryId)
      .populate('society', 'name owner')
      .populate('member', 'phone name');
    
    if (!query) {
      return res.status(404).json({
        success: false,
        message: 'Query not found'
      });
    }
    
    // Verify user has access to update this query
    if (query.society.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You are not authorized to update this query.'
      });
    }
    
    // Update status
    await query.updateStatus(status);
    
    // Create notification for the member if status changed to resolved
    if (status === 'resolved') {
      const notification = new Notification({
        recipient: query.member._id,
        sender: req.user._id,
        type: 'query_resolved',
        title: 'Query Resolved',
        message: `Your query has been marked as resolved.`,
        data: {
          societyId: query.society._id,
          queryId: query._id
        },
        priority: 'low'
      });
      
      await notification.save();
    }
    
    // Populate the updated query
    await query.populate([
      { path: 'society', select: 'name' },
      { path: 'member', select: 'phone name' },
      { path: 'memberProfile', select: 'fullName' },
      { path: 'response.respondedBy', select: 'phone name' }
    ]);
    
    res.json({
      success: true,
      message: 'Query status updated successfully',
      data: query
    });
  } catch (error) {
    console.error('Error updating query status:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get query statistics for a society
router.get('/society/:societyId/statistics', authenticate, authorize('society_owner'), async (req, res) => {
  try {
    const { societyId } = req.params;
    
    // Verify user has access to this society
    const society = await Society.findById(societyId);
    if (!society) {
      return res.status(404).json({
        success: false,
        message: 'Society not found'
      });
    }
    
    // Check if user is the owner of this society
    if (society.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You are not the owner of this society.'
      });
    }
    
    const statistics = await Query.getStatistics(societyId);
    
    // Format statistics
    const formattedStats = {
      total: 0,
      open: 0,
      in_progress: 0,
      resolved: 0,
      closed: 0,
      byCategory: {},
      byPriority: {}
    };
    
    statistics.forEach(stat => {
      formattedStats[stat._id] = stat.count;
      formattedStats.total += stat.count;
    });
    
    // Get category and priority statistics
    const categoryStats = await Query.aggregate([
      { $match: { society: society._id } },
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);
    
    const priorityStats = await Query.aggregate([
      { $match: { society: society._id } },
      { $group: { _id: '$priority', count: { $sum: 1 } } }
    ]);
    
    categoryStats.forEach(stat => {
      formattedStats.byCategory[stat._id] = stat.count;
    });
    
    priorityStats.forEach(stat => {
      formattedStats.byPriority[stat._id] = stat.count;
    });
    
    res.json({
      success: true,
      data: formattedStats
    });
  } catch (error) {
    console.error('Error fetching query statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Upvote a query (Members)
router.post('/:queryId/upvote', authenticate, async (req, res) => {
  try {
    const { queryId } = req.params;
    
    // Find the query
    const query = await Query.findById(queryId)
      .populate('society', 'name');
    
    if (!query) {
      return res.status(404).json({
        success: false,
        message: 'Query not found'
      });
    }
    
    // Verify user is a member of this society
    const membership = await SocietyMember.findOne({
      user: req.user._id,
      society: query.society._id,
      status: 'active'
    });
    
    if (!membership) {
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this society'
      });
    }
    
    // Add upvote
    await query.addUpvote(req.user._id);
    
    res.json({
      success: true,
      message: 'Query upvoted successfully',
      data: {
        upvoteCount: query.upvoteCount
      }
    });
  } catch (error) {
    console.error('Error upvoting query:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Remove upvote from a query (Members)
router.delete('/:queryId/upvote', authenticate, async (req, res) => {
  try {
    const { queryId } = req.params;
    
    // Find the query
    const query = await Query.findById(queryId)
      .populate('society', 'name');
    
    if (!query) {
      return res.status(404).json({
        success: false,
        message: 'Query not found'
      });
    }
    
    // Verify user is a member of this society
    const membership = await SocietyMember.findOne({
      user: req.user._id,
      society: query.society._id,
      status: 'active'
    });
    
    if (!membership) {
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this society'
      });
    }
    
    // Remove upvote
    await query.removeUpvote(req.user._id);
    
    res.json({
      success: true,
      message: 'Upvote removed successfully',
      data: {
        upvoteCount: query.upvoteCount
      }
    });
  } catch (error) {
    console.error('Error removing upvote:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export default router;
