import mongoose from 'mongoose';

const UserPreferencesSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true,
  },
  notifications: {
    'profile-view': {
      type: Boolean,
      default: true, // ✅ Enabled by default
    },
    'like': {
      type: Boolean,
      default: true, // ✅ Enabled by default
    },
    'message': {
      type: Boolean,
      default: true, // ✅ Enabled by default
    },
    'friend-request': {
      type: Boolean,
      default: true, // ✅ Enabled by default
    },
    'friend-post': {
      type: Boolean,
      default: true, // ✅ Enabled by default
    },
  },
  emailNotifications: {
    type: Boolean,
    default: true,
  },
  pushNotifications: {
    type: Boolean,
    default: true,
  },
  quietHours: {
    enabled: {
      type: Boolean,
      default: false,
    },
    start: {
      type: String,
      default: '22:00',
    },
    end: {
      type: String,
      default: '08:00',
    },
  },
}, {
  timestamps: true,
});

// Static method to get or create preferences
UserPreferencesSchema.statics.getOrCreate = async function(userId) {
  let preferences = await this.findOne({ userId });
  
  if (!preferences) {
    console.log(`📝 Creating default preferences for user ${userId}`);
    preferences = await this.create({
      userId,
      notifications: {
        'profile-view': true,  // ✅ All enabled by default
        'like': true,
        'message': true,
        'friend-request': true,
        'friend-post': true,
      },
      emailNotifications: true,
      pushNotifications: true,
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '08:00',
      },
    });
  }
  
  return preferences;
};

// Instance method to check if a notification type is enabled
UserPreferencesSchema.methods.isEnabled = function(notificationType) {
  // Check if notification type exists in preferences
  if (this.notifications && notificationType in this.notifications) {
    return this.notifications[notificationType] === true;
  }
  
  // If notification type doesn't exist in schema, default to true
  console.warn(`⚠️ Unknown notification type: ${notificationType}, defaulting to enabled`);
  return true;
};

// Instance method to check if user is in quiet hours
UserPreferencesSchema.methods.isInQuietHours = function() {
  if (!this.quietHours || !this.quietHours.enabled) {
    return false;
  }

  const now = new Date();
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  
  const start = this.quietHours.start;
  const end = this.quietHours.end;

  // Handle quiet hours that span midnight
  if (start > end) {
    return currentTime >= start || currentTime < end;
  } else {
    return currentTime >= start && currentTime < end;
  }
};

// Instance method to update a specific notification preference
UserPreferencesSchema.methods.updateNotificationPreference = async function(notificationType, enabled) {
  if (notificationType in this.notifications) {
    this.notifications[notificationType] = enabled;
    await this.save();
    return true;
  }
  return false;
};

// Instance method to enable all notifications
UserPreferencesSchema.methods.enableAllNotifications = async function() {
  this.notifications = {
    'profile-view': true,
    'like': true,
    'message': true,
    'friend-request': true,
    'friend-post': true,
  };
  await this.save();
  return this;
};

// Instance method to disable all notifications
UserPreferencesSchema.methods.disableAllNotifications = async function() {
  this.notifications = {
    'profile-view': false,
    'like': false,
    'message': false,
    'friend-request': false,
    'friend-post': false,
  };
  await this.save();
  return this;
};

const UserPreferences = mongoose.model('UserPreferences', UserPreferencesSchema);

export default UserPreferences;