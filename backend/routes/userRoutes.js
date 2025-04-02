import express from 'express';
import {
  getProfile,
  updateProfile,
  searchUsersController,
  getUserChats,
  updateStatus
} from '../controllers/users.js';

import { authenticate } from '../middleware/auth.js';


const router = express.Router();



// Get current user profile
router.get('/profile',authenticate, getProfile);


// Update user profile
router.put('/profile', authenticate,updateProfile);

// Search users
router.get('/search',authenticate, searchUsersController);

// Get user's chats (both private and group)
router.get('/chats',authenticate, getUserChats);

// Update online status
router.put('/status',authenticate, updateStatus);

export default router;