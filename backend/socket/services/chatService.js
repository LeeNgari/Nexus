import db from  "../../config/db.js";

import { formatMessageRow } from '../utils/formatters.js';



export async function getUserPrivateChatsWithAvatars(userId) {
  const queryText = `
    SELECT 
      pc.id,
      CASE 
        WHEN pc.user1_id = $1 THEN u2.id
        ELSE u1.id
      END as other_user_id,
      CASE 
        WHEN pc.user1_id = $1 THEN u2.username
        ELSE u1.username
      END as other_user_username,
      CASE 
        WHEN pc.user1_id = $1 THEN u2.avatar_url
        ELSE u1.avatar_url
      END as other_user_avatar_url,
      pc.created_at
    FROM private_chats pc
    JOIN users u1 ON pc.user1_id = u1.id
    JOIN users u2 ON pc.user2_id = u2.id
    WHERE pc.user1_id = $1 OR pc.user2_id = $1
    ORDER BY pc.created_at DESC
  `;
  
  try {
    const result = await db.query(queryText, [userId]);
    return result.rows;
  } catch (error) {
    console.error(`Error in getUserPrivateChatsWithAvatars for user ${userId}:`, error);
    throw error;
  }
}

export async function findPrivateChatByIdAndUser(chatId, userId) {
  const queryText = `
    SELECT id, user1_id, user2_id
    FROM private_chats
    WHERE id = $1 AND (user1_id = $2 OR user2_id = $2)
  `;
  
  try {
    const result = await db.query(queryText, [chatId, userId]);
    return result.rows[0] || null;
  } catch (error) {
    console.error(`Error in findPrivateChatByIdAndUser for chat ${chatId}, user ${userId}:`, error);
    throw error;
  }
}

export async function isUserRoomMember(roomId, userId) {
  const queryText = `
    SELECT 1 FROM room_members WHERE room_id = $1 AND user_id = $2 LIMIT 1
  `;
  
  try {
    const result = await db.query(queryText, [roomId, userId]);
    return result.rowCount > 0;
  } catch (error) {
    console.error(`Error in isUserRoomMember for room ${roomId}, user ${userId}:`, error);
    throw error;
  }
}

export async function findMessagesByPrivateChat(chatId, limit = 50, offset = 0) {
  const queryText = `
    SELECT
        m.id, m.content, m.sender_id, m.created_at AS timestamp,
        m.private_chat_id, m.room_id,
        m.file_url, m.file_type, m.file_size,
        u.id AS sender_user_id, u.username AS sender_username, u.avatar_url AS sender_avatar_url
    FROM messages m
    JOIN users u ON m.sender_id = u.id
    WHERE m.private_chat_id = $1
    ORDER BY m.created_at ASC
    LIMIT $2 OFFSET $3
  `;
  
  try {
    const result = await db.query(queryText, [chatId, limit, offset]);
    return result.rows.map(formatMessageRow);
  } catch (error) {
    console.error(`Error in findMessagesByPrivateChat for chat ${chatId}:`, error);
    throw error;
  }
}

export async function findMessagesByRoom(roomId, limit = 50, offset = 0) {
  const queryText = `
    SELECT
        m.id, m.content, m.sender_id, m.created_at AS timestamp,
        m.private_chat_id, m.room_id,
        m.file_url, m.file_type, m.file_size,
        u.id AS sender_user_id, u.username AS sender_username, u.avatar_url AS sender_avatar_url
    FROM messages m
    JOIN users u ON m.sender_id = u.id
    WHERE m.room_id = $1
    ORDER BY m.created_at ASC
    LIMIT $2 OFFSET $3
  `;
  
  try {
    const result = await db.query(queryText, [roomId, limit, offset]);
    return result.rows.map(formatMessageRow);
  } catch (error) {
    console.error(`Error in findMessagesByRoom for room ${roomId}:`, error);
    throw error;
  }
}

export async function createPrivateMessage(chatId, senderId, content) {
  const insertQuery = `
    INSERT INTO messages (sender_id, private_chat_id, content)
    VALUES ($1, $2, $3)
    RETURNING id, created_at AS timestamp, sender_id, content, private_chat_id
  `;
  
  try {
    const insertResult = await db.query(insertQuery, [senderId, chatId, content]);
    const newMessageBase = insertResult.rows[0];
    if (!newMessageBase) throw new Error("Message insertion failed.");

    const senderQuery = `SELECT id, username, avatar_url FROM users WHERE id = $1`;
    const senderResult = await db.query(senderQuery, [newMessageBase.sender_id]);
    const sender = senderResult.rows[0];
    
    if (!sender) console.warn(`Could not find sender details for user ID: ${newMessageBase.sender_id}`);

    return {
      id: newMessageBase.id,
      content: newMessageBase.content,
      senderId: newMessageBase.sender_id,
      chatId: newMessageBase.private_chat_id,
      timestamp: newMessageBase.timestamp.toISOString(),
      sender: sender ? { 
        id: sender.id, 
        username: sender.username, 
        avatar_url: sender.avatar_url 
      } : { 
        id: newMessageBase.sender_id, 
        username: 'Unknown User', 
        avatar_url: null 
      }
    };
  } catch (error) {
    console.error(`Error in createPrivateMessage for chat ${chatId}, sender ${senderId}:`, error);
    throw error;
  }
}

export async function createGroupMessage(roomId, senderId, content) {
  const insertQuery = `
    INSERT INTO messages (sender_id, room_id, content)
    VALUES ($1, $2, $3)
    RETURNING id, created_at AS timestamp, sender_id, content, room_id
  `;
  
  try {
    const insertResult = await db.query(insertQuery, [senderId, roomId, content]);
    const newMessageBase = insertResult.rows[0];
    if (!newMessageBase) throw new Error("Message insertion failed.");

    const senderQuery = `SELECT id, username, avatar_url FROM users WHERE id = $1`;
    const senderResult = await db.query(senderQuery, [newMessageBase.sender_id]);
    const sender = senderResult.rows[0];
    
    if (!sender) console.warn(`Could not find sender details for user ID: ${newMessageBase.sender_id}`);

    return {
      id: newMessageBase.id,
      content: newMessageBase.content,
      senderId: newMessageBase.sender_id,
      groupId: newMessageBase.room_id,
      timestamp: newMessageBase.timestamp.toISOString(),
      sender: sender ? { 
        id: sender.id, 
        username: sender.username, 
        avatar_url: sender.avatar_url 
      } : { 
        id: newMessageBase.sender_id, 
        username: 'Unknown User', 
        avatar_url: null 
      }
    };
  } catch (error) {
    console.error(`Error in createGroupMessage for room ${roomId}, sender ${senderId}:`, error);
    throw error;
  }
}