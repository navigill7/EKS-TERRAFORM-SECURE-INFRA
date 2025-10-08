import express from 'express';
import {
  getConversations,
  getMessages,
  sendMessage,
  markAsRead,
  searchUsers,
  getOnlineStatus,
} from '../controller/chatController.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

router.use(verifyToken);

router.get('/conversations', getConversations);
router.get('/conversations/:conversationId/messages', getMessages);
router.post('/messages', sendMessage);
router.patch('/conversations/:conversationId/read', markAsRead);
router.get('/users/search', searchUsers);
router.post('/users/status', getOnlineStatus);

export default router;