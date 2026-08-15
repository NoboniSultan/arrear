const pool = require('../config/db');

async function create({ ruleId, reviewer, action, notes }) {
  const { rows } = await pool.query(
    `
    INSERT INTO rule_reviews (rule_id, reviewer, action, notes)
    VALUES ($1, $2, $3, $4)
    RETURNING *
    `,
    [ruleId, reviewer, action, notes]
  );
  return rows[0];
}

async function getByRuleId(ruleId) {
  const { rows } = await pool.query(
    'SELECT * FROM rule_reviews WHERE rule_id = $1 ORDER BY created_at DESC',
    [ruleId]
  );
  return rows;
}

module.exports = { create, getByRuleId };
