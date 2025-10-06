import mongoose from 'mongoose';

const ConversationSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  }],
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
  },
  lastMessageAt: {
    type: Date,
    default: Date.now,
  },
  unreadCount: {
    type: Map,
    of: Number,
    default: {},
  },
}, {
  timestamps: true,
});

// Index for faster queries
ConversationSchema.index({ participants: 1 });
ConversationSchema.index({ lastMessageAt: -1 });

// Method to get or create conversation between two users
ConversationSchema.statics.getOrCreate = async function(userId1, userId2) {
  let conversation = await this.findOne({
    participants: { $all: [userId1, userId2] },
  }).populate('lastMessage');

  if (!conversation) {
    conversation = await this.create({
      participants: [userId1, userId2],
      unreadCount: {
        [userId1]: 0,
        [userId2]: 0,
      },
    });
  }

  return conversation;
};

const Conversation = mongoose.model('Conversation', ConversationSchema);

export default Conversation;