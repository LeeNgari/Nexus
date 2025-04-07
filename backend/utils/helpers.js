const { pool } = require('../config/db') // Assuming you have a database connection pool setup

export async function updateUserStatus(userId, isOnline) {
  const query = `
    UPDATE users 
    SET is_online = $1, 
        last_active = CURRENT_TIMESTAMP 
    WHERE id = $2
  `;
  await pool.query(query, [isOnline, userId]);
}

export async function checkRoomAccess(userId, roomId) {
  const query = `
    SELECT 1 FROM room_members 
    WHERE room_id = $1 AND user_id = $2
  `;
  const result = await pool.query(query, [roomId, userId]);
  return result.rowCount > 0;
}

export async function checkPrivateChatAccess(userId, chatId) {
  const query = `
    SELECT 1 FROM private_chats 
    WHERE id = $1 AND (user1_id = $2 OR user2_id = $2)
  `;
  const result = await pool.query(query, [chatId, userId]);
  return result.rowCount > 0;
}

export async function saveMessage(messageData) {
  const { senderId, content, roomId, privateChatId, fileUrl, fileType, fileSize } = messageData;
  
  const query = `
    INSERT INTO messages (
      content, sender_id, room_id, private_chat_id, 
      file_url, file_type, file_size
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING id, created_at
  `;
  
  const result = await pool.query(query, [
    content, senderId, roomId, privateChatId,
    fileUrl, fileType, fileSize
  ]);
  
  return {
    id: result.rows[0].id,
    ...messageData,
    createdAt: result.rows[0].created_at
  };
}

export async function getPrivateChatParticipants(chatId) {
  const query = `
    SELECT user1_id AS id FROM private_chats WHERE id = $1
    UNION
    SELECT user2_id AS id FROM private_chats WHERE id = $1
  `;
  const result = await pool.query(query, [chatId]);
  return result.rows.map(row => row.id);
}

export async function getRoomParticipants(roomId) {
  const query = `
    SELECT user_id AS id FROM room_members 
    WHERE room_id = $1
  `;
  const result = await pool.query(query, [roomId]);
  return result.rows.map(row => row.id);
}

export async function getUserById(userId) {
  const query = `
    SELECT id, username, email, avatar_url, is_online, last_active
    FROM users
    WHERE id = $1
  `;
  const result = await pool.query(query, [userId]);
  return result.rows[0] || null;
}

export async function getMessageById(messageId) {
  const query = `
    SELECT id, content, sender_id, room_id, private_chat_id, 
           file_url, file_type, file_size, created_at
    FROM messages
    WHERE id = $1
  `;
  const result = await pool.query(query, [messageId]);
  return result.rows[0] || null;
}

export async function markMessageAsRead(messageId, userId) {
  const query = `
    INSERT INTO message_read_status (message_id, user_id, is_read, read_at)
    VALUES ($1, $2, true, CURRENT_TIMESTAMP)
    ON CONFLICT (message_id, user_id) 
    DO UPDATE SET is_read = true, read_at = CURRENT_TIMESTAMP
  `;
  await pool.query(query, [messageId, userId]);
}

export async function getUserRooms(userId) {
  const query = `
    SELECT r.id, r.name, r.created_by, r.is_private, r.created_at
    FROM rooms r
    JOIN room_members rm ON r.id = rm.room_id
    WHERE rm.user_id = $1
  `;
  const result = await pool.query(query, [userId]);
  return result.rows;
}

export async function getUserPrivateChats(userId) {
  const query = `
    SELECT pc.id, 
           CASE WHEN pc.user1_id = $1 THEN pc.user2_id ELSE pc.user1_id END AS other_user_id,
           pc.created_at
    FROM private_chats pc
    WHERE pc.user1_id = $1 OR pc.user2_id = $1
  `;
  const result = await pool.query(query, [userId]);
  return result.rows;
}

export async function getUserLastActive(userId) {
  const query = `
    SELECT last_active FROM users WHERE id = $1
  `;
  const result = await pool.query(query, [userId]);
  return result.rows[0]?.last_active || null;
}