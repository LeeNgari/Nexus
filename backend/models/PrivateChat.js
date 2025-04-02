import pool from '../config/db.js';

export const findPrivateChat = async (user1Id, user2Id) => {
  const { rows } = await pool.query(
    `SELECT * FROM private_chats 
     WHERE (user1_id = $1 AND user2_id = $2)
     OR (user1_id = $2 AND user2_id = $1)`,
    [user1Id, user2Id]
  );
  return rows[0];
};

export const createPrivateChat = async (user1Id, user2Id) => {
  const { rows } = await pool.query(
    `INSERT INTO private_chats (user1_id, user2_id)
     VALUES ($1, $2) RETURNING *`,
    [user1Id, user2Id]
  );
  return rows[0];
};
export const getPrivateChatMessages = async (chatId) => {
  const { rows } = await pool.query(
    `SELECT m.*, u.username as sender_username, u.avatar_url as sender_avatar
     FROM messages m
     JOIN users u ON m.sender_id = u.id
     WHERE m.private_chat_id = $1
     ORDER BY m.created_at ASC`,
    [chatId]
  );
  return rows;
};

export const getUserPrivateChats = async (userId) => {
  const { rows } = await pool.query(
    `SELECT pc.*, 
            u.username as partner_username,
            u.avatar_url as partner_avatar
     FROM private_chats pc
     JOIN users u ON (pc.user1_id = u.id OR pc.user2_id = u.id) AND u.id != $1
     WHERE pc.user1_id = $1 OR pc.user2_id = $1`,
    [userId]
  );
  return rows;
};