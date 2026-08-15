const pool = require('../config/db');
const FlaggedItem = require('./flaggedItem');

function monthLabel(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function currentQuarterMonths(today) {
  const quarterStartMonth = Math.floor(today.getMonth() / 3) * 3;
  return [0, 1, 2].map((i) => monthLabel(new Date(today.getFullYear(), quarterStartMonth + i, 1)));
}

function priorQuarterMonths(today) {
  const quarterStartMonth = Math.floor(today.getMonth() / 3) * 3;
  return [0, 1, 2].map((i) => monthLabel(new Date(today.getFullYear(), quarterStartMonth - 3 + i, 1)));
}

async function getAll() {
  const today = new Date();
  const thisQuarterMonths = currentQuarterMonths(today);

  const [programsResult, changelogResult, quarterRecoveredResult, flagsThisQuarterResult] = await Promise.all([
    pool.query('SELECT * FROM programs ORDER BY name'),
    pool.query('SELECT * FROM rule_set_changes ORDER BY change_date DESC'),
    pool.query(
      `
      SELECT program_id, coalesce(sum(total_recovered), 0) AS total_recovered
      FROM recovery_summary
      WHERE period = ANY($1)
      GROUP BY program_id
      `,
      [thisQuarterMonths]
    ),
    pool.query(
      `
      SELECT program_id, count(*)::int AS flags_this_quarter
      FROM flagged_items
      WHERE created_at >= date_trunc('quarter', now())
      GROUP BY program_id
      `
    ),
  ]);

  const changelogByProgram = {};
  for (const row of changelogResult.rows) {
    if (!changelogByProgram[row.program_id]) changelogByProgram[row.program_id] = [];
    changelogByProgram[row.program_id].push(row);
  }
  const recoveredByProgram = Object.fromEntries(
    quarterRecoveredResult.rows.map((r) => [r.program_id, Number(r.total_recovered)])
  );
  const flagsByProgram = Object.fromEntries(
    flagsThisQuarterResult.rows.map((r) => [r.program_id, r.flags_this_quarter])
  );

  return programsResult.rows.map((p) => ({
    ...p,
    recoveredThisQuarter: recoveredByProgram[p.id] || 0,
    flagsThisQuarter: flagsByProgram[p.id] || 0,
    changelog: changelogByProgram[p.id] || [],
  }));
}

async function getById(id) {
  const { rows } = await pool.query('SELECT * FROM programs WHERE id = $1', [id]);
  return rows[0];
}

async function create({ name, fullName, description, rulesVersion }) {
  const { rows } = await pool.query(
    `
    INSERT INTO programs (name, full_name, description, rules_version, last_updated, status)
    VALUES ($1, $2, $3, $4, now(), 'paused')
    RETURNING *
    `,
    [name, fullName, description, rulesVersion]
  );
  return rows[0];
}

const SETTINGS_FIELDS = {
  status: 'status',
  minEstimatedValue: 'min_estimated_value',
  encounterLookbackMonths: 'encounter_lookback_months',
  detectionRunSchedule: 'detection_run_schedule',
  requireCoderReview: 'require_coder_review',
  reflagOnAmendment: 'reflag_on_amendment',
  emailDigestEnabled: 'email_digest_enabled',
};

async function updateSettings(id, patch) {
  const setClauses = [];
  const values = [];

  for (const [key, column] of Object.entries(SETTINGS_FIELDS)) {
    if (Object.prototype.hasOwnProperty.call(patch, key)) {
      values.push(patch[key]);
      setClauses.push(`${column} = $${values.length}`);
    }
  }
  if (!setClauses.length) return getById(id);

  values.push(id);
  const { rows } = await pool.query(
    `UPDATE programs SET ${setClauses.join(', ')}, last_updated = now() WHERE id = $${values.length} RETURNING *`,
    values
  );
  return rows[0];
}

// Backs GET /api/summary (the Overview page). Combines the independently
// rolled-up recovery_summary trend with live counts from flagged_items,
// since the current-in-progress period should reflect the real queue.
async function getOverviewData() {
  const today = new Date();
  const thisQuarter = currentQuarterMonths(today);
  const priorQuarter = priorQuarterMonths(today);
  const quarterStart = new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3, 1);

  const [
    programsResult,
    trendResult,
    quarterByProgramResult,
    priorQuarterResult,
    openCountsResult,
    submittedCountResult,
    awaitingResult,
    oldestUnworked,
  ] = await Promise.all([
    pool.query('SELECT id, name, full_name, status FROM programs ORDER BY name'),
    pool.query(
      `
      SELECT period, coalesce(sum(total_recovered), 0) AS total_recovered
      FROM recovery_summary
      GROUP BY period
      ORDER BY period ASC
      `
    ),
    pool.query(
      `
      SELECT rs.program_id, p.name, p.full_name, coalesce(sum(rs.total_recovered), 0) AS total_recovered
      FROM recovery_summary rs
      JOIN programs p ON p.id = rs.program_id
      WHERE rs.period = ANY($1)
      GROUP BY rs.program_id, p.name, p.full_name
      `,
      [thisQuarter]
    ),
    pool.query(
      `SELECT coalesce(sum(total_recovered), 0) AS total_recovered FROM recovery_summary WHERE period = ANY($1)`,
      [priorQuarter]
    ),
    pool.query(
      `
      SELECT status, count(*)::int AS count
      FROM flagged_items
      WHERE status IN ('new', 'reviewed')
      GROUP BY status
      `
    ),
    pool.query(`SELECT count(*)::int AS count FROM flagged_items WHERE status = 'submitted'`),
    pool.query(
      `
      SELECT coalesce(sum(estimated_dollar_value), 0) AS total_value, count(*)::int AS item_count,
             min(submit_by_date) AS nearest_deadline
      FROM flagged_items
      WHERE status = 'reviewed'
      `
    ),
    FlaggedItem.getOldestUnworked(5),
  ]);

  const openByStatus = Object.fromEntries(openCountsResult.rows.map((r) => [r.status, r.count]));
  const currentQuarterTotal = quarterByProgramResult.rows.reduce((sum, r) => sum + Number(r.total_recovered), 0);
  const priorQuarterTotal = Number(priorQuarterResult.rows[0].total_recovered);
  const pctChangeVsPrior = priorQuarterTotal > 0
    ? ((currentQuarterTotal - priorQuarterTotal) / priorQuarterTotal) * 100
    : null;

  const awaiting = awaitingResult.rows[0];
  let nearestDeadlineDays = null;
  if (awaiting.nearest_deadline) {
    nearestDeadlineDays = Math.ceil((new Date(awaiting.nearest_deadline) - today) / 86400000);
  }

  return {
    asOfDate: today.toISOString().slice(0, 10),
    quarterStartDate: quarterStart.toISOString().slice(0, 10),
    activeProgramCount: programsResult.rows.filter((p) => p.status === 'active').length,
    totalProgramCount: programsResult.rows.length,
    flaggedItemsOpen: {
      total: (openByStatus.new || 0) + (openByStatus.reviewed || 0),
      new: openByStatus.new || 0,
      reviewed: openByStatus.reviewed || 0,
    },
    recoveredPeriodToDate: {
      total: currentQuarterTotal,
      pctChangeVsPrior,
      itemsSubmittedTotal: submittedCountResult.rows[0].count,
    },
    awaitingSubmission: {
      total: Number(awaiting.total_value),
      itemsReviewedCount: awaiting.item_count,
      nearestDeadlineDays,
    },
    monthlyTrend: trendResult.rows.map((r) => ({ period: r.period, totalRecovered: Number(r.total_recovered) })),
    recoveredByProgram: quarterByProgramResult.rows
      .map((r) => ({
        programId: r.program_id,
        name: r.name,
        fullName: r.full_name,
        totalRecovered: Number(r.total_recovered),
      }))
      .sort((a, b) => b.totalRecovered - a.totalRecovered),
    oldestUnworkedFlags: oldestUnworked,
  };
}

module.exports = { getAll, getById, create, updateSettings, getOverviewData };
