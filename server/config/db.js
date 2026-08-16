const { Pool } = require('pg');
require('dotenv').config();

// Connection pool for Arrear's own Postgres app database.
// NOTE: this is NOT a connection to Epic Clarity. Clarity access (read-only,
// via whatever driver/VPN path the health system requires) will be wired up
// as a separate connection/module later — it should never share this pool.
//
// DATABASE_URL (set in production — see DEPLOY.md for Neon's free tier)
// takes precedence when present. Neon's connection strings already include
// `?sslmode=require`, and node-postgres reads that directly from the URL —
// passing a *separate* `ssl` option alongside a connection string that has
// `sslmode` in it is silently ignored by node-postgres, so it isn't added
// here. Deliberately NOT using `ssl: { rejectUnauthorized: false }`: Neon
// terminates TLS with a Let's Encrypt-issued, publicly-trusted certificate
// (not self-signed), so certificate verification should stay on — that flag
// exists to work around self-signed certs and would be a pure security
// downgrade here for no benefit. See https://neon.com/docs/connect/connect-securely.
//
// Local dev has no DATABASE_URL and keeps using the discrete DB_* vars
// against a plain local Postgres with no TLS.
const pool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL })
  : new Pool({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    });

module.exports = pool;
