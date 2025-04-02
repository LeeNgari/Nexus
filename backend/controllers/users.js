import {
    findById,
    updateUserProfile,
    searchUsers,
    updateUserOnlineStatus
  } from '../models/user.js';
  import { getUserPrivateChats } from '../models/PrivateChat.js';
  import { findRoomsByUser } from '../models/Room.js';
  
  export const getProfile = async (req, res) => {
    try {
      const user = await findById(req.user.id);
      console.log("test1")
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Remove sensitive data
      const { password_hash, two_factor_secret, ...userData } = user;
      res.json(userData);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch profile' });
    }
  };
  
  export const updateProfile = async (req, res) => {
    try {
      const { username, avatar_url } = req.body;
      const updatedUser = await updateUserProfile(req.user.id, { username, avatar_url });
      
      const { password_hash, two_factor_secret, ...userData } = updatedUser;
      res.json(userData);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update profile' });
    }
  };
  
  export const searchUsersController = async (req, res) => {
    try {
      const { query } = req.query;
      const users = await searchUsers(query);
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: 'Search failed' });
    }
  };
  
  export const getUserChats = async (req, res) => {
    console.log("j")
    console.log(req.user.id)
    try {
      const [privateChats, groupChats] = await Promise.all([
        getUserPrivateChats(req.user.id),
        findRoomsByUser(req.user.id)
      ]);
      
      res.json({
        private: privateChats,
        group: groupChats
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to get chats' });
    }
  };
  
  export const updateStatus = async (req, res) => {
    try {
      const { is_online } = req.body;
      await updateUserOnlineStatus(req.user.id, is_online);
      res.json({ message: 'Status updated' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update status' });
    }
  };