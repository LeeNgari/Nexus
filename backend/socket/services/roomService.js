import db from  "../../config/db.js";

export async function findRoomsByUser(userId) {
  const queryText = `
    SELECT r.id, r.name, r.avatar_url, r.created_by, r.is_private, r.created_at
    FROM rooms r
    JOIN room_members rm ON r.id = rm.room_id
    WHERE rm.user_id = $1
    ORDER BY r.created_at DESC
  `;
  
  try {
    const result = await db.query(queryText, [userId]);
    return result.rows;
  } catch (error) {
    console.error(`Error in findRoomsByUser for user ${userId}:`, error);
    throw error;
  }
}