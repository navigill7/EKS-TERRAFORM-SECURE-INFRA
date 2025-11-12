import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  type: {
    type: String,
    enum: ['like', 'message', 'profile-view', 'friend-post', 'friend-request'],
    required: true,
  },
  actorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  actorName: {
    type: String,
    required: true,
  },
  actorPicture: {
    type: String,
    default: '',
  },
  relatedId: {
    type: mongoose.Schema.Types.ObjectId,
    
  },
  message: {
    type: String,
    required: true,
  },
  read: {
    type: Boolean,
    default: false,
  },
  priority: {
    type: String,
    enum: ['high', 'medium', 'low'],
    default: 'medium',
  },
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {},
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
  },
}, {
  timestamps: true,
});


NotificationSchema.index({ userId: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, read: 1 });
NotificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); 


NotificationSchema.virtual('isGrouped').get(function() {
  return this.metadata?.get('groupCount') > 1;
});

NotificationSchema.virtual('groupCount').get(function() {
  return this.metadata?.get('groupCount') || 1;
});

const Notification = mongoose.model('Notification', NotificationSchema);

export default Notification;