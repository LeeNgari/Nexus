import express from 'express';
import {
  getProfile,
  updateProfile,
  searchUsersController,
  getUserChats,
  updateStatus
} from '../controllers/users.js';

import { authenticate } from '../middleware/auth.js';
import pool from "../config/db.js"

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

router.get('/me', authenticate, async (req, res) => {
  try {
    const query = `
      SELECT 
        id, 
        email, 
        username, 
        avatar_url, 
        is_online, 
        last_active, 
        created_at, 
        two_factor_enabled
      FROM users
      WHERE id = $1
    `;

    const result = await pool.query(query, [req.user.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching current user:', error);
    res.status(500).json({
      success: false,
      message: 'Server error occurred while fetching user information'
    });
  }
});

router.get('/',authenticate, async (req, res) => {
  try {
    const query = `
      SELECT 
        id, 
        email, 
        username, 
        avatar_url, 
        is_online, 
        last_active, 
        created_at, 
        two_factor_enabled
      FROM users
      ORDER BY created_at DESC
    `;

    const result = await pool.query(query);

    res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Server error occurred while fetching users',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;