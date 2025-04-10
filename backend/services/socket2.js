// socketSetup.js (ESM Version)

import { Server } from 'socket.io';
import Session from '../models/Sessions.js'; // Assuming Sessions.js uses ESM export default or named export
import { findRoomsByUser } from "../models/Room.js"; // Assuming Room.js uses named ESM export
import { getUserPrivateChats } from "../utils/helpers.js"; // Assuming helpers.js uses named ESM export
import db from '../config/db.js'; // Import the default export from db.js

// --- DATABASE INTERACTION FUNCTIONS using 'pg' (ESM Export) ---

/**
 * Finds a private chat by its ID and verifies if a user is part of it.
 * @param {string} chatId - The UUID of the private chat.
 * @param {string} userId - The UUID of the user.
 * @returns {Promise<object|null>} Chat object { id, user1_id, user2_id } or null.
 */
export async function findPrivateChatByIdAndUser(chatId, userId) { // Using named export
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

/**
 * Checks if a user is a member of a specific room.
 * @param {string} roomId - The UUID of the room.
 * @param {string} userId - The UUID of the user.
 * @returns {Promise<boolean>} True if the user is a member, false otherwise.
 */
export async function isUserRoomMember(roomId, userId) { // Using named export
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

/**
 * Formats a database row into the message object expected by the frontend.
 * @param {object} row - Database row from messages joined with users.
 * @returns {object} Formatted message object.
 */
function formatMessageRow(row) { // Internal helper, no need to export
    if (!row) return null;
    return {
        id: row.id,
        content: row.content,
        senderId: row.sender_id,
        timestamp: row.timestamp.toISOString(),
        file_url: row.file_url,
        file_type: row.file_type,
        file_size: row.file_size,
        chatId: row.private_chat_id || undefined,
        groupId: row.room_id || undefined,
        sender: {
            id: row.sender_user_id || row.sender_id,
            username: row.sender_username,
            avatar_url: row.sender_avatar_url
        }
    };
}


/**
 * Finds messages for a specific private chat.
 * @param {string} chatId - The UUID of the private chat.
 * @param {number} [limit=50] - Max number of messages to return.
 * @param {number} [offset=0] - Number of messages to skip (for pagination).
 * @returns {Promise<object[]>} Array of formatted message objects.
 */
export async function findMessagesByPrivateChat(chatId, limit = 50, offset = 0) { // Using named export
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

/**
 * Finds messages for a specific group chat (room).
 * @param {string} roomId - The UUID of the room.
 * @param {number} [limit=50] - Max number of messages to return.
 * @param {number} [offset=0] - Number of messages to skip (for pagination).
 * @returns {Promise<object[]>} Array of formatted message objects.
 */
export async function findMessagesByRoom(roomId, limit = 50, offset = 0) { // Using named export
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

/**
 * Creates a new message in a private chat.
 * Assumes the 'messages' table 'id' column has a default UUID generator (e.g., gen_random_uuid()).
 * @param {string} chatId - The UUID of the private chat.
 * @param {string} senderId - The UUID of the sender.
 * @param {string} content - The message content.
 * @returns {Promise<object>} The formatted new message object.
 */
export async function createPrivateMessage(chatId, senderId, content) { // Using named export
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
        sender: sender ? { id: sender.id, username: sender.username, avatar_url: sender.avatar_url } : { id: newMessageBase.sender_id, username: 'Unknown User', avatar_url: null }
    };
  } catch (error) {
    console.error(`Error in createPrivateMessage for chat ${chatId}, sender ${senderId}:`, error);
    throw error;
  }
}

/**
 * Creates a new message in a group chat (room).
 * Assumes the 'messages' table 'id' column has a default UUID generator.
 * @param {string} roomId - The UUID of the room.
 * @param {string} senderId - The UUID of the sender.
 * @param {string} content - The message content.
 * @returns {Promise<object>} The formatted new message object.
 */
export async function createGroupMessage(roomId, senderId, content) { // Using named export
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
        sender: sender ? { id: sender.id, username: sender.username, avatar_url: sender.avatar_url } : { id: newMessageBase.sender_id, username: 'Unknown User', avatar_url: null }
    };
  } catch (error) {
    console.error(`Error in createGroupMessage for room ${roomId}, sender ${senderId}:`, error);
    throw error;
  }
}

// --- Socket.IO Setup (ESM Export) ---

export function setupSocket(server) { // Using named export for the setup function
  const io = new Server(server, {
    cors: {
      origin: "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true
    },
    transports: ['websocket', 'polling']
  });

  // Authentication middleware
  io.use(async (socket, next) => {
     try {
       const cookie = socket.handshake.headers.cookie;
       if (!cookie) throw new Error('No cookie provided');
       const sessionId = cookie.split(';').find(c => c.trim().startsWith('sessionId='))?.split('=')[1];
       if (!sessionId) throw new Error('Session ID not found in cookie');

       // Assuming Session.findValid is compatible with ESM
       const session = await Session.findValid(sessionId);
       if (!session || !session.user_id) throw new Error('Invalid session');

       socket.userId = session.user_id;
       next();
     } catch (err) {
       console.error('Socket authentication error:', err.message);
       next(new Error('Authentication error: ' + err.message));
     }
  });

  io.on('connection', (socket) => {
    const userId = socket.userId;
    console.log(`User connected: ${userId} (Socket ID: ${socket.id})`);

    // --- EMIT SESSION INFO ---
    socket.emit('session_info', { userId: userId });

    const personalRoom = `user_${userId}`;
    socket.join(personalRoom);
    console.log(`User ${userId} joined personal room: ${personalRoom}`);

    // --- Event Handlers ---

    // get_user_chats
    socket.on('get_user_chats', async (_, callback) => {
        if (typeof callback !== 'function') return;
        console.log(`User ${userId} requested their chats`);
        try {
          // Assumes these imported functions work correctly with ESM
          const [privateChats, groupChats] = await Promise.all([
            getUserPrivateChats(userId),
            findRoomsByUser(userId)
          ]);

          groupChats.forEach(room => socket.join(`room_${room.id}`));
          console.log(`User ${userId} joined ${groupChats.length} group rooms.`);
          callback({ private: privateChats, group: groupChats });
        } catch (error) {
          console.error(`Error fetching chats for user ${userId}:`, error);
          callback({ error: 'Failed to load your conversations.' });
        }
    });

    // get_private_chat_messages
    socket.on('get_private_chat_messages', async (payload, callback) => {
      if (typeof callback !== 'function') return;
      const { chatId } = payload || {};
      if (!chatId) return callback({ error: 'Chat ID is required.' });
      console.log(`User ${userId} requested messages for private chat: ${chatId}`);
      try {
        const chat = await findPrivateChatByIdAndUser(chatId, userId); // Using imported function
        if (!chat) {
          console.warn(`Security violation: User ${userId} attempted to access private chat ${chatId}`);
          return callback({ error: 'Access denied to this chat.' });
        }
        const messages = await findMessagesByPrivateChat(chatId); // Using imported function
        callback({ messages });
      } catch (error) {
        callback({ error: 'Failed to load messages.' });
      }
    });

    // get_group_chat_messages
    socket.on('get_group_chat_messages', async (payload, callback) => {
        if (typeof callback !== 'function') return;
        const { groupId } = payload || {};
        if (!groupId) return callback({ error: 'Group ID is required.' });
        console.log(`User ${userId} requested messages for group chat: ${groupId}`);
        try {
            const isMember = await isUserRoomMember(groupId, userId); // Using imported function
            if (!isMember) {
                console.warn(`Security violation: User ${userId} attempted to access group ${groupId}`);
                return callback({ error: 'Access denied to this group.' });
            }
            const messages = await findMessagesByRoom(groupId); // Using imported function
            callback({ messages });
        } catch (error) {
            callback({ error: 'Failed to load messages.' });
        }
    });

    // send_private_message
    socket.on('send_private_message', async (payload, callback) => {
        if (typeof callback !== 'function') return;
        const { chatId, content } = payload || {};
        if (!chatId || !content || typeof content !== 'string' || content.trim().length === 0) {
            return callback({ error: 'Invalid message data.' });
        }
        const trimmedContent = content.trim();
        console.log(`User ${userId} sending private message to chat ${chatId}`);
        try {
            const chat = await findPrivateChatByIdAndUser(chatId, userId); // Using imported function
            if (!chat) {
                console.warn(`Security violation: User ${userId} attempted to send to private chat ${chatId}`);
                return callback({ error: 'Cannot send message to this chat.' });
            }
            const recipientId = chat.user1_id === userId ? chat.user2_id : chat.user1_id;
            const newMessage = await createPrivateMessage(chatId, userId, trimmedContent); // Using imported function

            io.to(`user_${recipientId}`).emit('receive_private_message', newMessage);
            console.log(`Emitted receive_private_message to room user_${recipientId}`);

            callback({ messageId: newMessage.id, timestamp: newMessage.timestamp });
        } catch (error) {
            callback({ error: 'Failed to send message.' });
        }
    });

    // send_group_message
    socket.on('send_group_message', async (payload, callback) => {
        if (typeof callback !== 'function') return;
        const { groupId, content } = payload || {};
        if (!groupId || !content || typeof content !== 'string' || content.trim().length === 0) {
            return callback({ error: 'Invalid message data.' });
        }
        const trimmedContent = content.trim();
        console.log(`User ${userId} sending group message to group ${groupId}`);
        try {
            const isMember = await isUserRoomMember(groupId, userId); // Using imported function
            if (!isMember) {
                console.warn(`Security violation: User ${userId} attempted to send to group ${groupId}`);
                return callback({ error: 'Cannot send message to this group.' });
            }
            const newMessage = await createGroupMessage(groupId, userId, trimmedContent); // Using imported function

            io.to(`room_${groupId}`).emit('receive_group_message', newMessage);
            console.log(`Emitted receive_group_message to room room_${groupId}`);

            callback({ messageId: newMessage.id, timestamp: newMessage.timestamp });
        } catch (error) {
            callback({ error: 'Failed to send message.' });
        }
    });


    // disconnect
    socket.on('disconnect', (reason) => {
      console.log(`User disconnected: ${userId} (Reason: ${reason})`);
      // Optional: Update user's online status
      // db.query('UPDATE users SET is_online = FALSE, last_active = NOW() WHERE id = $1', [userId])
      //    .catch(err => console.error(`Error updating presence for user ${userId}:`, err));
    });

  }); // End io.on('connection')

  console.log("Socket.IO server initialized successfully (ESM).");
  return io;
} 