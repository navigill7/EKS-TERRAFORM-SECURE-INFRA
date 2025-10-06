import Message from '../models/Message.js';
import Conversation from '../models/Conversation.js';
import { RedisService, REDIS_CHANNELS } from './redis.js';

export const initializeSocket = (io) => {

  RedisService.subscribe(REDIS_CHANNELS.messageNew, (data) => {
    io.to(data.conversationId).emit('message:new', data);
  });

  RedisService.subscribe(REDIS_CHANNELS.typingStart, (data) => {
    io.to(data.conversationId).emit('typing:start', {
      conversationId: data.conversationId,
      userId: data.userId,
      user: data.user,
    });
  });

  RedisService.subscribe(REDIS_CHANNELS.typingStop, (data) => {
    io.to(data.conversationId).emit('typing:stop', {
      conversationId: data.conversationId,
      userId: data.userId,
    });
  });

  RedisService.subscribe(REDIS_CHANNELS.userOnline, (data) => {
    io.emit('user:online', { userId: data.userId });
  });

  RedisService.subscribe(REDIS_CHANNELS.userOffline, (data) => {
    io.emit('user:offline', { userId: data.userId });
  });

  io.on('connection', async (socket) => {
    const userId = socket.userId;
    console.log(`User connected: ${userId}`);

    try {
      // Store socket mapping in Redis
      await RedisService.setUserSocket(userId, socket.id);
      await RedisService.setUserOnline(userId);

      // Join user to their personal room
      socket.join(userId);

      // Publish online status
      await RedisService.publish(REDIS_CHANNELS.userOnline, { userId });

      // Send current online friends
      const user = await getUserWithFriends(userId);
      if (user && user.friends) {
        const friendIds = user.friends.map(f => f.toString());
        const onlineFriends = await RedisService.getOnlineFriends(friendIds);
        socket.emit('friends:online', { userIds: onlineFriends });
      }

      // Get total unread count
      const totalUnread = await RedisService.getTotalUnread(userId);
      socket.emit('unread:total', { count: totalUnread });

    } catch (error) {
      console.error('Error on connection:', error);
    }

    // Join conversation room
    socket.on('conversation:join', async (conversationId) => {
      socket.join(conversationId);
      console.log(`User ${userId} joined conversation ${conversationId}`);

      // Mark messages as read
      await markMessagesAsRead(userId, conversationId);
    });

    // Leave conversation room
    socket.on('conversation:leave', async (conversationId) => {
      socket.leave(conversationId);
      await RedisService.removeTyping(conversationId, userId);
      console.log(`User ${userId} left conversation ${conversationId}`);
    });

    // Handle sending messages
    socket.on('message:send', async (data) => {
      try {
        const { recipientId, content } = data;

        if (!content || !content.trim()) {
          return socket.emit('error', { message: 'Message content required' });
        }

        // Get or create conversation
        const conversation = await Conversation.getOrCreate(userId, recipientId);

        // Create message
        const message = await Message.create({
          conversationId: conversation._id,
          sender: userId,
          content: content.trim(),
        });

        // Update conversation
        conversation.lastMessage = message._id;
        conversation.lastMessageAt = new Date();
        conversation.unreadCount.set(
          recipientId,
          (conversation.unreadCount.get(recipientId) || 0) + 1
        );
        await conversation.save();

        // Populate sender info
        await message.populate('sender', 'firstName lastName picturePath');

        // Cache message in Redis
        await RedisService.cacheMessage(conversation._id.toString(), {
          _id: message._id,
          sender: message.sender,
          content: message.content,
          createdAt: message.createdAt,
          read: message.read,
        });

        // Increment unread count in Redis
        await RedisService.incrementUnread(recipientId, conversation._id.toString());

        // Publish message to all servers
        await RedisService.publish(REDIS_CHANNELS.messageNew, {
          conversationId: conversation._id.toString(),
          message: {
            _id: message._id,
            conversationId: conversation._id,
            sender: message.sender,
            content: message.content,
            createdAt: message.createdAt,
            read: message.read,
          },
        });

        // Stop typing
        await stopTyping(userId, conversation._id.toString());

        // Update sender's unread total
        const totalUnread = await RedisService.getTotalUnread(userId);
        socket.emit('unread:total', { count: totalUnread });

        // Update recipient's unread total
        const recipientUnread = await RedisService.getTotalUnread(recipientId);
        io.to(recipientId).emit('unread:total', { count: recipientUnread });

      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle typing start
    socket.on('typing:start', async ({ conversationId }) => {
      try {
        await RedisService.setTyping(conversationId, userId);

        // Get user info for typing indicator
        const user = await getUserInfo(userId);

        await RedisService.publish(REDIS_CHANNELS.typingStart, {
          conversationId,
          userId,
          user: {
            firstName: user.firstName,
            lastName: user.lastName,
          },
        });
      } catch (error) {
        console.error('Error on typing start:', error);
      }
    });

    // Handle typing stop
    socket.on('typing:stop', async ({ conversationId }) => {
      await stopTyping(userId, conversationId);
    });

    // Handle marking messages as read
    socket.on('messages:read', async ({ conversationId }) => {
      await markMessagesAsRead(userId, conversationId);
    });

    // Get online status of specific users
    socket.on('users:status', async ({ userIds }) => {
      try {
        const onlineUsers = await RedisService.getOnlineFriends(userIds);
        socket.emit('users:status', { onlineUsers });
      } catch (error) {
        console.error('Error getting user status:', error);
      }
    });

    // Handle disconnect
    socket.on('disconnect', async () => {
      console.log(`User disconnected: ${userId}`);

      try {
        await RedisService.removeUserSocket(userId, socket.id);
        await RedisService.setUserOffline(userId);

        // Publish offline status
        await RedisService.publish(REDIS_CHANNELS.userOffline, { userId });

        // Remove from all typing indicators
        // Note: Redis TTL will auto-expire typing keys
      } catch (error) {
        console.error('Error on disconnect:', error);
      }
    });
  });
};

// Helper functions
async function stopTyping(userId, conversationId) {
  await RedisService.removeTyping(conversationId, userId);
  await RedisService.publish(REDIS_CHANNELS.typingStop, {
    conversationId,
    userId,
  });
}

async function markMessagesAsRead(userId, conversationId) {
  try {
    // Update database
    await Message.updateMany(
      {
        conversationId,
        sender: { $ne: userId },
        read: false,
      },
      {
        read: true,
        readAt: new Date(),
      }
    );

    // Update conversation unread count
    const conversation = await Conversation.findById(conversationId);
    if (conversation) {
      conversation.unreadCount.set(userId, 0);
      await conversation.save();
    }

    // Reset Redis unread count
    await RedisService.resetUnread(userId, conversationId);

    // Get updated total unread
    const totalUnread = await RedisService.getTotalUnread(userId);
    io.to(userId).emit('unread:total', { count: totalUnread });

    // Notify other participants
    await RedisService.publish(REDIS_CHANNELS.messageRead, {
      conversationId,
      userId,
    });
  } catch (error) {
    console.error('Error marking messages as read:', error);
  }
}

async function getUserInfo(userId) {
  // This would import User model from main app
  const mongoose = require('mongoose');
  const User = mongoose.model('User');
  return await User.findById(userId).select('firstName lastName picturePath');
}

async function getUserWithFriends(userId) {
  const mongoose = require('mongoose');
  const User = mongoose.model('User');
  return await User.findById(userId).select('friends');
}