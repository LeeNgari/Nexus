import pool from "../config/db.js";
import crypto from 'crypto';

const Session = {
  async create(userId, isPersistent = false) {
    try {
      const sessionId = crypto.randomBytes(32).toString('hex');
      const expiresAt = isPersistent
          ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
          : new Date(Date.now() + 24 * 60 * 60 * 1000); // 1 day

      const result = await pool.query(
          `INSERT INTO sessions (session_id, user_id, expires_at, is_persistent)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
          [sessionId, userId, expiresAt, isPersistent]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  },

  async findValid(sessionId) {
    try {
      const result = await pool.query(
          `SELECT * FROM sessions
         WHERE session_id = $1
         AND expires_at > NOW()`,
          [sessionId]
      );

      // Auto-extend non-persistent sessions on access
      const session = result.rows[0];
      if (session && !session.is_persistent) {
        await this.extend(sessionId, 24 * 60 * 60 * 1000); // Extend by 1 day
      }

      return session;
    } catch (error) {
      console.error('Error finding valid session:', error);
      throw error;
    }
  },

  async extend(sessionId, duration) {
    try {
      const newExpiresAt = new Date(Date.now() + duration);
      await pool.query(
          'UPDATE sessions SET expires_at = $1 WHERE session_id = $2',
          [newExpiresAt, sessionId]
      );
      return newExpiresAt;
    } catch (error) {
      console.error('Error extending session:', error);
      throw error;
    }
  },

  async delete(sessionId) {
    try {
      await pool.query(
          'DELETE FROM sessions WHERE session_id = $1',
          [sessionId]
      );
    } catch (error) {
      console.error('Error deleting session:', error);
      throw error;
    }
  },

  async deleteExpiredSessions() {
    try {
      await pool.query(
          'DELETE FROM sessions WHERE expires_at <= NOW()'
      );
    } catch (error) {
      console.error('Error deleting expired sessions:', error);
      throw error;
    }
  },
};

export default Session;