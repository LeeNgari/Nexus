import db from '../../config/db.js';

export async function updateUserPresence(userId, isOnline) {
  try {
    const query = isOnline
      ? 'UPDATE users SET is_online = TRUE WHERE id = $1'
      : 'UPDATE users SET is_online = FALSE, last_active = NOW() WHERE id = $1';
    
    await db.query(query, [userId]);
    
    // Get updated user status
    const result = await db.query(
      'SELECT id, is_online, last_active FROM users WHERE id = $1',
      [userId]
    );
    
    return result.rows[0];
  } catch (error) {
    console.error(`Error updating presence for user ${userId}:`, error);
    throw error;
  }
}

export async function getUserStatus(userId) {
  try {
    const result = await db.query(
      'SELECT id, is_online, last_active FROM users WHERE id = $1',
      [userId]
    );
    return result.rows[0];
  } catch (error) {
    console.error(`Error getting status for user ${userId}:`, error);
    throw error;
  }
}