export function formatMessageRow(row) {
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