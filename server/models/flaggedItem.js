const pool = require('../config/db');

const SORTABLE_COLUMNS = {
  estimated_dollar_value: 'fi.estimated_dollar_value',
  created_at: 'fi.created_at',
  patient_ref: 'fi.patient_ref',
};

// EPIC CLARITY INTEGRATION POINT: getAll/getById currently read rows that
// db/seed.js inserted with synthetic data. Once Clarity access exists, the
// write path that populates flagged_items will move to a scheduled sync
// job — this model's read queries should be able to stay the same.

async function getAll({
  program,
  status,
  assignee,
  minValue,
  days,
  deadlineDays,
  sort = 'created_at',
  order = 'desc',
  page = 1,
  pageSize = 10,
} = {}) {
  const conditions = [];
  const values = [];

  if (program) {
    values.push(program);
    conditions.push(`p.name = $${values.length}`);
  }
  if (status) {
    const statuses = String(status).split(',').map((s) => s.trim()).filter(Boolean);
    if (statuses.length) {
      values.push(statuses);
      conditions.push(`fi.status = ANY($${values.length})`);
    }
  }
  if (assignee) {
    if (assignee === 'unassigned') {
      conditions.push('fi.assignee IS NULL');
    } else {
      values.push(assignee);
      conditions.push(`fi.assignee = $${values.length}`);
    }
  }
  if (minValue) {
    values.push(minValue);
    conditions.push(`fi.estimated_dollar_value >= $${values.length}`);
  }
  if (days) {
    values.push(Number(days));
    conditions.push(`fi.created_at >= now() - ($${values.length} || ' days')::interval`);
  }
  if (deadlineDays) {
    values.push(Number(deadlineDays));
    conditions.push(`fi.submit_by_date <= now() + ($${values.length} || ' days')::interval`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const sortColumn = SORTABLE_COLUMNS[sort] || SORTABLE_COLUMNS.created_at;
  const sortOrder = String(order).toLowerCase() === 'asc' ? 'ASC' : 'DESC';

  const countResult = await pool.query(
    `
    SELECT count(*)::int AS total,
           count(*) FILTER (WHERE fi.status IN ('new', 'reviewed'))::int AS open_count,
           coalesce(sum(fi.estimated_dollar_value) FILTER (WHERE fi.status IN ('new', 'reviewed')), 0) AS open_value
    FROM flagged_items fi
    JOIN programs p ON p.id = fi.program_id
    ${where}
    `,
    values
  );

  const pageNum = Math.max(1, Number(page) || 1);
  const size = Math.max(1, Number(pageSize) || 10);
  const offset = (pageNum - 1) * size;

  const { rows } = await pool.query(
    `
    SELECT fi.*, p.name AS program_name, p.full_name AS program_full_name
    FROM flagged_items fi
    JOIN programs p ON p.id = fi.program_id
    ${where}
    ORDER BY ${sortColumn} ${sortOrder}
    LIMIT ${size} OFFSET ${offset}
    `,
    values
  );

  return {
    items: rows,
    total: countResult.rows[0].total,
    openCount: countResult.rows[0].open_count,
    openValue: Number(countResult.rows[0].open_value),
    page: pageNum,
    pageSize: size,
  };
}

async function getOldestUnworked(limit = 5) {
  const { rows } = await pool.query(
    `
    SELECT fi.*, p.name AS program_name, p.full_name AS program_full_name
    FROM flagged_items fi
    JOIN programs p ON p.id = fi.program_id
    WHERE fi.status IN ('new', 'reviewed')
    ORDER BY fi.created_at ASC
    LIMIT $1
    `,
    [limit]
  );
  return rows;
}

async function getById(id) {
  const { rows } = await pool.query(
    `
    SELECT fi.*, p.name AS program_name, p.full_name AS program_full_name
    FROM flagged_items fi
    JOIN programs p ON p.id = fi.program_id
    WHERE fi.id = $1
    `,
    [id]
  );
  const item = rows[0];
  if (!item) return null;

  const [checklistResult, auditEventsResult, reviewLogResult, notesResult, positionResult] = await Promise.all([
    pool.query(
      'SELECT * FROM criteria_checklist WHERE flagged_item_id = $1 ORDER BY sort_order ASC',
      [id]
    ),
    pool.query(
      'SELECT * FROM audit_events WHERE flagged_item_id = $1 ORDER BY occurred_at ASC',
      [id]
    ),
    pool.query(
      'SELECT * FROM review_log WHERE flagged_item_id = $1 ORDER BY timestamp ASC',
      [id]
    ),
    pool.query(
      'SELECT * FROM internal_notes WHERE flagged_item_id = $1 ORDER BY created_at ASC',
      [id]
    ),
    pool.query(
      `
      SELECT position, total FROM (
        SELECT id, row_number() OVER (ORDER BY created_at ASC) AS position, count(*) OVER () AS total
        FROM flagged_items
      ) ranked
      WHERE ranked.id = $1
      `,
      [id]
    ),
  ]);

  const reviewActionLabels = {
    reviewed: 'Reviewed',
    submitted: 'Submitted',
    rejected: 'Rejected',
    needs_info: 'More info requested',
  };

  const auditTrail = [
    ...auditEventsResult.rows.map((e) => ({
      description: e.description,
      actor: e.actor,
      occurredAt: e.occurred_at,
    })),
    ...reviewLogResult.rows.map((r) => ({
      description: `${reviewActionLabels[r.action] || r.action} by ${r.reviewer}`,
      actor: r.reviewer,
      occurredAt: r.timestamp,
    })),
    ...notesResult.rows.map((n) => ({
      description: `Note added by ${n.author}`,
      actor: n.author,
      occurredAt: n.created_at,
    })),
  ].sort((a, b) => new Date(a.occurredAt) - new Date(b.occurredAt));

  if (item.status === 'new' || item.status === 'reviewed') {
    const lastEventAt = auditTrail.length ? new Date(auditTrail[auditTrail.length - 1].occurredAt) : new Date(item.created_at);
    const daysOpen = Math.max(0, Math.floor((Date.now() - lastEventAt.getTime()) / 86400000));
    auditTrail.push({ description: 'Awaiting your disposition', actor: null, occurredAt: null, pending: true, daysOpen });
  }

  return {
    ...item,
    criteriaChecklist: checklistResult.rows,
    auditTrail,
    internalNotes: notesResult.rows,
    position: positionResult.rows[0] ? Number(positionResult.rows[0].position) : null,
    totalCount: positionResult.rows[0] ? Number(positionResult.rows[0].total) : null,
  };
}

// Global feed across all items, backing the "Audit log" nav page. Merges the
// same three sources used per-item in getById, but org-wide.
async function getGlobalAuditLog(limit = 100) {
  const { rows } = await pool.query(
    `
    SELECT * FROM (
      SELECT 'detection' AS source, ae.description, ae.actor, ae.occurred_at AS at,
             fi.patient_ref, fi.id AS flagged_item_id, p.name AS program_name
      FROM audit_events ae
      JOIN flagged_items fi ON fi.id = ae.flagged_item_id
      JOIN programs p ON p.id = fi.program_id

      UNION ALL

      SELECT 'review', (initcap(rl.action) || ' by ' || rl.reviewer), rl.reviewer, rl.timestamp,
             fi.patient_ref, fi.id, p.name
      FROM review_log rl
      JOIN flagged_items fi ON fi.id = rl.flagged_item_id
      JOIN programs p ON p.id = fi.program_id

      UNION ALL

      SELECT 'note', ('Note added by ' || n.author), n.author, n.created_at,
             fi.patient_ref, fi.id, p.name
      FROM internal_notes n
      JOIN flagged_items fi ON fi.id = n.flagged_item_id
      JOIN programs p ON p.id = fi.program_id
    ) feed
    ORDER BY at DESC
    LIMIT $1
    `,
    [limit]
  );
  return rows;
}

async function updateStatus(id, status) {
  const setSubmittedAt = status === 'submitted' ? ', submitted_at = now()' : '';
  const { rows } = await pool.query(
    `UPDATE flagged_items SET status = $1${setSubmittedAt} WHERE id = $2 RETURNING *`,
    [status, id]
  );
  return rows[0];
}

module.exports = { getAll, getOldestUnworked, getById, updateStatus, getGlobalAuditLog };
