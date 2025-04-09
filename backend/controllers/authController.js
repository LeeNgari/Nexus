import * as User from '../models/user.js';
import Session from '../models/Sessions.js'
import TwoFactorCode from '../models/TwoFactorCode.js';
import { send2FACode } from '../services/emailService.js';
import { generate2FACode } from '../services/twoFactorService.js';

export const register = async (req, res) => {
  const { email, password, username } = req.body;

  try {
    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ 
        error: {
          message: 'Email already registered',
          field: 'email'
        } 
      });
    }

    // Create new user
    const newUser = await User.create(email, password, username);
    
    // Omit password hash from response
    const { password_hash, ...userData } = newUser;
    
    res.status(201).json({
      message: 'Registration successful',
      user: userData
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      error: {
        message: 'Internal server error',
        code: 'SERVER_ERROR'
      } 
    });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  console.log('Login attempt:', { email });

  try {
    // Verify credentials
    const user = await User.verifyPassword(email, password);
    if (!user) {
      return res.status(401).json({
        error: {
          message: 'Invalid email or password',
          code: 'INVALID_CREDENTIALS'
        }
      });
    }

    // Check 2FA status FIRST
    if (user.two_factor_enabled) {
      const code = generate2FACode();
      await TwoFactorCode.create(user.id, code);
      await send2FACode(user.email, code);

      return res.json({
        message: '2FA required',
        requires_2fa: true,
        user_id: user.id
      });
    }

    // Only create session if 2FA is disabled
    const session = await Session.create(user.id);
    const userData = await User.findById(user.id);

    res.cookie('sessionId', session.session_id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // should be false locally
      sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax', // or 'Strict'
      maxAge: 24 * 60 * 60 * 1000
    });
    

    return res.json({
      message: 'Login successful',
      requires_2fa: false,
      user: {
        user_id: user.id,
        email: userData.email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: {
        message: 'Internal server error',
        code: 'SERVER_ERROR'
      }
    });
  }
};

export const verify2FA = async (req, res) => {
  const { user_id, code } = req.body;

  // Validate input types
  if (typeof code !== 'string' || code.length !== 6) {
    return res.status(400).json({
      error: {
        message: 'Invalid code format',
        code: 'INVALID_CODE'
      }
    });
  }

  // Validate UUID format instead of converting to number
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (typeof user_id !== 'string' || !uuidRegex.test(user_id)) {
    return res.status(400).json({
      error: {
        message: 'Invalid user ID format',
        code: 'INVALID_USER_ID'
      }
    });
  }

  try {
    // Use the UUID string directly instead of numericUserId
    const isValid = await TwoFactorCode.verify(user_id, code);

    if (!isValid) {
      return res.status(401).json({
        error: {
          message: 'Invalid or expired 2FA code',
          code: 'INVALID_2FA_CODE'
        }
      });
    }

    // Create session using UUID
    const session = await Session.create(user_id);
    const user = await User.findById(user_id);


    res.cookie('sessionId', session.session_id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000
    });

    res.json({
      message: '2FA verification successful',
      user: {
        user_id: user_id,
        email: user.email
      }
    });
  } catch (error) {
    console.error('2FA verification error:', error);
    res.status(500).json({
      error: {
        message: 'Internal server error',
        code: 'SERVER_ERROR'
      }
    });
  }
};
export const setup2FA = async (req, res) => {
  const { user_id } = req.body;

  try {
    // Enable 2FA for user
    await User.enable2FA(user_id);
    
    res.json({ 
      message: '2FA has been enabled for your account',
      two_factor_enabled: true
    });
  } catch (error) {
    console.error('2FA setup error:', error);
    res.status(500).json({ 
      error: {
        message: 'Internal server error',
        code: 'SERVER_ERROR'
      }
    });
  }
};

export const disable2FA = async (req, res) => {
  const { user_id } = req.body;

  try {
    // Disable 2FA for user
    await User.disable2FA(user_id);
    
    res.json({ 
      message: '2FA has been disabled for your account',
      two_factor_enabled: false
    });
  } catch (error) {
    console.error('2FA disable error:', error);
    res.status(500).json({ 
      error: {
        message: 'Internal server error',
        code: 'SERVER_ERROR'
      }
    });
  }
};

export const logout = async (req, res) => {
  try {
    const sessionId = req.cookies.sessionId;
    if (sessionId) {
      await Session.delete(sessionId);
    }
    
    // Clear cookie
    res.clearCookie('sessionId', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });

    res.json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ 
      error: {
        message: 'Internal server error',
        code: 'SERVER_ERROR'
      }
    });
  }
};
export const checkAuth = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        error: {
          message: 'User not found',
          code: 'USER_NOT_FOUND'
        }
      });
    }

    // Omit sensitive information
    const { password_hash, ...userData } = user;

    res.json({
      authenticated: true,
      user: userData
    });
  } catch (error) {
    console.error('Auth check error:', error);
    res.status(500).json({
      error: {
        message: 'Internal server error',
        code: 'SERVER_ERROR'
      }
    });
  }
};
export const checkSession = async (req, res) => {
  console.log("session checked")
  try {
    // The authenticate middleware already verified the session
    const user = await User.findById(req.user.id);
    console.log(req.user.id)
    if (!user) {
      return res.status(404).json({
        error: { message: 'User not found' }
      });
    }

    // Return minimal user data
    res.json({
      authenticated: !!user,  // Explicit boolean
      user: user || null
    });
  } catch (error) {
    console.error('Session check error:', error);
    res.status(500).json({
      error: { message: 'Internal server error' }
    });
  }
};
