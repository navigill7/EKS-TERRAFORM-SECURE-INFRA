import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import chatRoutes from './routes/chat.js';
import { socketAuth } from './middleware/auth.js';
import { initializeSocket } from './utils/socket.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.MAIN_APP_URL || 'http://localhost:3000',
    credentials: true,
  },
});

// Middleware
app.use(cors({
  origin: process.env.MAIN_APP_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', service: 'chat-service' });
});

// Routes
app.use('/api/chat', chatRoutes);

// Socket.IO authentication middleware
io.use(socketAuth);

// Initialize Socket.IO handlers
initializeSocket(io);

// MongoDB connection
const PORT = process.env.PORT || 4000;
mongoose
  .connect(process.env.MONGO_URL)
  .then(() => {
    console.log('✅ Chat Service - MongoDB connected');
    httpServer.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Chat Service running on port ${PORT}`);
      console.log(`📡 WebSocket ready for connections`);
    });
  })
  .catch((error) => {
    console.error('❌ MongoDB connection error:', error);
  });