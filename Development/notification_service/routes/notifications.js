import express from 'express';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
  getStatistics,
} from '../controllers/notificationController.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(verifyToken);

// ⚠️ IMPORTANT: Put specific routes BEFORE generic ones!

// Get unread count (MUST be before '/:id' routes)
router.get('/unread-count', getUnreadCount);

// Get statistics
router.get('/statistics', getStatistics);

// Mark all notifications as read
router.patch('/read-all', markAllAsRead);

// Delete all notifications (MUST be before '/:id')
router.delete('/all', deleteAllNotifications); // Changed from '/' to '/all'

// Get notifications (with pagination and filters)
router.get('/', getNotifications);

// Mark specific notification as read
router.patch('/:id/read', markAsRead);

// Delete specific notification
router.delete('/:id', deleteNotification);

export default router;