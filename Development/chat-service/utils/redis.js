import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

// Create Redis client
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
});

// Create Redis Pub/Sub clients (separate connections)
const redisPub = redis.duplicate();
const redisSub = redis.duplicate();

redis.on('connect', () => {
  console.log('✅ Redis connected');
});

redis.on('error', (err) => {
  console.error('❌ Redis error:', err);
});

// Redis key patterns
export const REDIS_KEYS = {
  // User socket mapping: socket:user:{userId} -> socketId
  userSocket: (userId) => `socket:user:${userId}`,
  
  // Socket user mapping: socket:id:{socketId} -> userId
  socketUser: (socketId) => `socket:id:${socketId}`,
  
  // Online users set: online:users -> Set of userIds
  onlineUsers: 'online:users',
  
  // Typing status: typing:{conversationId} -> Set of userIds
  typing: (conversationId) => `typing:${conversationId}`,
  
  // Recent messages cache: messages:{conversationId} -> List of messages
  messageCache: (conversationId) => `messages:${conversationId}`,
  
  // Unread count: unread:{userId}:{conversationId} -> integer
  unreadCount: (userId, conversationId) => `unread:${userId}:${conversationId}`,
  
  // Total unread: unread:{userId}:total -> integer
  totalUnread: (userId) => `unread:${userId}:total`,
  
  // User presence: presence:{userId} -> timestamp
  userPresence: (userId) => `presence:${userId}`,
};

// Redis Pub/Sub channels
export const REDIS_CHANNELS = {
  messageNew: 'channel:message:new',
  typingStart: 'channel:typing:start',
  typingStop: 'channel:typing:stop',
  userOnline: 'channel:user:online',
  userOffline: 'channel:user:offline',
  messageRead: 'channel:message:read',
};

// Helper functions
export const RedisService = {
  // Socket management
  async setUserSocket(userId, socketId) {
    const multi = redis.multi();
    multi.set(REDIS_KEYS.userSocket(userId), socketId);
    multi.set(REDIS_KEYS.socketUser(socketId), userId);
    multi.expire(REDIS_KEYS.userSocket(userId), 86400); // 24 hours
    multi.expire(REDIS_KEYS.socketUser(socketId), 86400);
    await multi.exec();
  },

  async getUserSocket(userId) {
    return await redis.get(REDIS_KEYS.userSocket(userId));
  },

  async getSocketUser(socketId) {
    return await redis.get(REDIS_KEYS.socketUser(socketId));
  },

  async removeUserSocket(userId, socketId) {
    const multi = redis.multi();
    multi.del(REDIS_KEYS.userSocket(userId));
    multi.del(REDIS_KEYS.socketUser(socketId));
    await multi.exec();
  },

  // Online status
  async setUserOnline(userId) {
    const multi = redis.multi();
    multi.sadd(REDIS_KEYS.onlineUsers, userId);
    multi.set(REDIS_KEYS.userPresence(userId), Date.now());
    await multi.exec();
  },

  async setUserOffline(userId) {
    const multi = redis.multi();
    multi.srem(REDIS_KEYS.onlineUsers, userId);
    multi.del(REDIS_KEYS.userPresence(userId));
    await multi.exec();
  },

  async isUserOnline(userId) {
    return await redis.sismember(REDIS_KEYS.onlineUsers, userId);
  },

  async getOnlineUsers() {
    return await redis.smembers(REDIS_KEYS.onlineUsers);
  },

  async getOnlineFriends(userIds) {
    if (!userIds.length) return [];
    const multi = redis.multi();
    userIds.forEach(id => {
      multi.sismember(REDIS_KEYS.onlineUsers, id);
    });
    const results = await multi.exec();
    return userIds.filter((_, index) => results[index][1] === 1);
  },

  // Typing indicators
  async setTyping(conversationId, userId) {
    await redis.sadd(REDIS_KEYS.typing(conversationId), userId);
    await redis.expire(REDIS_KEYS.typing(conversationId), 5); // Auto-expire in 5 seconds
  },

  async removeTyping(conversationId, userId) {
    await redis.srem(REDIS_KEYS.typing(conversationId), userId);
  },

  async getTypingUsers(conversationId) {
    return await redis.smembers(REDIS_KEYS.typing(conversationId));
  },

  // Message caching
  async cacheMessage(conversationId, message) {
    const messageStr = JSON.stringify(message);
    await redis.lpush(REDIS_KEYS.messageCache(conversationId), messageStr);
    await redis.ltrim(REDIS_KEYS.messageCache(conversationId), 0, 49); // Keep last 50 messages
    await redis.expire(REDIS_KEYS.messageCache(conversationId), 3600); // 1 hour TTL
  },

  async getCachedMessages(conversationId, count = 50) {
    const messages = await redis.lrange(REDIS_KEYS.messageCache(conversationId), 0, count - 1);
    return messages.map(msg => JSON.parse(msg)).reverse();
  },

  // Unread counts
  async incrementUnread(userId, conversationId) {
    const multi = redis.multi();
    multi.incr(REDIS_KEYS.unreadCount(userId, conversationId));
    multi.incr(REDIS_KEYS.totalUnread(userId));
    await multi.exec();
  },

  async resetUnread(userId, conversationId) {
    const count = await redis.get(REDIS_KEYS.unreadCount(userId, conversationId)) || 0;
    const multi = redis.multi();
    multi.del(REDIS_KEYS.unreadCount(userId, conversationId));
    multi.decrby(REDIS_KEYS.totalUnread(userId), parseInt(count));
    await multi.exec();
  },

  async getUnreadCount(userId, conversationId) {
    const count = await redis.get(REDIS_KEYS.unreadCount(userId, conversationId));
    return parseInt(count) || 0;
  },

  async getTotalUnread(userId) {
    const count = await redis.get(REDIS_KEYS.totalUnread(userId));
    return parseInt(count) || 0;
  },

  // Pub/Sub
  async publish(channel, data) {
    await redisPub.publish(channel, JSON.stringify(data));
  },

  subscribe(channel, callback) {
    redisSub.subscribe(channel);
    redisSub.on('message', (ch, message) => {
      if (ch === channel) {
        callback(JSON.parse(message));
      }
    });
  },
};

export { redis, redisPub, redisSub };
export default redis;