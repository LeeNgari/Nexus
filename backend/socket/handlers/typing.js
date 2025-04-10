import { startTyping, stopTyping, getTypingStatus } from '../services/typingService.js';
import db from "../../config/db.js";
import {findPrivateChatByIdAndUser} from "../services/chatService.js";
export function setupTypingHandlers(io, socket) {
  const userId = socket.userId;

  // Helper function to get username
  async function getUsername() {
    const result = await db.query(
      'SELECT username FROM users WHERE id = $1',
      [userId]
    );
    return result.rows[0]?.username || 'Unknown';
  }

  // Typing start handler
  socket.on('typing_start', async (payload) => {
    const { chatId, groupId } = payload || {};
    if (!chatId && !groupId) return;

    const username = await getUsername();
    startTyping(userId, chatId, groupId);

    // Notify other participants
    if (groupId) {
      // Group chat - broadcast to room except sender
      socket.to(`room_${groupId}`).emit('user_typing_status', {
        groupId,
        userId,
        username,
        isTyping: true
      });
    } else if (chatId) {
      // Private chat - send to other user only
      const chat = await findPrivateChatByIdAndUser(chatId, userId);
      if (chat) {
        const recipientId = chat.user1_id === userId ? chat.user2_id : chat.user1_id;
        io.to(`user_${recipientId}`).emit('user_typing_status', {
          chatId,
          userId,
          username,
          isTyping: true
        });
      }
    }
  });

  // Typing stop handler
  socket.on('typing_stop', async (payload) => {
    const { chatId, groupId } = payload || {};
    if (!chatId && !groupId) return;

    const username = await getUsername();
    stopTyping(userId, chatId, groupId);

    // Notify other participants
    if (groupId) {
      socket.to(`room_${groupId}`).emit('user_typing_status', {
        groupId,
        userId,
        username,
        isTyping: false
      });
    } else if (chatId) {
      const chat = await findPrivateChatByIdAndUser(chatId, userId);
      if (chat) {
        const recipientId = chat.user1_id === userId ? chat.user2_id : chat.user1_id;
        io.to(`user_${recipientId}`).emit('user_typing_status', {
          chatId,
          userId,
          username,
          isTyping: false
        });
      }
    }
  });
}