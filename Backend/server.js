import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './src/config/database.js';
import { initializeSocket } from './src/sockets/index.js';
import { notFound, errorHandler } from './src/middlewares/error.handler.js';
import { PollService } from './src/services/poll.service.js';

dotenv.config();
const app = express();
const server = createServer(app);

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  },
  pingTimeout: 10000,
  pingInterval: 5000
});

app.set('io', io);

initializeSocket(io);

// Database connection
connectDB().catch(err => {
  console.error('Database connection failed', err);
  process.exit(1);
});

// import routes
import pollRoutes from './src/routes/poll.routes.js';
import userRoutes from './src/routes/user.routes.js';
app.use('/api/polls', pollRoutes);
app.use('/api/users', userRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// 404 Handler
app.use(notFound);

// Error Handler
app.use(errorHandler);

const expiryInterval = setInterval(async () => {
  try {
    const ended = await PollService.endExpiredPolls();
    for (const poll of ended) {
      const results = await PollService.getPollResults(poll._id);
      io.of('/teacher').emit('pollEnded', { pollId: String(poll._id), data: results });
      io.of('/student').emit('pollEnded', { pollId: String(poll._id), data: results });
    }
  } catch (e) {
  }
}, 2000);

// Handle SIGTERM
process.on('SIGTERM', () => {
  console.log('Shutting down gracefully');
  clearInterval(expiryInterval);
  server.close(() => {
    console.log('Process terminated!');
  });
});

const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

server.listen(PORT, () => {
  console.log(`Server running in ${NODE_ENV} mode on port ${PORT}`);
});