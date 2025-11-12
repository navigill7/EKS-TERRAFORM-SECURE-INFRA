import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import redis from '../config/redis.js';

let io;

// Initialize Socket.IO
export const initializeSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.MAIN_APP_URL || 'http://localhost:3000',
      credentials: true,
    },
  });

  // Authentication middleware
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error('Authentication error'));
      }

      const verified = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = verified.id;
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  // Handle connections
  io.on('connection', async (socket) => {
    const userId = socket.userId;
    console.log(`✅ User connected to notifications: ${userId}`);

    // Join user's personal room
    socket.join(userId);

    // Store socket mapping in Redis (for tracking online users)
    await redis.sadd('notification:online', userId);
    await redis.set(`notification:socket:${userId}`, socket.id);

    // Send initial unread count
    const Notification = (await import('../models/Notification.js')).default;
    const unreadCount = await Notification.countDocuments({
      userId,
      read: false,
    });
    socket.emit('notification:unread-count', { count: unreadCount });

    // Handle mark as read
    socket.on('notification:mark-read', async (notificationId) => {
      try {
        const notification = await Notification.findOneAndUpdate(
          { _id: notificationId, userId },
          { read: true },
          { new: true }
        );

        if (notification) {
          socket.emit('notification:read-success', { notificationId });
          
          // Send updated unread count
          const newUnreadCount = await Notification.countDocuments({
            userId,
            read: false,
          });
          socket.emit('notification:unread-count', { count: newUnreadCount });
        }
      } catch (error) {
        console.error('Error marking notification as read:', error);
        socket.emit('notification:error', { message: 'Failed to mark as read' });
      }
    });

    // Handle mark all as read
    socket.on('notification:mark-all-read', async () => {
      try {
        await Notification.updateMany(
          { userId, read: false },
          { read: true }
        );

        socket.emit('notification:all-read-success');
        socket.emit('notification:unread-count', { count: 0 });
      } catch (error) {
        console.error('Error marking all as read:', error);
        socket.emit('notification:error', { message: 'Failed to mark all as read' });
      }
    });

    // Handle disconnect
    socket.on('disconnect', async () => {
      console.log(`❌ User disconnected from notifications: ${userId}`);
      await redis.srem('notification:online', userId);
      await redis.del(`notification:socket:${userId}`);
    });
  });

  console.log('✅ Socket.IO initialized for notifications');
};

// Emit notification to specific user
export const emitToUser = async (userId, event, data) => {
  if (!io) {
    console.warn('⚠️ Socket.IO not initialized');
    return;
  }

  // Check if user is online
  const isOnline = await redis.sismember('notification:online', userId);

  if (isOnline) {
    io.to(userId).emit(event, data);
    console.log(`📤 Emitted ${event} to user ${userId}`);
  } else {
    console.log(`👤 User ${userId} is offline, notification stored in DB`);
  }
};

// Broadcast to all connected users (for system notifications)
export const broadcastToAll = (event, data) => {
  if (!io) {
    console.warn('⚠️ Socket.IO not initialized');
    return;
  }

  io.emit(event, data);
  console.log(`📡 Broadcasted ${event} to all users`);
};

export const getIO = () => io;

export default { initializeSocket, emitToUser, broadcastToAll, getIO };