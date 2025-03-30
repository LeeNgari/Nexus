const pool = require('../config/db');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const saltRounds = 10;

const User = {
  async create(email, password, username) {
    try {
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      const id = uuidv4();
      const avatar_url = 'https://res.cloudinary.com/dydpguips/image/upload/v1735813189/profile-user-svgrepo-com_zflps6.svg';
      const result = await pool.query(
        'INSERT INTO users (id, email, password_hash, username, avatar_url, created_at, last_active, is_online) VALUES ($1, $2, $3, $4, $5, NOW(), NOW(), false) RETURNING id, email, username, avatar_url',
        [id, email, hashedPassword, username, avatar_url]
      );
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  async findByEmail(email) {
    try {
      const result = await pool.query(
        'SELECT * FROM users WHERE email = $1',
        [email]
      );
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  async verifyPassword(email, password) {
    try {
      const user = await this.findByEmail(email);
      if (!user) return false;
      
      const match = await bcrypt.compare(password, user.password_hash);
      return match ? user : false;
    } catch (error) {
      throw error;
    }
  },

  async enable2FA(userId) {
    await pool.query(
      'UPDATE users SET two_factor_enabled = true WHERE id = $1',
      [userId]
    );
  },

  async disable2FA(userId) {
    await pool.query(
      'UPDATE users SET two_factor_enabled = false WHERE id = $1',
      [userId]
    );
  },

  async findById(userId) {
    const { rows } = await pool.query(
      'SELECT id, email FROM users WHERE id = $1', // Fixed: 'user_id' -> 'id'
      [userId]
    );
    return rows[0];
  }
};

module.exports = User;