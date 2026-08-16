const bcrypt = require('bcrypt');

// Every password hash/verify in the app goes through this file — nowhere
// else should require('bcrypt') directly, so the cost factor and algorithm
// stay in one reviewable place.
const SALT_ROUNDS = 12;

function hashPassword(plainPassword) {
  return bcrypt.hash(plainPassword, SALT_ROUNDS);
}

function verifyPassword(plainPassword, passwordHash) {
  return bcrypt.compare(plainPassword, passwordHash);
}

module.exports = { hashPassword, verifyPassword };
