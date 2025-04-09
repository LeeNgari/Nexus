import { Server } from 'socket.io';
import Session from '../models/Sessions.js';
import {findRoomsByUser} from "../models/Room.js";
import {getUserPrivateChats} from "../utils/helpers.js";

export function setupSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  // Authentication middleware using session cookie
  io.use(async (socket, next) => {
    const sessionId = socket.handshake.headers.cookie
        ?.split(';')
        ?.find(c => c.trim().startsWith('sessionId='))
        ?.split('=')[1];

    if (!sessionId) {
      return next(new Error('Authentication error'));
    }

    try {
      const session = await Session.findValid(sessionId);
      if (!session) {
        return next(new Error('Session expired'));
      }

      // Attach user ID to socket
      socket.userId = session.user_id;
      next();
    } catch (err) {
      console.error('Socket authentication error:', err);
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.userId}`);

    // Join user to their personal room for private messages
    socket.join(`user_${socket.userId}`);

    socket.on('get_user_chats', async (_, callback) => {
      try {
        const [privateChats, groupChats] = await Promise.all([
          getUserPrivateChats(socket.userId),
          findRoomsByUser(socket.userId)
        ]);

        callback({ private: privateChats, group: groupChats });
      } catch (error) {
        console.error('Failed to fetch user chats:', error);
        callback({ error: 'Failed to get chats' });
      }
    });

    


  });

  return io;
}
