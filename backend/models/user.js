import pool from '../config/db.js'; // Use import here
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

const saltRounds = 10;

export async function create(email, password, username) {
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
}

export async function findByEmail(email) {
  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0];
  } catch (error) {
    throw error;
  }
}

export async function verifyPassword(email, password) {
  try {
    const user = await findByEmail(email);
    if (!user) return false;

    const match = await bcrypt.compare(password, user.password_hash);
    return match ? user : false;
  } catch (error) {
    throw error;
  }
}

export async function enable2FA(userId) {
  try {
    await pool.query(
      'UPDATE users SET two_factor_enabled = true WHERE id = $1',
      [userId]
    );
  } catch (error) {
    throw error;
  }
}

export async function disable2FA(userId) {
  try {
    await pool.query(
      'UPDATE users SET two_factor_enabled = false WHERE id = $1',
      [userId]
    );
  } catch (error) {
    throw error;
  }
}

export async function findById(userId) {
  try {
    const { rows } = await pool.query(
      'SELECT id, email FROM users WHERE id = $1',
      [userId]
    );
    return rows[0];
  } catch (error) {
    throw error;
  }
}

export async function updateUserProfile(userId, { username, avatar_url }) {
  try {
    const query = `
      UPDATE users 
      SET username = COALESCE($1, username),
          avatar_url = COALESCE($2, avatar_url)
      WHERE id = $3
      RETURNING *;
    `;
    const { rows } = await pool.query(query, [username, avatar_url, userId]);
    return rows[0];
  } catch (error) {
    throw error;
  }
}

export async function searchUsers(query) {
  console.log(query)
  try {
    const { rows } = await pool.query(
      `SELECT id, username, avatar_url, is_online
       FROM users
       WHERE username ILIKE $1
       LIMIT 20`,
      [`%${query}%`]
    );
    return rows;
  } catch (error) {
    throw error;
  }
}

export async function updateUserOnlineStatus(userId, isOnline) {
  try {
    const { rows } = await pool.query(
      `UPDATE users
       SET is_online = $1,
           last_active = CASE WHEN $1 THEN NOW() ELSE last_active END
       WHERE id = $2
       RETURNING id, username, avatar_url, is_online`,
      [isOnline, userId]
    );
    return rows[0];
  } catch (error) {
    throw error;
  }
}