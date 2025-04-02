import { 
    createRoom, 
    findRoomById, 
    findRoomsByUser, 
    addRoomMember, 
    removeRoomMember 
  } from '../models/Room.js';
  import { getIO } from '../socket.js';
  
  export const createRoomHandler = async (req, res) => {
    try {
      const { name, isPrivate } = req.body;
      const room = await createRoom(name, req.user.id, isPrivate);
      
      // Add creator as member
      await addRoomMember(room.id, req.user.id);
      
      res.status(201).json(room);
    } catch (error) {
      console.error('Error creating room:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
  
  export const getRoomHandler = async (req, res) => {
    try {
      const room = await findRoomById(req.params.id);
      if (!room) {
        return res.status(404).json({ error: 'Room not found' });
      }
      res.json(room);
    } catch (error) {
      console.error('Error fetching room:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
  
  export const getUserRoomsHandler = async (req, res) => {
    try {
      const rooms = await findRoomsByUser(req.user.id);
      res.json(rooms);
    } catch (error) {
      console.error('Error fetching user rooms:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
  
  export const addRoomMemberHandler = async (req, res) => {
    try {
      const member = await addRoomMember(req.params.roomId, req.params.userId);
      if (!member) {
        return res.status(400).json({ error: 'User is already a member' });
      }
      
      const io = getIO();
      io.to(`user_${req.params.userId}`).emit('room-invite', {
        roomId: req.params.roomId
      });
      
      res.json(member);
    } catch (error) {
      console.error('Error adding room member:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
  
  export const removeRoomMemberHandler = async (req, res) => {
    try {
      const member = await removeRoomMember(req.params.roomId, req.params.userId);
      if (!member) {
        return res.status(404).json({ error: 'Member not found' });
      }
      
      const io = getIO();
      io.to(`room_${req.params.roomId}`).emit('member-left', {
        userId: req.params.userId,
        roomId: req.params.roomId
      });
      
      res.json(member);
    } catch (error) {
      console.error('Error removing room member:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };