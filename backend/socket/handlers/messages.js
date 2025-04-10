import { 
    findPrivateChatByIdAndUser,
    findMessagesByPrivateChat,
    findMessagesByRoom,
    isUserRoomMember,
    createPrivateMessage,
    createGroupMessage
  } from '../services/chatService.js';
  
  export function setupMessageHandlers(io, socket) {
    const userId = socket.userId;
  
    // get_private_chat_messages
    socket.on('get_private_chat_messages', async (payload, callback) => {
      if (typeof callback !== 'function') return;
      const { chatId } = payload || {};
      
      if (!chatId) return callback({ error: 'Chat ID is required.' });
      console.log(`User ${userId} requested messages for private chat: ${chatId}`);
      
      try {
        const chat = await findPrivateChatByIdAndUser(chatId, userId);
        if (!chat) {
          console.warn(`Security violation: User ${userId} attempted to access private chat ${chatId}`);
          return callback({ error: 'Access denied to this chat.' });
        }
        
        const messages = await findMessagesByPrivateChat(chatId);
        callback({ messages });
      } catch (error) {
        callback({ error: 'Failed to load messages.' });
      }
    });
  
    // get_group_chat_messages
    socket.on('get_group_chat_messages', async (payload, callback) => {
      if (typeof callback !== 'function') return;
      const { groupId } = payload || {};
      
      if (!groupId) return callback({ error: 'Group ID is required.' });
      console.log(`User ${userId} requested messages for group chat: ${groupId}`);
      
      try {
        const isMember = await isUserRoomMember(groupId, userId);
        if (!isMember) {
          console.warn(`Security violation: User ${userId} attempted to access group ${groupId}`);
          return callback({ error: 'Access denied to this group.' });
        }
        
        const messages = await findMessagesByRoom(groupId);
        callback({ messages });
      } catch (error) {
        callback({ error: 'Failed to load messages.' });
      }
    });
  
    // send_private_message
    socket.on('send_private_message', async (payload, callback) => {
      if (typeof callback !== 'function') return;
      const { chatId, content } = payload || {};
      
      if (!chatId || !content || typeof content !== 'string' || content.trim().length === 0) {
        return callback({ error: 'Invalid message data.' });
      }
      
      const trimmedContent = content.trim();
      console.log(`User ${userId} sending private message to chat ${chatId}`);
      
      try {
        const chat = await findPrivateChatByIdAndUser(chatId, userId);
        if (!chat) {
          console.warn(`Security violation: User ${userId} attempted to send to private chat ${chatId}`);
          return callback({ error: 'Cannot send message to this chat.' });
        }
        
        const recipientId = chat.user1_id === userId ? chat.user2_id : chat.user1_id;
        const newMessage = await createPrivateMessage(chatId, userId, trimmedContent);
  
        io.to(`user_${recipientId}`).emit('receive_private_message', newMessage);
        console.log(`Emitted receive_private_message to room user_${recipientId}`);
  
        callback({ messageId: newMessage.id, timestamp: newMessage.timestamp });
      } catch (error) {
        callback({ error: 'Failed to send message.' });
      }
    });
  
    // send_group_message
    socket.on('send_group_message', async (payload, callback) => {
      if (typeof callback !== 'function') return;
      const { groupId, content } = payload || {};
      
      if (!groupId || !content || typeof content !== 'string' || content.trim().length === 0) {
        return callback({ error: 'Invalid message data.' });
      }
      
      const trimmedContent = content.trim();
      console.log(`User ${userId} sending group message to group ${groupId}`);
      
      try {
        const isMember = await isUserRoomMember(groupId, userId);
        if (!isMember) {
          console.warn(`Security violation: User ${userId} attempted to send to group ${groupId}`);
          return callback({ error: 'Cannot send message to this group.' });
        }
        
        const newMessage = await createGroupMessage(groupId, userId, trimmedContent);
  
        io.to(`room_${groupId}`).emit('receive_group_message', newMessage);
        console.log(`Emitted receive_group_message to room room_${groupId}`);
  
        callback({ messageId: newMessage.id, timestamp: newMessage.timestamp });
      } catch (error) {
        callback({ error: 'Failed to send message.' });
      }
    });
  }