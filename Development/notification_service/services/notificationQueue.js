import Queue from 'bull';
import Notification from '../models/Notification.js';
import UserPreferences from '../models/UserPreferences.js';
import { emitToUser } from './socketService.js';
import redis from '../config/redis.js';

// Create notification queue
const notificationQueue = new Queue('notifications', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD,
  },
});

// Priority mapping
const PRIORITY_MAP = {
  message: { priority: 1, delay: 0 },           // Instant
  'friend-request': { priority: 2, delay: 0 },  // Instant
  like: { priority: 3, delay: 2000 },           // 2 second delay (for grouping)
  'profile-view': { priority: 4, delay: 3000 }, // 3 second delay
  'friend-post': { priority: 5, delay: 5000 },  // 5 second delay
};

// Deduplication key generator
const getDeduplicationKey = (type, userId, actorId, relatedId) => {
  return `notification:dedup:${type}:${userId}:${actorId}:${relatedId || 'none'}`;
};

// Add notification to queue
export const queueNotification = async (notificationData) => {
  const { type, userId } = notificationData;
  
  // Get priority and delay
  const { priority, delay } = PRIORITY_MAP[type] || { priority: 5, delay: 3000 };
  
  // Add to queue with priority
  await notificationQueue.add(notificationData, {
    priority,
    delay,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  });
  
  console.log(`📥 Queued ${type} notification for user ${userId}`);
};

// Process notification queue
notificationQueue.process(async (job) => {
  const data = job.data;
  
  try {
    console.log(`⚙️ Processing ${data.type} notification for user ${data.userId}`);
    
    // 1. Check user preferences
    const preferences = await UserPreferences.getOrCreate(data.userId);
    
    if (!preferences.isEnabled(data.type)) {
      console.log(`⏭️ Notifications disabled for ${data.type}`);
      return { skipped: true, reason: 'disabled' };
    }
    
    // 2. Check deduplication (for groupable notifications)
    if (['like', 'profile-view'].includes(data.type)) {
      const dedupKey = getDeduplicationKey(
        data.type,
        data.userId,
        data.actorId,
        data.relatedId
      );
      
      const existing = await redis.get(dedupKey);
      
      if (existing) {
        // Update existing notification with group count
        const notificationId = existing;
        const notification = await Notification.findById(notificationId);
        
        if (notification) {
          const currentCount = notification.metadata?.get('groupCount') || 1;
          notification.metadata.set('groupCount', currentCount + 1);
          
          // Update message for grouped notifications
          if (currentCount === 1) {
            notification.message = `${data.actorName} and 1 other ${data.type === 'like' ? 'liked' : 'viewed'} your ${data.type === 'like' ? 'post' : 'profile'}`;
          } else {
            notification.message = `${data.actorName} and ${currentCount} others ${data.type === 'like' ? 'liked' : 'viewed'} your ${data.type === 'like' ? 'post' : 'profile'}`;
          }
          
          await notification.save();
          
          // Emit updated notification
          emitToUser(data.userId, 'notification:updated', notification);
          
          console.log(`🔄 Grouped notification updated (count: ${currentCount + 1})`);
          return { grouped: true, notificationId };
        }
      }
    }
    
    // 3. Create new notification
    const notification = await Notification.create({
      userId: data.userId,
      type: data.type,
      actorId: data.actorId,
      actorName: data.actorName,
      actorPicture: data.actorPicture || '',
      relatedId: data.relatedId || null,
      message: data.message,
      priority: data.priority || 'medium',
      metadata: data.metadata || {},
    });
    
    console.log(`✅ Notification created: ${notification._id}`);
    
    // 4. Set deduplication key (5 minute window for grouping)
    if (['like', 'profile-view'].includes(data.type)) {
      const dedupKey = getDeduplicationKey(
        data.type,
        data.userId,
        data.actorId,
        data.relatedId
      );
      await redis.setex(dedupKey, 300, notification._id.toString()); // 5 minutes
    }
    
    // 5. Emit to user via Socket.IO
    emitToUser(data.userId, 'notification:new', notification);
    
    return { success: true, notificationId: notification._id };
    
  } catch (error) {
    console.error('❌ Error processing notification:', error);
    throw error; // Will trigger retry
  }
});

// Queue event handlers
notificationQueue.on('completed', (job, result) => {
  console.log(`✅ Job ${job.id} completed:`, result);
});

notificationQueue.on('failed', (job, err) => {
  console.error(`❌ Job ${job.id} failed:`, err.message);
});

notificationQueue.on('stalled', (job) => {
  console.warn(`⚠️ Job ${job.id} stalled`);
});

export default notificationQueue;