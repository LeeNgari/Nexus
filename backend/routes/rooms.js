import express from 'express';
import { authenticate } from '../middleware/auth.js'; // Import the authentication middleware
import {
  createRoom,
  findRoomById,
  findRoomsByUser,
  addRoomMember,
  removeRoomMember,
  getRoomMessages
} from '../models/Room.js';
import { createRoomMessage } from '../models/Message.js';
import pool from '../config/db.js';
import { createGroup } from '../controllers/rooms.js';

const router = express.Router();

// Create new group chat (protected)
router.post('/', authenticate, async (req, res) => {
  try {
    console.log(1)
    const { name, isPrivate = false } = req.body;
    console.log(2)
    const room = await createRoom(name, req.user.id, isPrivate);
    console.log(3)

    // Add creator as first member
    await addRoomMember(room.id, req.user.id);
    console.log(4)

    res.status(201).json(room);
  } catch (error) {
    console.error("Error in create room route:", error); //Log the error in the route.
    res.status(500).json({ error: error.message || 'Failed to create room' }); //Send the error message.
  }
});
router.post('/create', authenticate, createGroup);
router.get('/unjoined', authenticate, async (req, res) => {
  // Assuming authenticateUser middleware adds user to request
  
  const userId = req.user.id;
  console.log("unjoined")
  try {
    // Query to get rooms the user is not a member of
    const query = `
      SELECT r.id, r.name, r.created_by, r.is_private, r.created_at,
             u.username AS creator_username, u.avatar_url AS creator_avatar
      FROM rooms r
      JOIN users u ON r.created_by = u.id
      WHERE r.id NOT IN (
        SELECT rm.room_id 
        FROM room_members rm 
        WHERE rm.user_id = $1
      )
      AND r.is_private = false
      ORDER BY r.created_at DESC
    `;
    
    const { rows } = await pool.query(query, [userId]);
    
    return res.status(200).json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (error) {
    console.error('Error fetching unjoined rooms:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching available rooms',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get user's group chats (protected)
router.get('/', authenticate, async (req, res) => {
  try {
    const rooms = await findRoomsByUser(req.user.id);
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch rooms' });
  }
});

// Get specific group chat details (protected)
router.get('/:id', authenticate, async (req, res) => {
  console.log("lee1")
  try {
    const room = await findRoomById(req.params.id);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }
    res.json(room);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch room' });
  }
});

// Add member to group chat (protected)
router.post('/:id/members', authenticate, async (req, res) => {
  try {
    const { id } = req.body;
    const member = await addRoomMember(req.params.id, id);
    res.status(201).json(member);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add member' });
  }
});

// Remove member from group chat (protected)
router.delete('/:id/members/:userId', authenticate, async (req, res) => {
  try {
    await removeRoomMember(req.params.id, req.params.userId);
    res.json({ message: 'Member removed' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove member' });
  }
});

// Send message to group chat (protected)
router.post('/:id/messages', authenticate, async (req, res) => {
  try {
    console.log("hjjh")
    const { content, type = 'text' } = req.body;
    console.log(content)
    const roomId = req.params.id;
    const userId = req.user.id;

    console.log()

    // ✅ Step 1: Check if the room exists
    const roomCheckQuery = `SELECT 1 FROM rooms WHERE id = $1;`;

    console.log(2)
    const roomCheck = await pool.query(roomCheckQuery, [roomId]);

    if (roomCheck.rowCount === 0) {
      return res.status(404).json({ error: 'Room not found' });
    }

    // ✅ Step 2: Check if the user is a member of the room
    const membershipQuery = `SELECT 1 FROM room_members WHERE room_id = $1 AND user_id = $2;`;
    const membershipCheck = await pool.query(membershipQuery, [roomId, userId]);

    if (membershipCheck.rowCount === 0) {
      return res.status(403).json({ error: 'You are not a member of this room' });
    }

    console.log(3)
    // ✅ Step 3: If valid, create the message
    const message = await createRoomMessage({
      sender_id: userId,
      room_id: roomId,
      content,
      type
    });

    res.status(201).json(message);
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});


// Get group chat messages (protected)
router.get('/:id/messages', authenticate, async (req, res) => {
  try {
    const messages = await getRoomMessages(req.params.id);
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get messages' });
  }
});



export default router;
