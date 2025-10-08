import mongoose from 'mongoose';
import Message from '../models/Message.js';
import Conversation from '../models/Conversation.js';
import User from '../models/User.js';
import { RedisService } from '../utils/redis.js';

export const getConversations = async (req, res) => {
  try {
    const userId = req.user.id;

    const conversations = await Conversation.find({
      participants: userId,
    })
      .populate('participants', 'firstName lastName picturePath')
      .populate('lastMessage')
      .sort({ lastMessageAt: -1 });

    const formattedConversations = await Promise.all(
      conversations.map(async (conv) => {
        const otherParticipant = conv.participants.find(
          (p) => p._id.toString() !== userId
        );

        // Get online status from Redis
        const isOnline = await RedisService.isUserOnline(otherParticipant._id.toString());

        // Get unread count from Redis (faster than DB)
        const unreadCount = await RedisService.getUnreadCount(
          userId,
          conv._id.toString()
        );

        return {
          _id: conv._id,
          participant: {
            ...otherParticipant.toObject(),
            isOnline,
          },
          lastMessage: conv.lastMessage,
          lastMessageAt: conv.lastMessageAt,
          unreadCount,
        };
      })
    );

    // Ensure we always return an array
    res.status(200).json(Array.isArray(formattedConversations) ? formattedConversations : []);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    // Return empty array on error to prevent frontend crashes
    res.status(200).json([]);
  }
};

export const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const userId = req.user.id;

    // Verify user is part of conversation
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId,
    });

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    // Try to get from Redis cache first (only first page)
    if (page == 1) {
      const cachedMessages = await RedisService.getCachedMessages(conversationId);
      if (cachedMessages.length > 0) {
        console.log('📦 Serving messages from Redis cache');
        return res.status(200).json({
          messages: cachedMessages,
          totalPages: 1,
          currentPage: 1,
          fromCache: true,
        });
      }
    }

    // Fetch from MongoDB
    console.log('📊 Serving messages from MongoDB');
    const messages = await Message.find({ conversationId })
      .populate('sender', 'firstName lastName picturePath')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Message.countDocuments({ conversationId });

    // Cache first page in Redis
    if (page == 1 && messages.length > 0) {
      const messagesToCache = messages.slice(0, 50);
      for (const msg of messagesToCache.reverse()) {
        await RedisService.cacheMessage(conversationId, {
          _id: msg._id,
          sender: msg.sender,
          content: msg.content,
          createdAt: msg.createdAt,
          read: msg.read,
        });
      }
    }

    res.status(200).json({
      messages: messages.reverse(),
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      fromCache: false,
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Failed to fetch messages' });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { recipientId, content } = req.body;
    const senderId = req.user.id;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Message content required' });
    }

    const conversation = await Conversation.getOrCreate(senderId, recipientId);

    const message = await Message.create({
      conversationId: conversation._id,
      sender: senderId,
      content: content.trim(),
    });

    conversation.lastMessage = message._id;
    conversation.lastMessageAt = new Date();
    conversation.unreadCount.set(
      recipientId,
      (conversation.unreadCount.get(recipientId) || 0) + 1
    );
    await conversation.save();

    await message.populate('sender', 'firstName lastName picturePath');

    // Cache in Redis
    await RedisService.cacheMessage(conversation._id.toString(), {
      _id: message._id,
      sender: message.sender,
      content: message.content,
      createdAt: message.createdAt,
      read: message.read,
    });

    // Increment unread
    await RedisService.incrementUnread(recipientId, conversation._id.toString());

    res.status(201).json(message);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Failed to send message' });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

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

    const conversation = await Conversation.findById(conversationId);
    if (conversation) {
      conversation.unreadCount.set(userId, 0);
      await conversation.save();
    }

    // Reset Redis unread count
    await RedisService.resetUnread(userId, conversationId);

    res.status(200).json({ message: 'Messages marked as read' });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ message: 'Failed to mark messages as read' });
  }
};

export const searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    const userId = req.user.id;

    if (!query || query.length < 2) {
      return res.status(400).json({ message: 'Query too short' });
    }

    const users = await User.find({
      _id: { $ne: userId },
      $or: [
        { firstName: { $regex: query, $options: 'i' } },
        { lastName: { $regex: query, $options: 'i' } },
      ],
    })
      .select('firstName lastName picturePath')
      .limit(10);

    // Check online status for each user
    const usersWithStatus = await Promise.all(
      users.map(async (user) => {
        const isOnline = await RedisService.isUserOnline(user._id.toString());
        return {
          ...user.toObject(),
          isOnline,
        };
      })
    );

    res.status(200).json(usersWithStatus);
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ message: 'Failed to search users' });
  }
};

export const getOnlineStatus = async (req, res) => {
  try {
    const { userIds } = req.body;

    if (!Array.isArray(userIds)) {
      return res.status(400).json({ message: 'userIds must be an array' });
    }

    const onlineUsers = await RedisService.getOnlineFriends(userIds);

    res.status(200).json({ onlineUsers });
  } catch (error) {
    console.error('Error getting online status:', error);
    res.status(500).json({ message: 'Failed to get online status' });
  }
};