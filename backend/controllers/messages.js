import { 
    createMessage, 
    findMessagesByRoom, 
    markMessageAsRead 
  } from '../models/Message.js';
  import { getIO } from '../socket.js';
  
  export const sendMessageHandler = async (req, res) => {
    try {
      const { roomId, content, type } = req.body;
      const message = await createMessage({
        sender_id: req.user.id,
        room_id: roomId,
        content,
        type
      });
      
      const io = getIO();
      io.to(`room_${roomId}`).emit('new-message', message);
      
      res.status(201).json(message);
    } catch (error) {
      console.error('Error sending message:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
  
  export const getRoomMessagesHandler = async (req, res) => {
    try {
      const { roomId } = req.params;
      const { limit = 50, offset = 0 } = req.query;
      const messages = await findMessagesByRoom(roomId, parseInt(limit), parseInt(offset));
      res.json(messages);
    } catch (error) {
      console.error('Error fetching messages:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
  
  export const markAsReadHandler = async (req, res) => {
    try {
      const { messageId } = req.params;
      const readReceipt = await markMessageAsRead(messageId, req.user.id);
      
      const io = getIO();
      io.to(`user_${message.sender_id}`).emit('message-read', {
        messageId,
        readBy: req.user.id
      });
      
      res.json(readReceipt);
    } catch (error) {
      console.error('Error marking message as read:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };