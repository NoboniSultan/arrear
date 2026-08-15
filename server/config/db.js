const { Pool } = require('pg');
require('dotenv').config();

// Connection pool for Arrear's own Postgres app database.
// NOTE: this is NOT a connection to Epic Clarity. Clarity access (read-only,
// via whatever driver/VPN path the health system requires) will be wired up
// as a separate connection/module later — it should never share this pool.
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

module.exports = pool;
