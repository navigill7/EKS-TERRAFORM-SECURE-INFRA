import mongoose from 'mongoose';
import Message from '../models/Message.js';
import Conversation from '../models/Conversation.js';
import User from '../models/User.js';
import { RedisService, REDIS_CHANNELS } from './redis.js';

// Notification channel
const NOTIFICATION_CHANNELS = {
  MESSAGE: 'notification:message',
};

// Helper to publish message notification
const publishMessageNotification = async (recipientId, senderId, senderName, senderPicture, content, conversationId) => {
  try {
    await RedisService.publish(NOTIFICATION_CHANNELS.MESSAGE, {
      userId: recipientId,
      actorId: senderId,
      actorName: senderName,
      actorPicture: senderPicture,
      relatedId: conversationId,
      metadata: {
        messagePreview: content.substring(0, 50),
      },
    });
    console.log(`📢 Published message notification for user ${recipientId}`);
  } catch (error) {
    console.error('❌ Error publishing message notification:', error);
  }
};

export const initializeSocket = (io) => {

  // Subscribe to Redis Pub/Sub channels for cross-server communication
  RedisService.subscribe(REDIS_CHANNELS.messageNew, (data) => {
    console.log('📢 Broadcasting new message to conversation:', data.conversationId);
    io.to(data.conversationId).emit('message:new', {
      message: data.message,
      conversationId: data.conversationId
    });
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
    console.log('👤 User online:', data.userId);
    io.emit('user:online', { userId: data.userId });
  });

  RedisService.subscribe(REDIS_CHANNELS.userOffline, (data) => {
    console.log('👤 User offline:', data.userId);
    io.emit('user:offline', { userId: data.userId });
  });

  RedisService.subscribe(REDIS_CHANNELS.messageRead, (data) => {
    io.to(data.conversationId).emit('messages:read', {
      conversationId: data.conversationId,
      userId: data.userId,
    });
  });

  // Handle socket connections
  io.on('connection', async (socket) => {
    const userId = socket.userId;
    console.log(`✅ User connected: ${userId}, Socket ID: ${socket.id}`);

    try {
      // Store socket mapping in Redis
      await RedisService.setUserSocket(userId, socket.id);
      await RedisService.setUserOnline(userId);

      // Join user to their personal room (for direct notifications)
      socket.join(userId);

      // Publish online status to all servers
      await RedisService.publish(REDIS_CHANNELS.userOnline, { userId });

      // Send current online friends to the connected user
      const user = await getUserWithFriends(userId);
      if (user && user.friends && user.friends.length > 0) {
        const friendIds = user.friends.map(f => f.toString());
        const onlineFriends = await RedisService.getOnlineFriends(friendIds);
        socket.emit('friends:online', { userIds: onlineFriends });
      }

      // Send total unread count
      const totalUnread = await RedisService.getTotalUnread(userId);
      socket.emit('unread:total', { count: totalUnread });

    } catch (error) {
      console.error('❌ Error on connection:', error);
    }

    // Join conversation room
    socket.on('conversation:join', async (conversationId) => {
      try {
        socket.join(conversationId);
        console.log(`📥 User ${userId} joined conversation ${conversationId}`);

        // Mark messages as read
        await markMessagesAsRead(io, userId, conversationId);
      } catch (error) {
        console.error('❌ Error joining conversation:', error);
      }
    });

    // Leave conversation room
    socket.on('conversation:leave', async (conversationId) => {
      try {
        socket.leave(conversationId);
        await RedisService.removeTyping(conversationId, userId);
        console.log(`📤 User ${userId} left conversation ${conversationId}`);
      } catch (error) {
        console.error('❌ Error leaving conversation:', error);
      }
    });

    // ✅ SINGLE message:send handler (removed duplicate)
    socket.on('message:send', async (data) => {
      try {
        const { recipientId, content } = data;

        if (!content || !content.trim()) {
          return socket.emit('error', { message: 'Message content required' });
        }

        console.log(`💬 Message from ${userId} to ${recipientId}: "${content.substring(0, 30)}..."`);

        // Get or create conversation
        const conversation = await Conversation.getOrCreate(userId, recipientId);
        console.log(`📝 Conversation ID: ${conversation._id}`);

        // Create message in database
        const message = await Message.create({
          conversationId: conversation._id,
          sender: userId,
          content: content.trim(),
        });

        // Update conversation metadata
        conversation.lastMessage = message._id;
        conversation.lastMessageAt = new Date();
        conversation.unreadCount.set(
          recipientId,
          (conversation.unreadCount.get(recipientId) || 0) + 1
        );
        await conversation.save();

        // Populate sender info for the message
        await message.populate('sender', 'firstName lastName picturePath');

        // Prepare message object for caching and broadcasting
        const messageObj = {
          _id: message._id,
          conversationId: conversation._id,
          sender: {
            _id: message.sender._id,
            firstName: message.sender.firstName,
            lastName: message.sender.lastName,
            picturePath: message.sender.picturePath
          },
          content: message.content,
          createdAt: message.createdAt,
          read: message.read,
        };

        // Cache message in Redis for faster retrieval
        await RedisService.cacheMessage(conversation._id.toString(), messageObj);

        // Increment unread count in Redis
        await RedisService.incrementUnread(recipientId, conversation._id.toString());

        // 🆕 PUBLISH MESSAGE NOTIFICATION (Added here)
        await publishMessageNotification(
          recipientId,
          userId,
          `${message.sender.firstName} ${message.sender.lastName}`,
          message.sender.picturePath,
          content,
          conversation._id.toString()
        );

        // Publish message to Redis for broadcasting to all servers
        await RedisService.publish(REDIS_CHANNELS.messageNew, {
          conversationId: conversation._id.toString(),
          message: messageObj,
        });

        // Stop typing indicator for sender
        await stopTyping(socket.id, userId, conversation._id.toString());

        // Update sender's total unread count (in case they have other unread messages)
        const totalUnread = await RedisService.getTotalUnread(userId);
        socket.emit('unread:total', { count: totalUnread });

        // Update recipient's total unread count
        const recipientUnread = await RedisService.getTotalUnread(recipientId);
        io.to(recipientId).emit('unread:total', { count: recipientUnread });

        console.log(`✅ Message sent successfully`);

      } catch (error) {
        console.error('❌ Error sending message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle typing start
    socket.on('typing:start', async ({ conversationId }) => {
      try {
        await RedisService.setTyping(conversationId, userId);

        // Get user info for typing indicator
        const user = await getUserInfo(userId);
        
        if (!user) {
          console.error('❌ User not found for typing indicator:', userId);
          return;
        }

        // Publish typing indicator to Redis
        await RedisService.publish(REDIS_CHANNELS.typingStart, {
          conversationId,
          userId,
          socketId: socket.id,
          user: {
            firstName: user.firstName,
            lastName: user.lastName,
          },
        });
      } catch (error) {
        console.error('❌ Error on typing start:', error);
      }
    });

    // Handle typing stop
    socket.on('typing:stop', async ({ conversationId }) => {
      await stopTyping(socket.id, userId, conversationId);
    });

    // Handle marking messages as read
    socket.on('messages:read', async ({ conversationId }) => {
      await markMessagesAsRead(io, userId, conversationId);
    });

    // Get online status of specific users
    socket.on('users:status', async ({ userIds }) => {
      try {
        if (!Array.isArray(userIds)) {
          return socket.emit('error', { message: 'userIds must be an array' });
        }

        const onlineUsers = await RedisService.getOnlineFriends(userIds);
        socket.emit('users:status', { onlineUsers });
      } catch (error) {
        console.error('❌ Error getting user status:', error);
        socket.emit('error', { message: 'Failed to get user status' });
      }
    });

    // Handle disconnect
    socket.on('disconnect', async () => {
      console.log(`❌ User disconnected: ${userId}, Socket ID: ${socket.id}`);

      try {
        // Remove socket mapping from Redis
        await RedisService.removeUserSocket(userId, socket.id);
        await RedisService.setUserOffline(userId);

        // Publish offline status to all servers
        await RedisService.publish(REDIS_CHANNELS.userOffline, { userId });

      } catch (error) {
        console.error('❌ Error on disconnect:', error);
      }
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error('❌ Socket error:', error);
    });
  });

  // Handle connection errors
  io.on('connection_error', (error) => {
    console.error('❌ Connection error:', error);
  });
};

// Helper function to stop typing indicator
async function stopTyping(socketId, userId, conversationId) {
  try {
    await RedisService.removeTyping(conversationId, userId);
    await RedisService.publish(REDIS_CHANNELS.typingStop, {
      conversationId,
      userId,
      socketId,
    });
  } catch (error) {
    console.error('❌ Error stopping typing:', error);
  }
}

// Helper function to mark messages as read
async function markMessagesAsRead(io, userId, conversationId) {
  try {
    console.log(`👁️ Marking messages as read for user ${userId} in conversation ${conversationId}`);

    // Update messages in database
    const result = await Message.updateMany(
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

    if (result.modifiedCount > 0) {
      console.log(`✅ Marked ${result.modifiedCount} messages as read`);
    }

    // Update conversation unread count in database
    const conversation = await Conversation.findById(conversationId);
    if (conversation) {
      conversation.unreadCount.set(userId, 0);
      await conversation.save();
    }

    // Reset Redis unread count
    await RedisService.resetUnread(userId, conversationId);

    // Get and emit updated total unread count to user
    const totalUnread = await RedisService.getTotalUnread(userId);
    io.to(userId).emit('unread:total', { count: totalUnread });

    // Notify other participants that messages were read
    await RedisService.publish(REDIS_CHANNELS.messageRead, {
      conversationId,
      userId,
    });

  } catch (error) {
    console.error('❌ Error marking messages as read:', error);
  }
}

// Helper function to get user info
async function getUserInfo(userId) {
  try {
    const user = await User.findById(userId).select('firstName lastName picturePath');
    
    if (!user) {
      console.error('❌ User not found:', userId);
      return null;
    }

    return user;
  } catch (error) {
    console.error('❌ Error getting user info:', error);
    return null;
  }
}

// Helper function to get user with friends
async function getUserWithFriends(userId) {
  try {
    const user = await User.findById(userId).select('friends');
    
    if (!user) {
      console.error('❌ User not found:', userId);
      return null;
    }

    return user;
  } catch (error) {
    console.error('❌ Error getting user with friends:', error);
    return null;
  }
}