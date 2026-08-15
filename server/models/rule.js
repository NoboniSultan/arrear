const pool = require('../config/db');

async function getAll({ programId, status } = {}) {
  const conditions = [];
  const values = [];

  if (programId) {
    values.push(programId);
    conditions.push(`r.program_id = $${values.length}`);
  }
  if (status) {
    values.push(status);
    conditions.push(`r.status = $${values.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const { rows } = await pool.query(
    `
    SELECT r.*, p.name AS program_name, p.full_name AS program_full_name
    FROM rules r
    JOIN programs p ON p.id = r.program_id
    ${where}
    ORDER BY r.updated_at DESC
    `,
    values
  );
  return rows;
}

async function getById(id) {
  const { rows } = await pool.query(
    `
    SELECT r.*, p.name AS program_name, p.full_name AS program_full_name
    FROM rules r
    JOIN programs p ON p.id = r.program_id
    WHERE r.id = $1
    `,
    [id]
  );
  return rows[0];
}

async function create({ programId, name, description, sqlQuery, createdBy }) {
  const { rows } = await pool.query(
    `
    INSERT INTO rules (program_id, name, description, sql_query, version, status, created_by)
    VALUES ($1, $2, $3, $4, 1, 'draft', $5)
    RETURNING *
    `,
    [programId, name, description, sqlQuery, createdBy]
  );
  return rows[0];
}

// Only touches fields that were actually passed — the controller is
// responsible for checking whether the rule's current status allows edits
// at all before calling this.
async function update(id, { name, description, sqlQuery }) {
  const { rows } = await pool.query(
    `
    UPDATE rules
    SET name = coalesce($1, name),
        description = coalesce($2, description),
        sql_query = coalesce($3, sql_query),
        updated_at = now()
    WHERE id = $4
    RETURNING *
    `,
    [name, description, sqlQuery, id]
  );
  return rows[0];
}

async function setStatus(id, status) {
  const { rows } = await pool.query(
    `UPDATE rules SET status = $1, updated_at = now() WHERE id = $2 RETURNING *`,
    [status, id]
  );
  return rows[0];
}

// Called on review approval: the rule's SQL becomes the new finalized
// version and the rule goes live.
async function activateVersion(id, version) {
  const { rows } = await pool.query(
    `UPDATE rules SET status = 'active', version = $1, updated_at = now() WHERE id = $2 RETURNING *`,
    [version, id]
  );
  return rows[0];
}

module.exports = { getAll, getById, create, update, setStatus, activateVersion };
