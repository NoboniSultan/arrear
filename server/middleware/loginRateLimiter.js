const { rateLimit, ipKeyGenerator } = require('express-rate-limit');

// Keyed by IP + email so one bad actor can't lock other users out of the
// same IP (e.g. shared office network), while still capping brute-force
// attempts against any single account. ipKeyGenerator normalizes IPv6
// addresses so a client can't trivially bypass the limit by rotating
// within the same /64.
const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const email = String((req.body && req.body.email) || '').trim().toLowerCase();
    return `${ipKeyGenerator(req.ip)}:${email}`;
  },
  message: { error: 'Too many login attempts. Please try again later.' },
});

module.exports = loginRateLimiter;
