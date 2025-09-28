import express from 'express';
import Notification from '../models/Notification.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { catchAsync, AppError } from '../middleware/errorHandler.js';

const router = express.Router();

// Get user notifications
router.get('/',
  authenticate,
  catchAsync(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const unreadOnly = req.query.unreadOnly === 'true';
    const userId = req.user._id;

    const notifications = await Notification.getUserNotifications(userId, page, limit, unreadOnly);
    const total = await Notification.countDocuments({ 
      recipient: userId,
      ...(unreadOnly && { isRead: false })
    });
    const unreadCount = await Notification.getUnreadCount(userId);

    res.status(200).json({
      status: 'success',
      data: {
        notifications,
        unreadCount,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  })
);

// Mark notifications as read
router.patch('/mark-read',
  authenticate,
  catchAsync(async (req, res) => {
    const { notificationIds } = req.body;
    const userId = req.user._id;

    const result = await Notification.markAsRead(userId, notificationIds);

    res.status(200).json({
      status: 'success',
      message: 'Notifications marked as read',
      data: {
        modifiedCount: result.modifiedCount
      }
    });
  })
);

// Mark single notification as read
router.patch('/:notificationId/read',
  authenticate,
  catchAsync(async (req, res) => {
    const { notificationId } = req.params;
    const userId = req.user._id;

    const notification = await Notification.findOne({
      _id: notificationId,
      recipient: userId
    });

    if (!notification) {
      return res.status(404).json({
        status: 'error',
        message: 'Notification not found'
      });
    }

    await notification.markAsRead();

    res.status(200).json({
      status: 'success',
      message: 'Notification marked as read',
      data: { notification }
    });
  })
);

// Get unread count
router.get('/unread-count',
  authenticate,
  catchAsync(async (req, res) => {
    const userId = req.user._id;
    const unreadCount = await Notification.getUnreadCount(userId);

    res.status(200).json({
      status: 'success',
      data: {
        unreadCount
      }
    });
  })
);

// Delete notification
router.delete('/:notificationId',
  authenticate,
  catchAsync(async (req, res) => {
    const { notificationId } = req.params;
    const userId = req.user._id;

    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      recipient: userId
    });

    if (!notification) {
      return res.status(404).json({
        status: 'error',
        message: 'Notification not found'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Notification deleted successfully'
    });
  })
);

// Clear all notifications
router.delete('/',
  authenticate,
  catchAsync(async (req, res) => {
    const userId = req.user._id;
    const result = await Notification.deleteMany({ recipient: userId });

    res.status(200).json({
      status: 'success',
      message: 'All notifications cleared',
      data: {
        deletedCount: result.deletedCount
      }
    });
  })
);

export default router;
