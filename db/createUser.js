// The ONLY way accounts get created — there is deliberately no public
// registration endpoint anywhere in the API. Run this from the machine
// that has access to the app's Postgres database (same .env as the server).
//
// Usage:
//   node db/createUser.js --email you@example.com --password "..." --name "Your Name" --role owner
//
// --role defaults to "analyst" if omitted. Valid roles: owner, analyst.

require('dotenv').config();
const pool = require('../server/config/db');
const { hashPassword } = require('../server/services/authService');

const VALID_ROLES = ['owner', 'analyst'];
const MIN_PASSWORD_LENGTH = 8;

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i].startsWith('--')) {
      args[argv[i].slice(2)] = argv[i + 1];
      i += 1;
    }
  }
  return args;
}

function printUsageAndExit(message) {
  console.error(message);
  console.error('\nUsage: node db/createUser.js --email you@example.com --password "..." --name "Your Name" --role owner');
  process.exit(1);
}

async function createUser() {
  const { email, password, name, role = 'analyst' } = parseArgs(process.argv.slice(2));

  if (!email || !password || !name) {
    printUsageAndExit('--email, --password, and --name are all required.');
  }
  if (!VALID_ROLES.includes(role)) {
    printUsageAndExit(`Invalid --role "${role}". Must be one of: ${VALID_ROLES.join(', ')}.`);
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    printUsageAndExit(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
  }

  const normalizedEmail = email.trim().toLowerCase();

  const existing = await pool.query('SELECT id FROM users WHERE email = $1', [normalizedEmail]);
  if (existing.rows.length > 0) {
    console.error(`A user with email "${normalizedEmail}" already exists. Refusing to create a duplicate.`);
    process.exit(1);
  }

  const passwordHash = await hashPassword(password);

  const { rows } = await pool.query(
    `
    INSERT INTO users (email, password_hash, full_name, role)
    VALUES ($1, $2, $3, $4)
    RETURNING id, email, full_name, role, created_at
    `,
    [normalizedEmail, passwordHash, name, role]
  );

  const user = rows[0];
  console.log(`Created user #${user.id}: ${user.full_name} <${user.email}> (${user.role})`);
}

createUser()
  .catch((err) => {
    console.error('Failed to create user:', err.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
