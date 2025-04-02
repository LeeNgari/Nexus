import pool from '../config/db.js';

if (!pool) {
  throw new Error('Database pool is not initialized');
}

async function create(userId, code) {
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiration

  try {
    await pool.query(
      'INSERT INTO two_factor_codes (user_id, code, expires_at) VALUES ($1::uuid, $2, $3)',
      [userId, code, expiresAt]
    );
  } catch (error) {
    console.error('Error creating 2FA code:', error);
    throw error;
  }
}

async function verify(userId, code) {
  console.log('Verifying code:', { userId, code });

  try {
    // Delete expired codes first
    await pool.query(
      'DELETE FROM two_factor_codes WHERE expires_at < NOW()'
    );

    // Check if valid code exists
    const { rows } = await pool.query(
      `DELETE FROM two_factor_codes 
       WHERE user_id = $1 AND code = $2 AND expires_at >= NOW() 
       RETURNING code_id`,
      [userId, code]
    );

    console.log('Verification result:', { rowsFound: rows.length });
    return rows.length > 0;
  } catch (error) {
    console.error('Verification error:', error);
    throw error;
  }
}

export default { create, verify };