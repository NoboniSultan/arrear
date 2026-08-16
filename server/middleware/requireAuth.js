const User = require('../models/user');

// API-only middleware: no HTML redirects, just a 401 JSON error. Re-fetches
// the user on every request (rather than trusting a role/status cached in
// the session at login time) so a deactivated account is locked out
// immediately, not just at its next login.
async function requireAuth(req, res, next) {
  try {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const user = await User.findById(req.session.userId);
    if (!user || !user.is_active) {
      return req.session.destroy(() => res.status(401).json({ error: 'Authentication required' }));
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('Auth check failed:', err.message);
    res.status(500).json({ error: 'Authentication check failed' });
  }
}

module.exports = requireAuth;
