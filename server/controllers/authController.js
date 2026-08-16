const User = require('../models/user');
const { verifyPassword } = require('../services/authService');
const { COOKIE_NAME } = require('../config/session');
const pool = require('../config/db');

// Identical on every failure path — never reveal whether the email exists
// or the password was wrong.
const GENERIC_LOGIN_ERROR = 'Invalid email or password';

async function logAttempt(email, success, ipAddress) {
  await pool.query(
    'INSERT INTO login_attempts (email, success, ip_address) VALUES ($1, $2, $3)',
    [email, success, ipAddress]
  );
}

// express-session's regenerate() is callback-style; wrapped here so login()
// can stay in the same async/await style as the rest of the codebase.
function regenerateSession(req) {
  return new Promise((resolve, reject) => {
    req.session.regenerate((err) => (err ? reject(err) : resolve()));
  });
}

async function login(req, res) {
  const { email, password } = req.body;

  if (!email || typeof email !== 'string' || !password || typeof password !== 'string') {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const normalizedEmail = email.trim().toLowerCase();

  try {
    const user = await User.findByEmail(normalizedEmail);

    if (!user || !user.is_active) {
      await logAttempt(normalizedEmail, false, req.ip);
      return res.status(401).json({ error: GENERIC_LOGIN_ERROR });
    }

    const passwordMatches = await verifyPassword(password, user.password_hash);
    if (!passwordMatches) {
      await logAttempt(normalizedEmail, false, req.ip);
      return res.status(401).json({ error: GENERIC_LOGIN_ERROR });
    }

    await logAttempt(normalizedEmail, true, req.ip);

    // Regenerate the session ID BEFORE establishing the authenticated
    // session — defends against session fixation, since any session ID
    // that existed pre-login (e.g. one an attacker planted) is discarded.
    await regenerateSession(req);
    req.session.userId = user.id;
    await User.updateLastLogin(user.id);

    res.json({ id: user.id, email: user.email, full_name: user.full_name, role: user.role });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ error: 'Login failed' });
  }
}

function logout(req, res) {
  if (!req.session) {
    return res.json({ success: true });
  }
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err.message);
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.clearCookie(COOKIE_NAME);
    res.json({ success: true });
  });
}

async function getCurrentUser(req, res) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: 'Not logged in' });
  }

  try {
    const user = await User.findById(req.session.userId);
    if (!user || !user.is_active) {
      return res.status(401).json({ error: 'Not logged in' });
    }
    res.json({ id: user.id, email: user.email, full_name: user.full_name, role: user.role });
  } catch (err) {
    console.error('getCurrentUser error:', err.message);
    res.status(500).json({ error: 'Failed to load current user' });
  }
}

module.exports = { login, logout, getCurrentUser };
