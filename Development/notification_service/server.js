import express from 'express';
import { createServer } from 'http';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

import notificationRoutes from './routes/notifications.js';
import preferencesRoutes from './routes/preferences.js';
import { initializeSocket } from './services/socketService.js';
import { initializeEventListener } from './services/eventListener.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.MAIN_APP_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    service: 'notification-service',
    timestamp: new Date().toISOString(),
  });
});

// Routes
app.use('/api/notifications', notificationRoutes);
app.use('/api/notifications/preferences', preferencesRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// Initialize services
const PORT = process.env.PORT || 4001;

mongoose
  .connect(process.env.MONGO_URL)
  .then(() => {
    console.log('✅ Notification Service - MongoDB connected');
    
    // Initialize Socket.IO
    initializeSocket(httpServer);
    
    // Initialize Redis event listener
    initializeEventListener();
    
    // Start server
    httpServer.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Notification Service running on port ${PORT}`);
      console.log(`📡 WebSocket ready for connections`);
      console.log(`🎧 Listening for notification events from Redis`);
    });
  })
  .catch((error) => {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  });

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  httpServer.close(() => {
    console.log('Server closed');
    mongoose.connection.close(false, () => {
      console.log('MongoDB connection closed');
      process.exit(0);
    });
  });
});

export default app;