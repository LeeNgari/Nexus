import userRoutes from './routes/userRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import roomRoutes from './routes/rooms.js';
import fileRoutes from './routes/fileRoutes.js';

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/authRoutes.js'; 

const app = express();

// Middleware
app.use(cors({
  origin: 'http://localhost:5173', // Your React app's origin
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);
// Add to your routes

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
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});