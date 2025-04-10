import Session from '../models/Sessions.js';
import db from "../config/db.js"

export async function setupAuth(socket, next) {
    try {
      const cookie = socket.handshake.headers.cookie;
      if (!cookie) throw new Error('No cookie provided');
      
      const sessionId = cookie.split(';')
        .find(c => c.trim().startsWith('sessionId='))
        ?.split('=')[1];
      
      if (!sessionId) throw new Error('Session ID not found in cookie');
  
      const session = await Session.findValid(sessionId);
      if (!session || !session.user_id) throw new Error('Invalid session');
  
      // Update user's online status in DB
      await db.query(
        'UPDATE users SET is_online = TRUE WHERE id = $1',
        [session.user_id]
      );
  
      socket.userId = session.user_id;
      next();
    } catch (err) {
      console.error('Socket authentication error:', err.message);
      next(new Error('Authentication error: ' + err.message));
    }
  }