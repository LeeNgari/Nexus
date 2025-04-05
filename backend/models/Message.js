import pool from '../config/db.js';

export const createMessage = async ({ sender_id, private_chat_id, content, type = 'text' }) => {
  console.log("problem here")
  const query = `
    INSERT INTO messages (sender_id, private_chat_id, content, type)
    VALUES ($1, $2, $3, $4)
    RETURNING *;
  `;
  const values = [sender_id, private_chat_id, content, type];
  console.log(values)
  try {
    const { rows } = await pool.query(query, values);
    return rows[0];
  } catch (error) {
    console.error('Error creating private message:', error);
    throw error; // Rethrow the error for the caller to handle
  }
};
export const createRoomMessage = async ({ sender_id, room_id, content, type = 'text' }) => {
  console.log("problem here")
  const query = `
    INSERT INTO messages (sender_id, room_id, content, type)
    VALUES ($1, $2, $3, $4)
    RETURNING *;
  `;
  const values = [sender_id, room_id, content, type];
  console.log(values)
  try {
    const { rows } = await pool.query(query, values);
    return rows[0];
  } catch (error) {
    console.error('Error creating private message:', error);
    throw error; // Rethrow the error for the caller to handle
  }
};


export const findMessageById = async (id) => {
  const query = `
    SELECT m.*, 
           json_build_object(
             'id', u.id,
             'username', u.username,
             'avatar_url', u.avatar_url
           ) AS sender,
           (SELECT json_agg(json_build_object(
             'user_id', mrs.user_id,
             'read_at', mrs.read_at
           )) AS read_status
    FROM messages m
    JOIN users u ON m.sender_id = u.id
    LEFT JOIN message_read_status mrs ON m.id = mrs.message_id
    WHERE m.id = $1
    GROUP BY m.id, u.id;
  `;
  const { rows } = await pool.query(query, [id]);
  return rows[0];
};

export const findMessagesByRoom = async (roomId, limit = 50, offset = 0) => {
  const query = `
    SELECT m.*, 
           json_build_object(
             'id', u.id,
             'username', u.username,
             'avatar_url', u.avatar_url
           ) AS sender,
           (SELECT json_agg(json_build_object(
             'user_id', mrs.user_id,
             'read_at', mrs.read_at
           )) AS read_status
    FROM messages m
    JOIN users u ON m.sender_id = u.id
    LEFT JOIN message_read_status mrs ON m.id = mrs.message_id
    WHERE m.room_id = $1
    GROUP BY m.id, u.id
    ORDER BY m.created_at DESC
    LIMIT $2 OFFSET $3;
  `;
  const { rows } = await pool.query(query, [roomId, limit, offset]);
  return rows;
};

export const markMessageAsRead = async (messageId, userId) => {
  const query = `
    INSERT INTO message_read_status (message_id, user_id, read_at)
    VALUES ($1, $2, NOW())
    ON CONFLICT (message_id, user_id) DO UPDATE
    SET read_at = NOW()
    RETURNING *;
  `;
  const { rows } = await pool.query(query, [messageId, userId]);
  return rows[0];
};