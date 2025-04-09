import userRoutes from './routes/userRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import roomRoutes from './routes/rooms.js';
import fileRoutes from './routes/fileRoutes.js';
import { setupSocket } from './services/socket2.js'; // Import your socket service

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/authRoutes.js';
import { createServer } from 'http'; // Import http module for Socket.IO

const app = express();

// Middleware
app.use(cors({
  origin: "http://localhost:5173", // Your React app's origin
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/files', fileRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;

// Create HTTP server instead of directly listening with Express
const server = createServer(app);

// Set up Socket.IO
const io = setupSocket(server);

// Start the server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Make io accessible to other parts of the app if needed
app.set('io', io);