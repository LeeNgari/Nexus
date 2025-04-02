import pool from '../config/db.js'; // Import pool using ESM
import crypto from 'crypto';

const Session = {
  async create(userId) {
    try {
      const sessionId = crypto.randomBytes(32).toString('hex');
      const result = await pool.query(
        'INSERT INTO sessions (session_id, user_id) VALUES ($1, $2) RETURNING *',
        [sessionId, userId]
      );
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  async findValid(sessionId) {
    try {
      // Add expiration check (e.g., sessions older than 1 day)
      const result = await pool.query(
        `SELECT * FROM sessions 
         WHERE session_id = $1 
         AND created_at > NOW() - INTERVAL '1 day'`,
        [sessionId]
      );
      return result.rows[0];
    } catch (error) {
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
      throw error;
    }
  }
};

export default Session; // Use export default instead of module.exports