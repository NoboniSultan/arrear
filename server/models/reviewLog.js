const pool = require('../config/db');

async function create({ flaggedItemId, reviewer, action, notes }) {
  const { rows } = await pool.query(
    `
    INSERT INTO review_log (flagged_item_id, reviewer, action, notes)
    VALUES ($1, $2, $3, $4)
    RETURNING *
    `,
    [flaggedItemId, reviewer, action, notes]
  );
  return rows[0];
}

async function getByFlaggedItemId(flaggedItemId) {
  const { rows } = await pool.query(
    'SELECT * FROM review_log WHERE flagged_item_id = $1 ORDER BY timestamp DESC',
    [flaggedItemId]
  );
  return rows;
}

module.exports = { create, getByFlaggedItemId };
