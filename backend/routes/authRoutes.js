const express = require('express');
const router = express.Router();
const { register, login, logout, verify2FA, setup2FA, disable2FA } = require("../controllers/authController");
const { validateRegistration } = require('../services/validation');
const { authenticate } = require('../middleware/auth');
const { strictAuthLimiter, authLimiter } = require('../middleware/rateLimiter');
const { bruteForceProtection } = require("../middleware/bruteForceProtection");



router.post('/register', strictAuthLimiter, validateRegistration, register);
router.post('/login', strictAuthLimiter, bruteForceProtection, login);
router.post('/logout', authLimiter, authenticate, logout);
router.post('/verify-2fa', authLimiter, verify2FA);


router.post('/setup-2fa', authenticate, setup2FA);
router.post('/disable-2fa', authenticate, disable2FA);


// Protected route example
router.get('/profile', authenticate, (req, res) => {
    res.json({ message: 'Protected profile data', userId: req.user.userId });
});

module.exports = router;
