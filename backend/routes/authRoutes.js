import express from 'express';
import {
  register,
  login,
  logout,
  verify2FA,
  setup2FA,
  disable2FA,
} from '../controllers/authController.js'; // Added .js extension
import { validateRegistration } from '../services/validation.js'; // Added .js extension
import { authenticate } from '../middleware/auth.js'; // Added .js extension
import { strictAuthLimiter, authLimiter } from '../middleware/rateLimiter.js'; // Added .js extension
import { bruteForceProtection } from '../middleware/bruteForceProtection.js'; // Added .js extension
import {checkSession} from "../controllers/authController.js"
const router = express.Router();

router.post('/register', strictAuthLimiter, validateRegistration, register);
router.post('/login', strictAuthLimiter, bruteForceProtection, login);
router.post('/logout', authLimiter, authenticate, logout);
router.post('/verify-2fa', authLimiter, verify2FA);

router.get('/check-session', authLimiter, authenticate, checkSession, (req, res) => {

  if (!req.user) {
    return res.json({ authenticated: false });
  }

  // You would typically fetch full user details here
  res.json({
    authenticated: true,
    user: {
      userId: req.user.userId,
      isPersistent: req.user.isPersistent
    }
  });
});

router.post('/setup-2fa', authenticate, setup2FA);
router.post('/disable-2fa', authenticate, disable2FA);

// Protected route example
router.get('/profile', authenticate, (req, res) => {
  res.json({ message: 'Protected profile data', userId: req.user.userId });
});

export default router; // Use export default instead of module.exports