// In-memory store for typing status
const typingUsers = new Map();

export function startTyping(userId, chatId, groupId) {
  const key = groupId ? `group_${groupId}` : `private_${chatId}`;
  
  // Clear any existing timeout
  if (typingUsers.has(key)) {
    const { timeout } = typingUsers.get(key);
    clearTimeout(timeout);
  }

  // Set new timeout (3 seconds of inactivity will auto-stop)
  const timeout = setTimeout(() => {
    stopTyping(userId, chatId, groupId);
  }, 3000);

  typingUsers.set(key, { userId, timeout });
}

export function stopTyping(userId, chatId, groupId) {
  const key = groupId ? `group_${groupId}` : `private_${chatId}`;
  
  if (typingUsers.has(key)) {
    const { timeout } = typingUsers.get(key);
    clearTimeout(timeout);
    typingUsers.delete(key);
  }
}

export function getTypingStatus(chatId, groupId) {
  const key = groupId ? `group_${groupId}` : `private_${chatId}`;
  return typingUsers.get(key);
}