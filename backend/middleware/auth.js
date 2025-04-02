import Session from '../models/Sessions.js'; // Added .js extension

export const authenticate = async (req, res, next) => {
  const sessionId = req.cookies.sessionId;

  if (!sessionId) {
    return res.status(401).json({
      error: {
        message: 'Not authenticated',
        code: 'UNAUTHORIZED',
      },
    });
  }

  try {
    const session = await Session.findValid(sessionId);
    if (!session) {
      return res.status(401).json({
        error: {
          message: 'Session expired',
          code: 'SESSION_EXPIRED',
        },
      });
    }

    // Attach user info to request
    req.user = { id: session.user_id };
    console.log(req.user)
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({
      error: {
        message: 'Internal server error',
        code: 'SERVER_ERROR',
      },
    });
  }
};