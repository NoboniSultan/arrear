// Synthetic dataset for local development and testing only.
//
// Every patient_ref, provider name, claim number, and dollar figure below is
// fabricated — none of it is derived from, or resembles, real patient data.
// patient_ref values are placeholders like "SYN-0001", never a real name or
// MRN format.
//
// EPIC CLARITY INTEGRATION POINT: this script is the *only* source of
// flagged_items data today. Once Clarity access exists, real gap-detection
// queries will populate flagged_items (and criteria_checklist/audit_events)
// via a separate sync job, and this script will remain useful only for local
// dev/test environments that don't have Clarity access.

require('dotenv').config();
const pool = require('../server/config/db');

function randomInt(min, max) {
  return Math.floor(min + Math.random() * (max - min + 1));
}

function randomDollarValue(min = 50, max = 800) {
  return Math.round((min + Math.random() * (max - min)) * 100) / 100;
}

function addDays(date, days) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function isoDate(date) {
  return date.toISOString().slice(0, 10);
}

function monthLabel(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

const PROVIDERS = [
  'A. Lindqvist, MD',
  'R. Castellano, MD',
  'S. Okoye, NP',
  'B. Whitfield, MD',
  'T. Marchetti, DO',
  'K. Nakashima, MD',
];

// Cycled per-program (index 0-9). Weighted toward 'M. Reyes' so the
// "assigned to me" / "my queue" views have real content to show.
const ASSIGNEE_CYCLE = [
  'M. Reyes', 'J. Whitcombe', 'M. Reyes', 'D. Marsh', 'M. Reyes',
  null, 'J. Whitcombe', 'M. Reyes', 'D. Marsh', 'M. Reyes',
];

const ADMIN_ACTOR = 'D. Oyelaran';

const STATUSES = ['new', 'reviewed', 'submitted', 'rejected'];

const RULE_AUTHOR = 'D. Marsh';
const RULE_APPROVER = 'D. Oyelaran';

// One seeded rule per existing program, already through one full
// review cycle (draft -> in_review -> approved -> active) so the Rules
// screens have real version/review history to render immediately.
//
// The sql_query here is a genuinely runnable SELECT against Arrear's own
// schema — there's no separate Epic Clarity connection yet, so this is what
// the preview feature actually executes against in this synthetic-data
// phase. Once Clarity is connected, these queries get rewritten against its
// reporting views instead.
const RULE_DEFS = {
  MIPS: {
    name: 'MIPS quality gap: unsubmitted measures',
    description: "Flags encounters where a quality measure's numerator criteria are documented in the chart but no corresponding measure was submitted for the current reporting period.",
    sqlQuery: `-- Illustrative query against Arrear's own schema for local development.
-- Once Epic Clarity is connected, this will be rewritten against Clarity's
-- quality-measure reporting views instead of flagged_items.
SELECT patient_ref, title, criteria_matched, estimated_dollar_value, encounter_date
FROM flagged_items
WHERE program_id = (SELECT id FROM programs WHERE name = 'MIPS')
  AND status IN ('new', 'reviewed')
ORDER BY estimated_dollar_value DESC`,
  },
  HCC: {
    name: 'HCC recapture: CKD linkage',
    description: 'Flags encounters where a diabetes diagnosis with a documented chronic kidney disease link never received the corresponding HCC-relevant code on a claim.',
    sqlQuery: `-- Illustrative query against Arrear's own schema for local development.
-- Once Epic Clarity is connected, this will be rewritten against Clarity's
-- diagnosis/encounter/claim reporting views instead of flagged_items.
SELECT patient_ref, title, criteria_matched, estimated_dollar_value, encounter_date
FROM flagged_items
WHERE program_id = (SELECT id FROM programs WHERE name = 'HCC')
  AND status IN ('new', 'reviewed')
ORDER BY estimated_dollar_value DESC`,
  },
};

// Each entry pairs the existing one-line "criteria_matched" summary with the
// richer detail-page content (headline, as-submitted vs. proposed coding).
const HCC_ITEMS = [
  {
    summary: 'Chronic kidney disease stage documented in progress note but not coded on claim',
    title: 'N18.30 — chronic kidney disease, stage 3 unspecified',
    asSubmitted: { code: 'N/A', description: 'No CKD diagnosis code submitted on the claim', raf: 0 },
    proposed: { code: 'N18.30', description: 'Chronic kidney disease, stage 3 unspecified', raf: 0.237 },
  },
  {
    summary: 'Type 2 diabetes with chronic complication noted in visit note, not captured as HCC-relevant code',
    title: 'E11.22 — type 2 diabetes mellitus with diabetic chronic kidney disease',
    asSubmitted: { code: 'E11.9', description: 'Type 2 diabetes without complications', raf: 0 },
    proposed: { code: 'E11.22 + N18.30', description: 'Type 2 diabetes with diabetic CKD; CKD stage 3 unspecified', raf: 0.318 },
  },
  {
    summary: 'Major depressive disorder documented and treated, condition not recaptured this calendar year',
    title: 'F32.1 — major depressive disorder, moderate',
    asSubmitted: { code: 'N/A', description: 'No behavioral health diagnosis recaptured this plan year', raf: 0 },
    proposed: { code: 'F32.1', description: 'Major depressive disorder, moderate, single episode', raf: 0.294 },
  },
  {
    summary: 'COPD confirmed via pulmonary function test in chart, not coded on most recent encounter',
    title: 'J44.9 — chronic obstructive pulmonary disease, unspecified',
    asSubmitted: { code: 'N/A', description: 'Most recent encounter carried no respiratory diagnosis code', raf: 0 },
    proposed: { code: 'J44.9', description: 'Chronic obstructive pulmonary disease, unspecified', raf: 0.335 },
  },
  {
    summary: 'Congestive heart failure history noted in problem list, not recaptured on annual wellness visit claim',
    title: 'I50.32 — chronic diastolic (congestive) heart failure',
    asSubmitted: { code: 'N/A', description: 'Annual wellness visit claim carried no cardiac diagnosis code', raf: 0 },
    proposed: { code: 'I50.32', description: 'Chronic diastolic (congestive) heart failure', raf: 0.331 },
  },
  {
    summary: 'Morbid obesity (BMI documented in vitals) noted, not coded despite chronic condition impact',
    title: 'E66.01 — morbid (severe) obesity due to excess calories',
    asSubmitted: { code: 'N/A', description: 'No obesity diagnosis code submitted despite documented BMI', raf: 0 },
    proposed: { code: 'E66.01', description: 'Morbid (severe) obesity due to excess calories', raf: 0.250 },
  },
  {
    summary: 'Peripheral vascular disease mentioned in specialist note, not reflected in HCC coding',
    title: 'I73.9 — peripheral vascular disease, unspecified',
    asSubmitted: { code: 'N/A', description: 'Specialist note findings were not reflected in submitted coding', raf: 0 },
    proposed: { code: 'I73.9', description: 'Peripheral vascular disease, unspecified', raf: 0.299 },
  },
  {
    summary: 'Rheumatoid arthritis under active treatment, condition not recaptured this year',
    title: 'M06.9 — rheumatoid arthritis, unspecified',
    asSubmitted: { code: 'N/A', description: 'Condition not recaptured on any claim this plan year', raf: 0 },
    proposed: { code: 'M06.9', description: 'Rheumatoid arthritis, unspecified', raf: 0.379 },
  },
  {
    summary: 'Vascular dementia documented in neurology note, not coded on primary care encounter',
    title: 'F01.50 — vascular dementia without behavioral disturbance',
    asSubmitted: { code: 'N/A', description: 'Primary care encounter carried no cognitive diagnosis code', raf: 0 },
    proposed: { code: 'F01.50', description: 'Vascular dementia without behavioral disturbance', raf: 0.442 },
  },
  {
    summary: 'Chronic ulcer of the skin documented and treated, not captured in HCC coding',
    title: 'L97.929 — non-pressure chronic ulcer of unspecified part of unspecified leg',
    asSubmitted: { code: 'N/A', description: 'Treatment documented but no corresponding ulcer diagnosis code submitted', raf: 0 },
    proposed: { code: 'L97.929', description: 'Non-pressure chronic ulcer of unspecified part of unspecified leg, unspecified severity', raf: 0.279 },
  },
];

const MIPS_ITEMS = [
  {
    summary: 'Diabetic patient, A1C test documented in encounter, no corresponding MIPS quality measure submitted',
    title: 'Quality 001 — diabetes: hemoglobin A1c poor control',
    asSubmitted: { code: 'N/A', description: 'No quality measure numerator submitted for this encounter', raf: null },
    proposed: { code: 'Quality 001', description: 'A1C result documented and within numerator criteria', raf: null },
  },
  {
    summary: 'Patient screened for depression (PHQ-9 documented), screening measure not reported to MIPS',
    title: 'Quality 134 — preventive care and screening: depression screening',
    asSubmitted: { code: 'N/A', description: 'Screening completed but not reported as a quality measure', raf: null },
    proposed: { code: 'Quality 134', description: 'PHQ-9 screening and follow-up plan documented', raf: null },
  },
  {
    summary: 'Controlling high blood pressure measure met at last visit, measure not submitted this reporting period',
    title: 'Quality 236 — controlling high blood pressure',
    asSubmitted: { code: 'N/A', description: 'Measure not submitted for the current reporting period', raf: null },
    proposed: { code: 'Quality 236', description: 'Most recent BP reading under 140/90 at last visit', raf: null },
  },
  {
    summary: 'Tobacco use screening and cessation counseling documented, measure not submitted',
    title: 'Quality 226 — tobacco use: screening and cessation intervention',
    asSubmitted: { code: 'N/A', description: 'Counseling documented but measure not submitted', raf: null },
    proposed: { code: 'Quality 226', description: 'Screening and cessation counseling documented in encounter', raf: null },
  },
  {
    summary: 'Preventive visit included fall risk screening for patient 65+, measure not reported',
    title: 'Quality 318 — falls: screening for future fall risk',
    asSubmitted: { code: 'N/A', description: 'Fall risk screening performed but not reported', raf: null },
    proposed: { code: 'Quality 318', description: 'Fall risk screening documented during preventive visit', raf: null },
  },
  {
    summary: 'Colorectal cancer screening completed and documented, quality measure not submitted',
    title: 'Quality 113 — colorectal cancer screening',
    asSubmitted: { code: 'N/A', description: 'Screening completed but quality measure not submitted', raf: null },
    proposed: { code: 'Quality 113', description: 'Colorectal cancer screening completed within interval', raf: null },
  },
  {
    summary: 'Medication reconciliation completed post-discharge, transitional care measure not reported',
    title: 'Quality 046 — medication reconciliation post-discharge',
    asSubmitted: { code: 'N/A', description: 'Reconciliation completed but not reported this period', raf: null },
    proposed: { code: 'Quality 046', description: 'Medication reconciliation documented within required window', raf: null },
  },
  {
    summary: 'Advance care plan documented in encounter note, measure not submitted for reporting period',
    title: 'Quality 047 — advance care plan',
    asSubmitted: { code: 'N/A', description: 'Advance care plan documented but not submitted', raf: null },
    proposed: { code: 'Quality 047', description: 'Advance care plan discussion documented in the encounter note', raf: null },
  },
  {
    summary: 'Statin therapy prescribed for eligible cardiovascular patient, measure not reported',
    title: 'Quality 438 — statin therapy for cardiovascular disease prevention',
    asSubmitted: { code: 'N/A', description: 'Statin therapy prescribed but measure not reported', raf: null },
    proposed: { code: 'Quality 438', description: 'Statin therapy prescribed per eligible diagnosis criteria', raf: null },
  },
  {
    summary: 'Pneumococcal vaccination documented for eligible patient, measure not submitted',
    title: 'Quality 111 — pneumococcal vaccination status for older adults',
    asSubmitted: { code: 'N/A', description: 'Vaccination administered but measure not submitted', raf: null },
    proposed: { code: 'Quality 111', description: 'Pneumococcal vaccination documented in immunization record', raf: null },
  },
];

function buildNarrative(programName, item, dates) {
  if (programName === 'HCC') {
    const submittedText = item.asSubmitted.code === 'N/A'
      ? 'no qualifying diagnosis code'
      : `${item.asSubmitted.code} — ${item.asSubmitted.description}`;
    return `The ${dates.encounterDate} progress note documents ${item.proposed.description.toLowerCase()}, corroborated by a lab result on ${dates.labDate}. The claim submitted for that encounter carried ${submittedText}, which does not capture this condition. Recoding to ${item.proposed.code} maps the encounter to an HCC category that has not been recaptured this plan year.`;
  }
  return `The ${dates.encounterDate} encounter documents criteria matching ${item.title}. Chart review confirms ${item.proposed.description.toLowerCase()}, but no corresponding measure was found on file for the current reporting period ending ${dates.submitByDate}.`;
}

function buildChecklist(programName, item, dates) {
  if (programName === 'HCC') {
    return [
      { criterion: 'Active diagnosis documented in the encounter year', evidenceFound: `"${item.proposed.description}" — assessment & plan`, sourceLabel: `NOTE ${dates.encounterDate}` },
      { criterion: 'Diagnosis supported by objective clinical evidence', evidenceFound: 'Lab/vitals result corroborates the documented condition', sourceLabel: `LAB ${dates.labDate}` },
      { criterion: 'Causal link between conditions stated by the provider', evidenceFound: 'Provider attestation present in the assessment & plan', sourceLabel: `NOTE ${dates.encounterDate}` },
      { criterion: 'No qualifying HCC code submitted on record for plan year 2026', evidenceFound: 'Claims reviewed; none carry a qualifying diagnosis code', sourceLabel: 'CLAIMS 2026' },
    ];
  }
  return [
    { criterion: 'Numerator criteria documented in the encounter', evidenceFound: `"${item.proposed.description}"`, sourceLabel: `NOTE ${dates.encounterDate}` },
    { criterion: 'Patient meets denominator/eligibility criteria for the measure', evidenceFound: 'Age, diagnosis, and encounter-type criteria confirmed', sourceLabel: `NOTE ${dates.encounterDate}` },
    { criterion: 'Supporting documentation present in the chart', evidenceFound: 'Structured field and narrative note both confirm the finding', sourceLabel: `NOTE ${dates.encounterDate}` },
    { criterion: 'Measure not found on submitted quality data for the reporting period', evidenceFound: 'No matching measure on file for the current performance period', sourceLabel: 'SUBMISSION 2026' },
  ];
}

async function seed() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Idempotent re-seed: wipe and restart identities so re-running this
    // script during development doesn't pile up duplicate rows.
    await client.query(
      'TRUNCATE TABLE review_log, internal_notes, audit_events, criteria_checklist, recovery_summary, rule_set_changes, rule_reviews, rule_versions, flagged_items, rules, programs RESTART IDENTITY CASCADE'
    );

    const { rows: programs } = await client.query(
      `
      INSERT INTO programs
        (name, full_name, description, rules_version, last_updated, status,
         min_estimated_value, encounter_lookback_months, detection_run_schedule,
         require_coder_review, reflag_on_amendment, email_digest_enabled)
      VALUES
        ('MIPS', 'MIPS quality & interoperability',
         'Merit-based Incentive Payment System — CMS quality reporting program affecting Medicare Part B reimbursement.',
         '2026.2', now(), 'active', 25, 24, 'Nightly, 06:00', true, true, false),
        ('HCC', 'HCC risk adjustment',
         'Hierarchical Condition Category coding — risk-adjustment model affecting Medicare Advantage/ACO payment accuracy.',
         '2026.1', now(), 'active', 25, 24, 'Nightly, 06:00', true, true, false)
      RETURNING id, name
      `
    );
    const programByName = Object.fromEntries(programs.map((p) => [p.name, p.id]));

    await client.query(
      `
      INSERT INTO rule_set_changes (program_id, version, change_date, description)
      VALUES
        ($1, '2026.2', '2026-08-04', 'Quality 236 numerator now accepts a home blood pressure reading recorded by the patient.'),
        ($1, '2026.1', '2026-02-12', 'Promoting Interoperability measure set updated to 2026 performance period requirements.'),
        ($2, '2026.1', '2026-07-01', 'Migrated to the CMS V28 model. 41 conditions reweighted; 6 removed from the model.'),
        ($2, '2025.4', '2025-11-03', 'Chronic kidney disease staging codes remapped ahead of the V28 transition.')
      `,
      [programByName.MIPS, programByName.HCC]
    );

    const ruleByProgram = {};
    for (const [programName, programId] of Object.entries(programByName)) {
      const def = RULE_DEFS[programName];

      const { rows: ruleRows } = await client.query(
        `
        INSERT INTO rules (program_id, name, description, sql_query, version, status, created_by, updated_at)
        VALUES ($1, $2, $3, $4, 1, 'active', $5, now())
        RETURNING id
        `,
        [programId, def.name, def.description, def.sqlQuery, RULE_AUTHOR]
      );
      const ruleId = ruleRows[0].id;
      ruleByProgram[programName] = ruleId;

      await client.query(
        `
        INSERT INTO rule_versions (rule_id, version, sql_query, change_notes, finalized_by)
        VALUES ($1, 1, $2, 'Initial version, reviewed and approved.', $3)
        `,
        [ruleId, def.sqlQuery, RULE_APPROVER]
      );

      await client.query(
        `
        INSERT INTO rule_reviews (rule_id, reviewer, action, notes)
        VALUES ($1, $2, 'approved', 'Query reviewed against sample data; approved for production use.')
        `,
        [ruleId, RULE_APPROVER]
      );
    }

    const today = new Date();

    // Build 10 items per program, cycling status independently within each
    // program's own local index. (Deriving status from the same running
    // counter used to alternate programs would make each program collide
    // with only half of STATUSES — e.g. HCC always landing on 'reviewed'/
    // 'rejected' and MIPS always on 'new'/'submitted' — since 2 and 4 share
    // a common factor.)
    const flaggedItems = [];
    let refCounter = 1;
    for (const [programName, itemDefs] of [['MIPS', MIPS_ITEMS], ['HCC', HCC_ITEMS]]) {
      for (let localIdx = 0; localIdx < itemDefs.length; localIdx += 1) {
        const def = itemDefs[localIdx];
        const status = STATUSES[localIdx % STATUSES.length];

        const flaggedDaysAgo = randomInt(1, 42);
        const createdAt = addDays(today, -flaggedDaysAgo);
        const encounterDate = addDays(createdAt, -randomInt(5, 60));
        const labDate = addDays(encounterDate, -randomInt(7, 45));
        const submitByDate = addDays(createdAt, randomInt(25, 75));
        const dates = {
          encounterDate: isoDate(encounterDate),
          labDate: isoDate(labDate),
          submitByDate: isoDate(submitByDate),
        };

        flaggedItems.push({
          patientRef: `SYN-${String(refCounter).padStart(4, '0')}`,
          programId: programByName[programName],
          programName,
          title: def.title,
          criteriaMatched: def.summary,
          estimatedDollarValue: randomDollarValue(),
          status,
          createdAt,
          submittedAt: status === 'submitted' ? addDays(createdAt, randomInt(1, 5)) : null,
          encounterDate,
          provider: PROVIDERS[refCounter % PROVIDERS.length],
          claimNumber: String(90000000 + randomInt(0, 9999999)),
          submitByDate,
          assignee: ASSIGNEE_CYCLE[localIdx % ASSIGNEE_CYCLE.length],
          ruleSetVersion: programName === 'MIPS' ? '2026.2' : '2026.1',
          ruleId: ruleByProgram[programName],
          ruleVersion: 1,
          narrative: buildNarrative(programName, def, dates),
          sources: JSON.stringify([
            { label: 'Progress note', date: dates.encounterDate },
            { label: 'Lab panel', date: dates.labDate },
            { label: `Claim ${90000000 + randomInt(0, 9999999)}`, date: null },
          ]),
          rafDelta: def.proposed.raf,
          planBenchmarkAnnual: randomDollarValue(6000, 15000),
          monthsRemainingInYear: 12 - createdAt.getMonth(),
          contractSharePct: randomInt(15, 65) + Math.round(Math.random() * 10) / 10,
          asSubmittedCode: def.asSubmitted.code,
          asSubmittedDescription: def.asSubmitted.description,
          asSubmittedRaf: def.asSubmitted.raf,
          proposedCode: def.proposed.code,
          proposedDescription: def.proposed.description,
          proposedRaf: def.proposed.raf,
          checklist: buildChecklist(programName, def, dates),
        });
        refCounter += 1;
      }
    }

    const insertedItems = [];
    for (const item of flaggedItems) {
      const { rows } = await client.query(
        `
        INSERT INTO flagged_items (
          patient_ref, program_id, title, criteria_matched, estimated_dollar_value, status,
          created_at, submitted_at, encounter_date, provider, claim_number, submit_by_date,
          assignee, rule_set_version, narrative, sources, raf_delta, plan_benchmark_annual,
          months_remaining_in_year, contract_share_pct, as_submitted_code, as_submitted_description,
          as_submitted_raf, proposed_code, proposed_description, proposed_raf, rule_id, rule_version
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,
          $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28
        )
        RETURNING id, program_id, program_id AS "programId", estimated_dollar_value, status
        `,
        [
          item.patientRef, item.programId, item.title, item.criteriaMatched, item.estimatedDollarValue, item.status,
          item.createdAt, item.submittedAt, item.encounterDate, item.provider, item.claimNumber, item.submitByDate,
          item.assignee, item.ruleSetVersion, item.narrative, item.sources, item.rafDelta, item.planBenchmarkAnnual,
          item.monthsRemainingInYear, item.contractSharePct, item.asSubmittedCode, item.asSubmittedDescription,
          item.asSubmittedRaf, item.proposedCode, item.proposedDescription, item.proposedRaf,
          item.ruleId, item.ruleVersion,
        ]
      );
      insertedItems.push({ ...rows[0], programName: item.programName, assignee: item.assignee, checklist: item.checklist, createdAt: item.createdAt });
    }

    for (const item of insertedItems) {
      let sortOrder = 0;
      for (const row of item.checklist) {
        await client.query(
          `
          INSERT INTO criteria_checklist (flagged_item_id, criterion, evidence_found, source_label, met, sort_order)
          VALUES ($1, $2, $3, $4, true, $5)
          `,
          [item.id, row.criterion, row.evidenceFound, row.sourceLabel, sortOrder]
        );
        sortOrder += 1;
      }

      await client.query(
        `
        INSERT INTO audit_events (flagged_item_id, event_type, description, actor, occurred_at)
        VALUES ($1, 'detected', 'Flag surfaced by detection run', $2, $3)
        `,
        [item.id, `${item.programName} v${item.programName === 'MIPS' ? '2026.2' : '2026.1'}`, item.createdAt]
      );

      if (item.assignee) {
        await client.query(
          `
          INSERT INTO audit_events (flagged_item_id, event_type, description, actor, occurred_at)
          VALUES ($1, 'assigned', $2, $3, $4)
          `,
          [item.id, `Assigned to ${item.assignee}`, ADMIN_ACTOR, addDays(item.createdAt, 0)]
        );
      }
    }

    // A note on roughly half the assigned items so the "Internal notes"
    // thread has real content to render.
    let noteToggle = 0;
    for (const item of insertedItems) {
      if (!item.assignee) continue;
      noteToggle += 1;
      if (noteToggle % 2 !== 0) continue;

      await client.query(
        `
        INSERT INTO internal_notes (flagged_item_id, author, note, created_at)
        VALUES ($1, $2, $3, $4)
        `,
        [
          item.id,
          item.assignee,
          'Documentation supports the criteria above; confirmed with the provider that no addendum is needed before submission.',
          addDays(item.createdAt, 1),
        ]
      );
    }

    let reviewerIdx = 0;
    for (const item of insertedItems) {
      const reviewer = item.assignee || ADMIN_ACTOR;
      reviewerIdx += 1;
      let reviewInfo = null;
      if (item.status === 'reviewed') {
        reviewInfo = { action: 'reviewed', notes: 'Confirmed criteria match against chart documentation; recommend submission.' };
      } else if (item.status === 'submitted') {
        reviewInfo = { action: 'submitted', notes: 'Reviewed and submitted for program credit this period.' };
      } else if (item.status === 'rejected') {
        reviewInfo = { action: 'rejected', notes: 'Reason: Insufficient documentation. Documentation did not fully support criteria after manual check.' };
      }
      if (!reviewInfo) continue;

      await client.query(
        `
        INSERT INTO review_log (flagged_item_id, reviewer, action, notes, timestamp)
        VALUES ($1, $2, $3, $4, $5)
        `,
        [item.id, reviewer, reviewInfo.action, reviewInfo.notes, addDays(item.createdAt, randomInt(1, 6))]
      );
    }

    // 12 trailing months of independently-rolled-up recovery figures per
    // program, used for the Overview page's trend chart. Treated as its own
    // reporting rollup rather than a live derivation of flagged_items —
    // mirrors how a real recovery rollup would be fed once Clarity/claims
    // data is wired in. The most recent (current) month is deliberately
    // smaller, representing a month still in progress.
    const monthCount = 12;
    const programTrend = { MIPS: { base: 6000, growth: 1.07 }, HCC: { base: 9500, growth: 1.09 } };
    for (const [programName, programId] of Object.entries(programByName)) {
      const { base, growth } = programTrend[programName];
      for (let m = monthCount - 1; m >= 0; m -= 1) {
        const monthDate = new Date(today.getFullYear(), today.getMonth() - m, 1);
        const isCurrentMonth = m === 0;
        const trendValue = base * growth ** (monthCount - 1 - m);
        const noise = 0.85 + Math.random() * 0.3;
        const totalRecovered = isCurrentMonth
          ? Math.round(trendValue * (0.3 + Math.random() * 0.25) * 100) / 100
          : Math.round(trendValue * noise * 100) / 100;
        const totalFlagged = randomInt(4, 22);
        const totalReviewed = randomInt(2, totalFlagged);

        await client.query(
          `
          INSERT INTO recovery_summary (program_id, period, total_recovered, total_flagged, total_reviewed)
          VALUES ($1, $2, $3, $4, $5)
          `,
          [programId, monthLabel(monthDate), totalRecovered, totalFlagged, totalReviewed]
        );
      }
    }

    await client.query('COMMIT');
    console.log(`Seeded ${programs.length} programs, ${Object.keys(ruleByProgram).length} rules (active, v1), ${insertedItems.length} flagged items, and ${monthCount * programs.length} monthly recovery summary rows.`);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
