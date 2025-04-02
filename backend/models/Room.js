import pool from '../config/db.js';
import { validate } from 'uuid';

export const createRoom = async (name, creatorId, isPrivate = false) => {
  // Validation
  if (!name?.trim()) throw new Error('Room name is required');
  if (!validate(creatorId)) throw new Error('Invalid user ID');

  console.log(name, creatorId, isPrivate);
  const query = `
    INSERT INTO rooms (name, created_by, is_private)
    VALUES ($1, $2, $3)
    RETURNING *;
  `;
  const values = [name.trim(), creatorId, Boolean(isPrivate)];

  try {
    const { rows } = await pool.query(query, values);
    console.log("room created");
    return rows[0];
  } catch (error) {
    if (error.code === '23503') {
      throw new Error('User does not exist');
    }
    console.error("Error creating room:", error); //Log the error to the console.
    throw error; // Re-throw the original error
  }
};
export const getRoomMessages = async (roomId) => {
  const query = `
    SELECT m.*, u.username as sender_username, u.avatar_url as sender_avatar
    FROM messages m
    JOIN users u ON m.sender_id = u.id
    WHERE m.room_id = $1
    ORDER BY m.created_at ASC;
  `;
  const { rows } = await pool.query(query, [roomId]);
  return rows;
};

export const findRoomById = async (id) => {
  console.log("baraka")
  
  console.log(typeof id)
  const query = `
    SELECT r.*, 
          json_agg(json_build_object(
            'id', u.id,
            'username', u.username,
            'avatar_url', u.avatar_url,
            'is_online', u.is_online
          )) AS members
    FROM rooms r
    JOIN room_members rm ON r.id = rm.room_id
    JOIN users u ON rm.user_id = u.id
    WHERE r.id = $1
    GROUP BY r.id;
  `;

  const { rows } = await pool.query(query, [id]);
  return rows.length > 0 ? rows[0] : null;
};

export const findRoomsByUser = async (userId) => {
  const query = `
    SELECT r.*
    FROM rooms r
    JOIN room_members rm ON r.id = rm.room_id
    WHERE rm.user_id = $1;
  `;
  const { rows } = await pool.query(query, [userId]);
  return rows;
};

export const addRoomMember = async (roomId, userId) => {
  const query = `
    INSERT INTO room_members (room_id, user_id)
    VALUES ($1, $2)
    ON CONFLICT DO NOTHING
    RETURNING *;
  `;
  const { rows } = await pool.query(query, [roomId, userId]);
  return rows[0];
};

export const removeRoomMember = async (roomId, userId) => {
  const query = `
    DELETE FROM room_members
    WHERE room_id = $1 AND user_id = $2
    RETURNING *;
  `;
  const { rows } = await pool.query(query, [roomId, userId]);
  return rows[0];
};