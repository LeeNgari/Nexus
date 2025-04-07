import socketio from 'socket.io';
import Session from '../models/Sessions.js';
import {updateUserStatus,
    checkRoomAccess,
    checkPrivateChatAccess,
    saveMessage,
    getPrivateChatParticipants, 
    getRoomParticipants,
    getUserById,
    getMessageById,
    markMessageAsRead,
    getUserLastActive,
    notifyUserStatusChange,
    getUserPrivateChats,
    getUserRooms,
  } from "../utils/helpers.js"
export function setupSocket(server) {
  const io = socketio(server, {
    cors: {
      origin: "http://localhost:5000",
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
    
    // Connection events
    socket.on('disconnect', () => handleDisconnect(socket, io));
    socket.on('join-room', (roomId) => handleJoinRoom(socket, roomId));
    socket.on('leave-room', (roomId) => handleLeaveRoom(socket, roomId));
    
    // Messaging events
    socket.on('new-message', (data) => handleNewMessage(socket, io, data));
    socket.on('typing-start', (data) => handleTypingStart(socket, io, data));
    socket.on('typing-end', (data) => handleTypingEnd(socket, io, data));
    socket.on('mark-message-read', (data) => handleMarkMessageRead(socket, io, data));
  });

  return io;
}

// Connection handlers
async function handleDisconnect(socket, io) {
  console.log(`User disconnected: ${socket.userId}`);
  // Update user status to offline
  await updateUserStatus(socket.userId, false);
  // Notify relevant users about disconnection
  await notifyUserStatusChange(io, socket.userId, false);
}

async function handleJoinRoom(socket, roomId) {
  try {
    // Verify user has access to the room
    const hasAccess = await checkRoomAccess(socket.userId, roomId);
    if (!hasAccess) {
      return socket.emit('error', { message: 'Access denied' });
    }
    
    socket.join(`room_${roomId}`);
    socket.emit('room-joined', { roomId });
  } catch (err) {
    socket.emit('error', { message: err.message });
  }
}

function handleLeaveRoom(socket, roomId) {
  socket.leave(`room_${roomId}`);
  socket.emit('room-left', { roomId });
}

// Message handlers
async function handleNewMessage(socket, io, data) {
  try {
    const { roomId, privateChatId, content, file } = data;
    
    // Validate message data
    if (!content && !file) {
      return socket.emit('error', { message: 'Message content or file is required' });
    }
    
    // Check if user has permission to send message to this chat/room
    const hasPermission = privateChatId 
      ? await checkPrivateChatAccess(socket.userId, privateChatId)
      : await checkRoomAccess(socket.userId, roomId);
      
    if (!hasPermission) {
      return socket.emit('error', { message: 'Permission denied' });
    }
    
    // Save message to database
    const message = await saveMessage({
      senderId: socket.userId,
      content,
      roomId,
      privateChatId,
      fileUrl: file?.url,
      fileType: file?.type,
      fileSize: file?.size
    });
    
    // Get recipients
    const recipients = privateChatId
      ? await getPrivateChatParticipants(privateChatId)
      : await getRoomParticipants(roomId);
      
    const messageData = {
      ...message,
      sender: await getUserById(socket.userId)
    };
    
    // Emit to sender (for confirmation)
    socket.emit('message-sent', messageData);
    
    // Emit to other recipients
    for (const userId of recipients) {
      if (userId !== socket.userId) {
        io.to(`user_${userId}`).emit('new-message', messageData);
        if (privateChatId) {
          io.to(`user_${userId}`).emit('private-chat-update', {
            chatId: privateChatId,
            lastMessage: messageData
          });
        }
      }
    }
    
    // If it's a room message, also emit to room
    if (roomId) {
      io.to(`room_${roomId}`).emit('new-message', messageData);
    }
    
  } catch (err) {
    socket.emit('error', { message: err.message });
  }
}

async function handleTypingStart(socket, io, data) {
  const { roomId, privateChatId } = data;
  
  if (roomId) {
    socket.to(`room_${roomId}`).emit('typing-start', {
      userId: socket.userId,
      roomId
    });
  } else if (privateChatId) {
    const participants = await getPrivateChatParticipants(privateChatId);
    const otherUserId = participants.find(id => id !== socket.userId);
    if (otherUserId) {
      io.to(`user_${otherUserId}`).emit('typing-start', {
        userId: socket.userId,
        privateChatId
      });
    }
  }
}

async function handleTypingEnd(socket, io, data) {
  const { roomId, privateChatId } = data;
  
  if (roomId) {
    socket.to(`room_${roomId}`).emit('typing-end', {
      userId: socket.userId,
      roomId
    });
  } else if (privateChatId) {
    const participants = await getPrivateChatParticipants(privateChatId);
    const otherUserId = participants.find(id => id !== socket.userId);
    if (otherUserId) {
      io.to(`user_${otherUserId}`).emit('typing-end', {
        userId: socket.userId,
        privateChatId
      });
    }
  }
}

async function handleMarkMessageRead(socket, io, data) {
  try {
    const { messageId } = data;
    
    // Update read status in database
    await markMessageAsRead(messageId, socket.userId);
    
    // Notify sender that their message was read
    const message = await getMessageById(messageId);
    if (message.senderId !== socket.userId) {
      io.to(`user_${message.senderId}`).emit('message-read', {
        messageId,
        readBy: socket.userId
      });
    }
    
    socket.emit('read-status-updated', { messageId });
  } catch (err) {
    socket.emit('error', { message: err.message });
  }
}

// Fixed notifyUserStatusChange function
async function notifyUserStatusChange(io, userId, isOnline) {
  try {
    // Get all rooms and private chats where this user participates
    const rooms = await getUserRooms(userId);
    const privateChats = await getUserPrivateChats(userId);
    
    // Get last active time once
    const lastActive = isOnline ? new Date() : await getUserLastActive(userId);
    
    // Notify room members
    for (const room of rooms) {
      io.to(`room_${room.id}`).emit('user-status-changed', {
        userId,
        isOnline,
        lastActive
      });
    }
    
    // Notify private chat participants
    for (const chat of privateChats) {
      const otherUserId = chat.user1_id === userId ? chat.user2_id : chat.user1_id;
      io.to(`user_${otherUserId}`).emit('user-status-changed', {
        userId,
        isOnline,
        lastActive
      });
    }
  } catch (error) {
    console.error('Error notifying user status change:', error);
  }
}

// Helper functions that would normally be imported or defined elsewhere
/*
async function updateUserStatus(userId, isOnline) {
  // Implementation depends on your database schema
}

async function checkRoomAccess(userId, roomId) {
  // Implementation depends on your authorization logic
  return true; // Placeholder
}

async function checkPrivateChatAccess(userId, chatId) {
  // Implementation depends on your authorization logic
  return true; // Placeholder
}

async function saveMessage(messageData) {
  // Implementation depends on your database schema
  return { id: 'msg_' + Date.now(), ...messageData, createdAt: new Date() }; // Placeholder
}

async function getPrivateChatParticipants(chatId) {
  // Implementation depends on your database schema
  return []; // Placeholder
}

async function getRoomParticipants(roomId) {
  // Implementation depends on your database schema
  return []; // Placeholder
}

async function getUserById(userId) {
  // Implementation depends on your database schema
  return { id: userId, username: `User-${userId}` }; // Placeholder
}

async function getMessageById(messageId) {
  // Implementation depends on your database schema
  return { id: messageId, senderId: '123' }; // Placeholder
}

async function markMessageAsRead(messageId, userId) {
  // Implementation depends on your database schema
}

async function getUserRooms(userId) {
  // Implementation depends on your database schema
  return []; // Placeholder
}

async function getUserPrivateChats(userId) {
  // Implementation depends on your database schema
  return []; // Placeholder
}

async function getUserLastActive(userId) {
  // Implementation depends on your database schema
  return new Date(); // Placeholder
}

*/

export default setupSocket;