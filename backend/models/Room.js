import pool from '../config/db.js';
import { validate } from 'uuid';

export async function createGroupRoom(name, createdBy, isPrivate) {
  const client = await pool.connect();
  try {
      await client.query('BEGIN');
      
      // Insert new room
      const roomQuery = `
          INSERT INTO rooms (id, name, created_by, is_private, created_at)
          VALUES (gen_random_uuid(), $1, $2, $3, CURRENT_TIMESTAMP)
          RETURNING id
      `;
      const roomResult = await client.query(roomQuery, [name, createdBy, isPrivate]);
      const roomId = roomResult.rows[0].id;
      
      // Add creator as a member
      const memberQuery = `
          INSERT INTO room_members (room_id, user_id, joined_at)
          VALUES ($1, $2, CURRENT_TIMESTAMP)
      `;
      await client.query(memberQuery, [roomId, createdBy]);
      
      await client.query('COMMIT');
      return roomId;
  } catch (error) {
      await client.query('ROLLBACK');
      throw error;
  } finally {
      client.release();
  }
}

// Function to add multiple members to a group
export async function addMembersToGroup(roomId, userIds) {
  const client = await pool.connect();
  try {
      await client.query('BEGIN');
      
      // Prepare query for inserting multiple members
      const memberQuery = `
          INSERT INTO room_members (room_id, user_id, joined_at)
          VALUES ($1, $2, CURRENT_TIMESTAMP)
          ON CONFLICT DO NOTHING
      `;
      
      // Add each user to the room
      for (const userId of userIds) {
          await client.query(memberQuery, [roomId, userId]);
      }
      
      await client.query('COMMIT');
      return true;
  } catch (error) {
      await client.query('ROLLBACK');
      throw error;
  } finally {
      client.release();
  }
}


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