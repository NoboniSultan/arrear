const pool = require('../config/db');

// Includes password_hash — only authController's login flow should ever
// read that field off the result.
async function findByEmail(email) {
  const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  return rows[0];
}

// Deliberately never selects password_hash — this is the "safe" read used
// by session checks (requireAuth, /api/auth/me) and anywhere else in the
// app that just needs to know who's logged in.
async function findById(id) {
  const { rows } = await pool.query(
    'SELECT id, email, full_name, role, is_active, last_login_at, created_at FROM users WHERE id = $1',
    [id]
  );
  return rows[0];
}

async function updateLastLogin(id) {
  await pool.query('UPDATE users SET last_login_at = now() WHERE id = $1', [id]);
}

module.exports = { findByEmail, findById, updateLastLogin };
