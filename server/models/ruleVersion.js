const pool = require('../config/db');

// Permanent history — rows here are never updated or deleted after insert.
async function create({ ruleId, version, sqlQuery, changeNotes, finalizedBy }) {
  const { rows } = await pool.query(
    `
    INSERT INTO rule_versions (rule_id, version, sql_query, change_notes, finalized_by)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
    `,
    [ruleId, version, sqlQuery, changeNotes, finalizedBy]
  );
  return rows[0];
}

async function getByRuleId(ruleId) {
  const { rows } = await pool.query(
    'SELECT * FROM rule_versions WHERE rule_id = $1 ORDER BY version DESC',
    [ruleId]
  );
  return rows;
}

module.exports = { create, getByRuleId };
