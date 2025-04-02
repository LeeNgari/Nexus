import { findUserById, updateUserOnlineStatus } from '../models/User.js';
import { findRoomById } from '../models/Room.js';
import { findPrivateChat } from '../models/PrivateChat.js';
import { 
  createMessage, 
  markMessageAsRead,
  getPrivateChatMessages
} from '../models/Message.js';

export const handleConnection = (io, socket) => {
  // Join user to their personal room for notifications
  socket.join(`user_${socket.userId}`);
  
  // Initialize presence detection
  setupPresenceDetection(io, socket);

  // Group Chat Handlers
  setupGroupChatHandlers(io, socket);

  // Private Chat Handlers
  setupPrivateChatHandlers(io, socket);

  // Message Read Receipts
  setupReadReceiptHandlers(io, socket);

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });
};

const setupPresenceDetection = (io, socket) => {
  let heartbeatInterval;

  const updatePresence = async (isOnline) => {
    try {
      await updateUserOnlineStatus(socket.userId, isOnline);
      io.emit('presence-update', { 
        userId: socket.userId, 
        isOnline,
        lastActive: new Date().toISOString()
      });
    } catch (error) {
      console.error('Presence update error:', error);
    }
  };

  // Cleanup on disconnect
  socket.on('disconnect', async () => {
    clearInterval(heartbeatInterval);
    await updatePresence(false);
  });

  // Manual heartbeat from client
  socket.on('heartbeat', () => {
    updatePresence(true);
  });

  // Automatic heartbeat check
  heartbeatInterval = setInterval(() => {
    updatePresence(true);
  }, 30000); // Every 30 seconds

  // Initial presence update
  updatePresence(true);
};

const setupGroupChatHandlers = (io, socket) => {
  // Handle joining group chat room
  socket.on('join-room', async (roomId) => {
    try {
      const room = await findRoomById(roomId);
      if (!room) {
        return socket.emit('error', { message: 'Room not found' });
      }

      if (!room.members.some(m => m.id === socket.userId)) {
        return socket.emit('error', { message: 'Not a member of this room' });
      }

      socket.join(roomId);
      socket.emit('room-joined', { roomId });
      
      // Notify room members about user's presence
      io.to(roomId).emit('user-presence', { 
        userId: socket.userId, 
        isOnline: true 
      });
    } catch (error) {
      socket.emit('error', { message: 'Error joining room' });
    }
  });

  // Handle leaving group chat room
  socket.on('leave-room', (roomId) => {
    socket.leave(roomId);
    io.to(roomId).emit('user-presence', { 
      userId: socket.userId, 
      isOnline: false 
    });
  });

  // Handle new group messages
  socket.on('send-group-message', async ({ roomId, content, type = 'text' }) => {
    try {
      const user = await findUserById(socket.userId);
      if (!user) {
        return socket.emit('error', { message: 'User not found' });
      }

      const message = await createMessage({
        sender_id: socket.userId,
        room_id: roomId,
        content,
        type
      });

      // Broadcast to room
      io.to(roomId).emit('new-group-message', message);

      // Notify offline members
      const room = await findRoomById(roomId);
      room.members.forEach(member => {
        if (!io.sockets.adapter.rooms.get(`user_${member.id}`)?.has(socket.id)) {
          io.to(`user_${member.id}`).emit('new-message-notification', {
            roomId,
            senderId: socket.userId,
            preview: content.substring(0, 50)
          });
        }
      });
    } catch (error) {
      socket.emit('error', { message: 'Error sending message' });
    }
  });
};

const setupPrivateChatHandlers = (io, socket) => {
  // Handle joining private chat
  socket.on('join-private-chat', async (partnerId) => {
    try {
      const chat = await findPrivateChat(socket.userId, partnerId);
      if (!chat) {
        return socket.emit('error', { message: 'Chat not found' });
      }

      const chatId = `private_${chat.id}`;
      socket.join(chatId);
      socket.emit('private-chat-joined', { chatId });
    } catch (error) {
      socket.emit('error', { message: 'Error joining private chat' });
    }
  });

  // Handle new private messages
  socket.on('send-private-message', async ({ partnerId, content, type = 'text' }) => {
    try {
      const chat = await findPrivateChat(socket.userId, partnerId);
      if (!chat) {
        return socket.emit('error', { message: 'Chat not found' });
      }

      const message = await createMessage({
        sender_id: socket.userId,
        private_chat_id: chat.id,
        content,
        type
      });

      const chatId = `private_${chat.id}`;
      
      // Broadcast to private chat
      io.to(chatId).emit('new-private-message', message);

      // Notify partner if they're not in the chat
      if (!io.sockets.adapter.rooms.get(chatId)?.has(partnerId)) {
        io.to(`user_${partnerId}`).emit('new-private-message-notification', {
          senderId: socket.userId,
          preview: content.substring(0, 50),
          chatId: chat.id
        });
      }
    } catch (error) {
      socket.emit('error', { message: 'Error sending private message' });
    }
  });

  // Handle typing indicators in private chat
  socket.on('private-typing-start', (partnerId) => {
    io.to(`user_${partnerId}`).emit('private-typing', {
      userId: socket.userId,
      isTyping: true
    });
  });

  socket.on('private-typing-end', (partnerId) => {
    io.to(`user_${partnerId}`).emit('private-typing', {
      userId: socket.userId,
      isTyping: false
    });
  });
};

const setupReadReceiptHandlers = (io, socket) => {
  // Handle message read receipts for group messages
  socket.on('mark-group-message-read', async (messageId) => {
    try {
      const readReceipt = await markMessageAsRead(messageId, socket.userId);
      if (readReceipt) {
        io.to(`user_${readReceipt.message.sender_id}`).emit('group-message-read', {
          messageId,
          readBy: socket.userId,
          readAt: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error marking group message as read:', error);
    }
  });

  // Handle message read receipts for private messages
  socket.on('mark-private-message-read', async (messageId) => {
    try {
      const readReceipt = await markMessageAsRead(messageId, socket.userId);
      if (readReceipt) {
        io.to(`user_${readReceipt.message.sender_id}`).emit('private-message-read', {
          messageId,
          readBy: socket.userId,
          readAt: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error marking private message as read:', error);
    }
  });
};