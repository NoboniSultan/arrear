const pool = require('../config/db');
const { isReadOnlyQuery } = require('./sqlValidationService');

const PREVIEW_ROW_LIMIT = 50;

// Wraps the analyst's query as a subquery and applies LIMIT to the outer
// SELECT, rather than string-splicing any LIMIT the analyst already wrote.
// That way the cap holds regardless of what's inside — a bigger LIMIT, no
// LIMIT at all, or one buried inside a CTE.
function wrapWithHardLimit(sqlQuery) {
  const stripped = sqlQuery.trim().replace(/;\s*$/, '');
  return `SELECT * FROM (${stripped}) AS rule_preview_subquery LIMIT ${PREVIEW_ROW_LIMIT}`;
}

// PRODUCTION NOTE: this reuses Arrear's normal connection pool for now,
// because in this synthetic-data phase there is only one local Postgres
// database and no separate Epic Clarity connection yet. Once this previews
// against a real EMR-backed source, it MUST run through a read-only replica
// or a database role granted SELECT only — never a connection that also has
// write access — so a bug (or a query that somehow slips past
// isReadOnlyQuery) can't mutate real patient data.
async function previewRule(sqlQuery) {
  const validation = isReadOnlyQuery(sqlQuery);
  if (!validation.ok) {
    throw new Error(validation.reason);
  }

  const limitedQuery = wrapWithHardLimit(sqlQuery);
  const result = await pool.query(limitedQuery);

  return {
    rowCount: result.rowCount,
    sampleRows: result.rows,
    executedAt: new Date().toISOString(),
  };
}

module.exports = { previewRule };
