// server/config/redis.js (NEW FILE)
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
});

redis.on('connect', () => {
  console.log('✅ Main Backend - Redis connected');
});

redis.on('error', (err) => {
  console.error('❌ Main Backend - Redis error:', err);
});

// Notification channels
export const NOTIFICATION_CHANNELS = {
  LIKE: 'notification:like',
  MESSAGE: 'notification:message',
  PROFILE_VIEW: 'notification:profile-view',
  FRIEND_POST: 'notification:friend-post',
  FRIEND_REQUEST: 'notification:friend-request',
};

// Helper to publish notification events
export const publishNotificationEvent = async (channel, data) => {
  try {
    await redis.publish(channel, JSON.stringify(data));
    console.log(`📢 Published notification event to ${channel}`);
  } catch (error) {
    console.error(`❌ Error publishing to ${channel}:`, error);
  }
};

export default redis;