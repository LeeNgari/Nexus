import { getUserPrivateChats } from "../../utils/helpers.js";
import { findRoomsByUser } from "../../models/Room.js";
import { getUserPrivateChatsWithAvatars ,
  getUserPrivateChatsWithLastMessage, getUserGroupChatsWithLastMessage
} from '../services/chatService.js';


export function setupChatHandlers(io, socket) {
  const userId = socket.userId;

  // get_user_chats
  socket.on('get_user_chats', async (_, callback) => {
   
    if (!userId) {
      return callback({ error: 'Authentication required' });
  }

  try {
      // 1. Fetch private chats with last message timestamp
      const privateChats = await getUserPrivateChatsWithLastMessage(userId);

      // 2. Fetch group chats with last message timestamp
      const groupChats = await getUserGroupChatsWithLastMessage(userId);

      // 3. Prepare for sorting: Create a combined list with a common timestamp for sorting
      //    Use last_message_at if it exists, otherwise fallback to the chat/room creation time.
      const combinedChats = [
          ...privateChats.map(chat => ({
              ...chat,
              type: 'private', // Add type identifier for sorting/separation
              // Use last_message_at for sorting, falling back to created_at if no messages
              sortByTimestamp: chat.last_message_at || chat.created_at
          })),
          ...groupChats.map(chat => ({
              ...chat,
              type: 'group', // Add type identifier
               // Use last_message_at for sorting, falling back to created_at if no messages
              sortByTimestamp: chat.last_message_at || chat.created_at,
               // Add a placeholder/default avatar_url if rooms table doesn't have one
               avatar_url: chat.avatar_url || 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRJZ4KL1u31N_9XR7fharZZUVOy4aQG0a4dkQ&s' // Example default
          }))
      ];

      // 4. Sort the combined list by the determined timestamp (newest first)
      combinedChats.sort((a, b) => {
          const dateA = new Date(a.sortByTimestamp);
          const dateB = new Date(b.sortByTimestamp);

          // Handle cases where sortByTimestamp might still be null or invalid,
          // though the || fallback should prevent this if created_at is always present.
          // A more robust sort handles potential invalid dates:
           if (isNaN(dateA.getTime())) return 1; // a is invalid, b comes first
           if (isNaN(dateB.getTime())) return -1; // b is invalid, a comes first
           return dateB.getTime() - dateA.getTime(); // Descending order (newest first)
      });


      // 5. Separate the sorted list back into private and group arrays
      //    Ensure the structure matches what the frontend ChatApp component expects
      //    (it expects separate 'private' and 'group' arrays, each with items
      //     having properties like id, name, type, other_user_id, avatar_url etc.)
      const sortedPrivate = combinedChats
          .filter(chat => chat.type === 'private')
          .map(chat => ({ // Map back to the expected private chat structure
              id: chat.id,
              other_user_id: chat.other_user_id,
              name: chat.other_user_username, // Frontend uses 'name' for display
              avatar_url: chat.other_user_avatar_url,
              created_at: chat.created_at, // Original creation time
              last_message_at: chat.last_message_at // Include last message time for potential frontend use (e.g., display time in sidebar)
              // hasUnread flag would typically be added here based on message_read_status
          }));

      const sortedGroup = combinedChats
           .filter(chat => chat.type === 'group')
           .map(chat => ({ // Map back to the expected group chat structure
              id: chat.id,
              name: chat.name, // Group name
              avatar_url: chat.avatar_url, // Use the avatar_url determined earlier
              created_at: chat.created_at, // Original creation time
              last_message_at: chat.last_message_at // Include last message time
               // hasUnread flag would typically be added here based on message_read_status
           }));


      // 6. Send the sorted lists back to the frontend
      callback({ private: sortedPrivate, group: sortedGroup });

  } catch (error) {
      console.error("Error fetching user chats:", error);
      callback({ error: 'Failed to fetch chats' });
  }
  });
}