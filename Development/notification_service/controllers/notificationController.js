import Notification from '../models/Notification.js';
import UserPreferences from '../models/UserPreferences.js';
import mongoose from 'mongoose';

// Get user's notifications (paginated)
export const getNotifications = async (req, res) => {
  try {
    // ✅ Handle both id and _id
    const userId = req.user.id || req.user._id;
    
    console.log('📍 getNotifications - User ID:', userId);
    console.log('📍 getNotifications - Full user object:', req.user);
    
    if (!userId) {
      return res.status(401).json({ message: 'User ID not found in token' });
    }

    const { page = 1, limit = 20, unreadOnly = false } = req.query;

    const query = { userId: userId.toString() }; // Ensure it's a string
    
    if (unreadOnly === 'true') {
      query.read = false;
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Notification.countDocuments(query);

    console.log('✅ Found notifications:', notifications.length);

    res.status(200).json({
      notifications,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      totalNotifications: total,
    });
  } catch (error) {
    console.error('❌ Error fetching notifications:', error);
    console.error('Stack:', error.stack);
    res.status(500).json({ message: 'Failed to fetch notifications', error: error.message });
  }
};

// Get unread count
export const getUnreadCount = async (req, res) => {
  try {
    // ✅ Handle both id and _id
    const userId = req.user.id || req.user._id;
    
    console.log('📍 getUnreadCount - User ID:', userId);
    
    if (!userId) {
      return res.status(401).json({ message: 'User ID not found in token' });
    }

    const count = await Notification.countDocuments({
      userId: userId.toString(),
      read: false,
    });

    console.log('✅ Unread count:', count);

    res.status(200).json({ count });
  } catch (error) {
    console.error('❌ Error fetching unread count:', error);
    console.error('Stack:', error.stack);
    res.status(500).json({ message: 'Failed to fetch unread count', error: error.message });
  }
};

// Mark notification as read
export const markAsRead = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ message: 'User ID not found in token' });
    }

    const notification = await Notification.findOneAndUpdate(
      { _id: id, userId: userId.toString() },
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.status(200).json({ message: 'Notification marked as read', notification });
  } catch (error) {
    console.error('❌ Error marking notification as read:', error);
    res.status(500).json({ message: 'Failed to mark as read', error: error.message });
  }
};

// Mark all notifications as read
export const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;

    if (!userId) {
      return res.status(401).json({ message: 'User ID not found in token' });
    }

    await Notification.updateMany(
      { userId: userId.toString(), read: false },
      { read: true }
    );

    res.status(200).json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('❌ Error marking all as read:', error);
    res.status(500).json({ message: 'Failed to mark all as read', error: error.message });
  }
};

// Delete notification
export const deleteNotification = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ message: 'User ID not found in token' });
    }

    const notification = await Notification.findOneAndDelete({ 
      _id: id, 
      userId: userId.toString() 
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.status(200).json({ message: 'Notification deleted' });
  } catch (error) {
    console.error('❌ Error deleting notification:', error);
    res.status(500).json({ message: 'Failed to delete notification', error: error.message });
  }
};

// Delete all notifications
export const deleteAllNotifications = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;

    if (!userId) {
      return res.status(401).json({ message: 'User ID not found in token' });
    }

    await Notification.deleteMany({ userId: userId.toString() });

    res.status(200).json({ message: 'All notifications deleted' });
  } catch (error) {
    console.error('❌ Error deleting all notifications:', error);
    res.status(500).json({ message: 'Failed to delete all notifications', error: error.message });
  }
};

// Get user preferences
export const getPreferences = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;

    if (!userId) {
      return res.status(401).json({ message: 'User ID not found in token' });
    }

    const preferences = await UserPreferences.getOrCreate(userId.toString());

    res.status(200).json(preferences);
  } catch (error) {
    console.error('❌ Error fetching preferences:', error);
    res.status(500).json({ message: 'Failed to fetch preferences', error: error.message });
  }
};

// Update user preferences
export const updatePreferences = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const updates = req.body;

    if (!userId) {
      return res.status(401).json({ message: 'User ID not found in token' });
    }

    const preferences = await UserPreferences.findOneAndUpdate(
      { userId: userId.toString() },
      { $set: updates },
      { new: true, upsert: true }
    );

    res.status(200).json({ message: 'Preferences updated', preferences });
  } catch (error) {
    console.error('❌ Error updating preferences:', error);
    res.status(500).json({ message: 'Failed to update preferences', error: error.message });
  }
};

// Get notification statistics
export const getStatistics = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;

    if (!userId) {
      return res.status(401).json({ message: 'User ID not found in token' });
    }

    const stats = await Notification.aggregate([
      { $match: { userId: userId.toString() } }, // Changed to string comparison
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          unread: {
            $sum: { $cond: [{ $eq: ['$read', false] }, 1, 0] }
          }
        }
      }
    ]);

    res.status(200).json({ statistics: stats });
  } catch (error) {
    console.error('❌ Error fetching statistics:', error);
    res.status(500).json({ message: 'Failed to fetch statistics', error: error.message });
  }
};