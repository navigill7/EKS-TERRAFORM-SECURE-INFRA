import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();


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

// Separate Redis clients for Pub/Sub (recommended practice)
const redisPub = redis.duplicate();
const redisSub = redis.duplicate();

redis.on('connect', () => {
  console.log('✅ Redis connected');
});

redis.on('error', (err) => {
  console.error('❌ Redis error:', err);
});

redisPub.on('connect', () => {
  console.log('✅ Redis Publisher connected');
});

redisSub.on('connect', () => {
  console.log('✅ Redis Subscriber connected');
});

// Notification event channels
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
    await redisPub.publish(channel, JSON.stringify(data));
    console.log(`📢 Published to ${channel}:`, data);
  } catch (error) {
    console.error(`❌ Error publishing to ${channel}:`, error);
  }
};

// Helper to subscribe to notification events
export const subscribeToNotificationEvents = (callback) => {
  const channels = Object.values(NOTIFICATION_CHANNELS);
  
  redisSub.subscribe(...channels, (err, count) => {
    if (err) {
      console.error('❌ Failed to subscribe:', err);
    } else {
      console.log(`✅ Subscribed to ${count} notification channels`);
    }
  });

  redisSub.on('message', (channel, message) => {
    try {
      const data = JSON.parse(message);
      callback(channel, data);
    } catch (error) {
      console.error('❌ Error parsing message:', error);
    }
  });
};

export { redis, redisPub, redisSub };
export default redis;