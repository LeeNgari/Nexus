import express from 'express';
import {
  findPrivateChat,
  createPrivateChat,
  getPrivateChatMessages
} from '../models/PrivateChat.js';
import { createMessage } from '../models/Message.js';
import { authenticate } from '../middleware/auth.js';


const router = express.Router();

// Start or get existing private chat
router.post('/private',authenticate, async (req, res) => {
  console.log(req.body)
  try {
    console.log(req.body)
    const { partnerId } = req.body;
    
    // Check if chat already exists
    let chat = await findPrivateChat(req.user.id, partnerId);
    
    if (!chat) {
      chat = await createPrivateChat(req.user.id, partnerId);
    }
    
    res.status(200).json(chat);
  } catch (error) {
    console.log(error)
    res.status(500).json({ error: 'Failed to create/get private chat' });
  }
});

// Get messages for private chat
router.get('/private/:partnerId/messages',authenticate, async (req, res) => {
  console.log("/ Get messages for private chat")
  try {
    const chat = await findPrivateChat(req.user.id, req.params.partnerId);
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }
    
    const messages = await getPrivateChatMessages(chat.id);
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get messages' });
  }
});

// Send message in private chat
router.post('/private/:partnerId/messages',authenticate, async (req, res) => {
  console.log("send message private")
  try {
    const { content, type = 'text' } = req.body;
    console.log(content)
    const chat = await findPrivateChat(req.user.id, req.params.partnerId);
    console.log(chat)
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }
    
    const message = await createMessage({
      sender_id: req.user.id,
      private_chat_id: chat.id,
      content,
      type
    });
    console.log(message)
    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ error: 'Failed to send message' });
  }
});

export default router;