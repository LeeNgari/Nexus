import { getUserStatus } from '../services/presenceService.js';

export function setupPresenceHandlers(io, socket) {
  const userId = socket.userId;

  // Request status of specific users
  socket.on('get_user_statuses', async (userIds, callback) => {
    if (typeof callback !== 'function') return;
    
    try {
      const statusPromises = userIds.map(id => getUserStatus(id));
      const statuses = await Promise.all(statusPromises);
      
      callback(statuses.map(status => ({
        userId: status.id,
        isOnline: status.is_online,
        lastActive: status.last_active?.toISOString()
      })));
    } catch (error) {
      console.error(`Error getting statuses for users:`, error);
      callback({ error: 'Failed to get user statuses' });
    }
  });
}