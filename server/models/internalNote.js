const pool = require('../config/db');

async function create({ flaggedItemId, author, note }) {
  const { rows } = await pool.query(
    `
    INSERT INTO internal_notes (flagged_item_id, author, note)
    VALUES ($1, $2, $3)
    RETURNING *
    `,
    [flaggedItemId, author, note]
  );
  return rows[0];
}

async function getByFlaggedItemId(flaggedItemId) {
  const { rows } = await pool.query(
    'SELECT * FROM internal_notes WHERE flagged_item_id = $1 ORDER BY created_at ASC',
    [flaggedItemId]
  );
  return rows;
}

module.exports = { create, getByFlaggedItemId };
