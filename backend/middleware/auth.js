import Session from "../models/Sessions.js";

// Helper function to clear the session cookie
function clearSessionCookie(res) {
  res.clearCookie('sessionId', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });
}

// Main authentication middleware
const authenticate = async (req, res, next) => {
  const sessionId = req.cookies.sessionId;

  if (!sessionId) {
    return res.status(401).json({
      error: {
        message: 'Not authenticated',
        code: 'UNAUTHORIZED'
      }
    });
  }

  try {
    const session = await Session.findValid(sessionId);
    console.log(session);
    if (!session) {
      clearSessionCookie(res);
      return res.status(401).json({
        error: {
          message: 'Session expired or invalid',
          code: 'SESSION_EXPIRED'
        }
      });
    }

    req.user = {
      id: session.user_id,
      sessionId: session.session_id,
      isPersistent: session.is_persistent
    };
    console.log("finished");
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({
      error: {
        message: 'Internal server error',
        code: 'SERVER_ERROR'
      }
    });
  }
};

// Session check middleware (less strict version)
const checkSession = async (req, res, next) => {
  const sessionId = req.cookies.sessionId;

  if (sessionId) {
    try {
      const session = await Session.findValid(sessionId);
      if (session) {
        req.user = {
          userId: session.user_id,
          isPersistent: session.is_persistent
        };
      }
    } catch (error) {
      console.error('Session check error:', error);
    }
  }
  next();
};

export { authenticate, checkSession };