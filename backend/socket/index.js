import { Server } from 'socket.io';
import { setupAuth } from './auth.js';
import { setupHandlers } from './handlers/index.js';
import { updateUserPresence } from './services/presenceService.js';

export function setupSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true
    },
    transports: ['websocket', 'polling']
  });

  // Setup authentication middleware
  io.use(setupAuth);

  // Setup connection handlers
  io.on('connection', async (socket) => {
    const userId = socket.userId;
    console.log(`User connected: ${userId} (Socket ID: ${socket.id})`);

    // Notify all clients about this user coming online
    const userStatus = await updateUserPresence(userId, true);
    io.emit('user_status_update', {
      userId: userStatus.id,
      isOnline: userStatus.is_online,
      lastActive: userStatus.last_active?.toISOString()
    });

    // Join personal room
    const personalRoom = `user_${userId}`;
    socket.join(personalRoom);
    console.log(`User ${userId} joined personal room: ${personalRoom}`);

    // Emit session info
    socket.emit('session_info', { userId });

    // Setup all event handlers
    setupHandlers(io, socket);

    socket.on('disconnect', async (reason) => {
      console.log(`User disconnected: ${userId} (Reason: ${reason})`);
      
      // Update user status and notify
      const userStatus = await updateUserPresence(userId, false);
      io.emit('user_status_update', {
        userId: userStatus.id,
        isOnline: userStatus.is_online,
        lastActive: userStatus.last_active?.toISOString()
      });
    });
  });

  console.log("Socket.IO server initialized successfully.");
  return io;
}