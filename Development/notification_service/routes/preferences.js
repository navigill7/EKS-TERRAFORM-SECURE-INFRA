import express from 'express';
import {
  getPreferences,
  updatePreferences,
} from '../controllers/notificationController.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication middleware
router.use(verifyToken);

// Get user preferences
router.get('/', getPreferences);

// Update user preferences
router.patch('/', updatePreferences);

export default router;