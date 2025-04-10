import { getUserPrivateChats } from "../../utils/helpers.js";
import { findRoomsByUser } from "../../models/Room.js";
import { getUserPrivateChatsWithAvatars } from '../services/chatService.js';


export function setupChatHandlers(io, socket) {
  const userId = socket.userId;

  // get_user_chats
  socket.on('get_user_chats', async (_, callback) => {
    if (typeof callback !== 'function') return;
    console.log(`User ${userId} requested their chats`);
    
    try {
      const [privateChats, groupChats] = await Promise.all([
        getUserPrivateChatsWithAvatars(userId),
        findRoomsByUser(userId)
      ]);

      // Format the response to include avatar URLs
      const formattedPrivateChats = privateChats.map(chat => ({
        id: chat.id,
        type: 'private',
        name: chat.other_user_username,
        avatar_url: chat.other_user_avatar_url,
        other_user_id: chat.other_user_id,
        created_at: chat.created_at
      }));

      const formattedGroupChats = groupChats.map(room => ({
        id: room.id,
        type: 'group',
        name: room.name,
        avatar_url: room.avatar_url,
        created_by: room.created_by,
        is_private: room.is_private,
        created_at: room.created_at
      }));

      // Join group rooms
      groupChats.forEach(room => socket.join(`room_${room.id}`));
      console.log(`User ${userId} joined ${groupChats.length} group rooms.`);
      
      callback({ 
        private: formattedPrivateChats, 
        group: formattedGroupChats 
      });
    } catch (error) {
      console.error(`Error fetching chats for user ${userId}:`, error);
      callback({ error: 'Failed to load your conversations.' });
    }
  });
}