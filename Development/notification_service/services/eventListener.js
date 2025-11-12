import { subscribeToNotificationEvents, NOTIFICATION_CHANNELS } from '../config/redis.js';
import { queueNotification } from './notificationQueue.js';

// Message generators for different notification types
const messageGenerators = {
  like: (data) => `${data.actorName} liked your post`,
  message: (data) => `${data.actorName} sent you a message`,
  'profile-view': (data) => `${data.actorName} viewed your profile`,
  'friend-post': (data) => `${data.actorName} shared a new post`,
  'friend-request': (data) => `${data.actorName} sent you a friend request`,
};

// Initialize event listener
export const initializeEventListener = () => {
  console.log('🎧 Initializing notification event listener...');

  subscribeToNotificationEvents(async (channel, data) => {
    console.log(`📨 Received event from ${channel}:`, data);

    try {
      // Validate required fields
      if (!data.userId || !data.actorId || !data.actorName) {
        console.error('❌ Invalid notification data:', data);
        return;
      }

      // Determine notification type from channel
      let type;
      switch (channel) {
        case NOTIFICATION_CHANNELS.LIKE:
          type = 'like';
          break;
        case NOTIFICATION_CHANNELS.MESSAGE:
          type = 'message';
          break;
        case NOTIFICATION_CHANNELS.PROFILE_VIEW:
          type = 'profile-view';
          break;
        case NOTIFICATION_CHANNELS.FRIEND_POST:
          type = 'friend-post';
          break;
        case NOTIFICATION_CHANNELS.FRIEND_REQUEST:
          type = 'friend-request';
          break;
        default:
          console.warn(`⚠️ Unknown channel: ${channel}`);
          return;
      }

      // Generate notification message
      const message = messageGenerators[type]?.(data) || 'New notification';

      // Prepare notification data
      const notificationData = {
        userId: data.userId,
        type,
        actorId: data.actorId,
        actorName: data.actorName,
        actorPicture: data.actorPicture || '',
        relatedId: data.relatedId || null,
        message,
        priority: data.priority || 'medium',
        metadata: data.metadata || {},
      };

      // Add to queue for processing
      await queueNotification(notificationData);

    } catch (error) {
      console.error('❌ Error processing notification event:', error);
    }
  });

  console.log('✅ Event listener initialized');
};

// Handle specific notification types with custom logic
export const handleLikeNotification = (data) => {
  // Can add custom logic here if needed
  return {
    ...data,
    priority: 'medium',
  };
};

export const handleMessageNotification = (data) => {
  return {
    ...data,
    priority: 'high', // Messages are high priority
  };
};

export const handleProfileViewNotification = (data) => {
  return {
    ...data,
    priority: 'low', // Profile views are low priority
  };
};

export const handleFriendPostNotification = (data) => {
  return {
    ...data,
    priority: 'low',
  };
};

export const handleFriendRequestNotification = (data) => {
  return {
    ...data,
    priority: 'high',
  };
};

export default { initializeEventListener };