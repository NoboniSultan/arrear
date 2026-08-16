const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const pool = require('./db');

// Fail fast and loudly rather than silently running with an undefined
// secret (express-session would still start, but every session would be
// signed with "undefined" — a real, quiet security hole).
if (!process.env.SESSION_SECRET) {
  throw new Error('SESSION_SECRET is not set. Add it to your .env file before starting the server.');
}

const COOKIE_NAME = 'arrear.sid';
const isProduction = process.env.NODE_ENV === 'production';

const sessionMiddleware = session({
  store: new pgSession({
    pool,
    // Uses Arrear's own Postgres database — connect-pg-simple creates and
    // manages its own "session" table here on first run.
    createTableIfMissing: true,
  }),
  name: COOKIE_NAME,
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    // false in local dev so the cookie still works over plain http;
    // true in production, where the app is expected to be served over TLS.
    secure: isProduction,
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
  },
});

module.exports = { sessionMiddleware, COOKIE_NAME };
