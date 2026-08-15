-- Arrear database schema
--
-- This backs Arrear's own application database. It is completely separate
-- from Epic Clarity (the read-only reporting database an Epic site runs),
-- which will eventually be queried on a schedule to populate flagged_items
-- instead of the synthetic data in db/seed.js.

CREATE TABLE IF NOT EXISTS programs (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,                 -- short code, e.g. "MIPS", "HCC" (used for filtering)
    full_name TEXT,                     -- descriptive name, e.g. "HCC risk adjustment"
    description TEXT,
    rules_version TEXT,
    last_updated TIMESTAMP,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused')),
    -- Detection settings shown on the Programs page. One row per program for
    -- now; would move to a dedicated settings table if programs need
    -- multiple detection profiles later.
    min_estimated_value NUMERIC(10, 2) NOT NULL DEFAULT 0,
    encounter_lookback_months INTEGER NOT NULL DEFAULT 24,
    detection_run_schedule TEXT NOT NULL DEFAULT 'Nightly, 06:00',
    require_coder_review BOOLEAN NOT NULL DEFAULT true,
    reflag_on_amendment BOOLEAN NOT NULL DEFAULT true,
    email_digest_enabled BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS rule_set_changes (
    id SERIAL PRIMARY KEY,
    program_id INTEGER NOT NULL REFERENCES programs(id),
    version TEXT NOT NULL,
    change_date DATE NOT NULL,
    description TEXT NOT NULL
);

-- The actual detection logic behind each program. A rule's sql_query is a
-- draft/working copy — the reviewed, finalized copy that actually ran for a
-- given version lives in rule_versions below and is never edited after the
-- fact. No rule's query may run against real data (preview or otherwise)
-- without first passing sqlValidationService.isReadOnlyQuery — see
-- server/services/.
CREATE TABLE IF NOT EXISTS rules (
    id SERIAL PRIMARY KEY,
    program_id INTEGER NOT NULL REFERENCES programs(id),
    name TEXT NOT NULL,
    description TEXT,
    sql_query TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft', 'in_review', 'active', 'archived')),
    created_by TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now()
);

-- Permanent history — never edited after insert. This is the audit trail for
-- what SQL actually ran at each finalized version, and maps directly to the
-- "rule set changelog" already shown on the Programs page.
CREATE TABLE IF NOT EXISTS rule_versions (
    id SERIAL PRIMARY KEY,
    rule_id INTEGER NOT NULL REFERENCES rules(id),
    version INTEGER NOT NULL,
    sql_query TEXT NOT NULL,
    change_notes TEXT,
    finalized_by TEXT,
    finalized_at TIMESTAMP NOT NULL DEFAULT now()
);

-- The review workflow itself: one row per review action taken on a rule
-- (approve / request changes / reject), independent of the permanent
-- rule_versions snapshot that only gets written on approval.
CREATE TABLE IF NOT EXISTS rule_reviews (
    id SERIAL PRIMARY KEY,
    rule_id INTEGER NOT NULL REFERENCES rules(id),
    reviewer TEXT NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('approved', 'requested_changes', 'rejected')),
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT now()
);

-- EPIC CLARITY INTEGRATION POINT: rows here are currently inserted by
-- db/seed.js with fabricated data. Once connected, a scheduled job will
-- query Clarity reporting views for real quality-measure/HCC gaps and
-- insert rows here instead. patient_ref will need to be re-evaluated for
-- how it maps to a real (properly governed) patient identifier at that
-- point — it must never hold a real name or MRN in this synthetic phase.
CREATE TABLE IF NOT EXISTS flagged_items (
    id SERIAL PRIMARY KEY,
    patient_ref TEXT NOT NULL,
    program_id INTEGER NOT NULL REFERENCES programs(id),
    title TEXT,                         -- clinical finding headline, e.g. "E11.22 — type 2 diabetes..."
    criteria_matched TEXT,              -- one-line summary shown in table rows
    estimated_dollar_value NUMERIC(10, 2),
    status TEXT NOT NULL DEFAULT 'new'
        CHECK (status IN ('new', 'reviewed', 'submitted', 'rejected')),
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    submitted_at TIMESTAMP,             -- set when status transitions to 'submitted'

    -- Detail-page metadata
    encounter_date DATE,
    provider TEXT,                      -- fake attending name, not real PHI
    claim_number TEXT,
    submit_by_date DATE,
    assignee TEXT,                      -- fake reviewer name, null = unassigned
    rule_set_version TEXT,              -- snapshot of the program's rules_version at flag time
    requires_second_review BOOLEAN NOT NULL DEFAULT true,

    -- Which reviewed/finalized rule (and exact version of it) produced this
    -- flag. Nullable because existing synthetic rows predate the rules
    -- feature; new flags should always carry both.
    rule_id INTEGER REFERENCES rules(id),
    rule_version INTEGER,

    -- "Why this was flagged" narrative + value estimate breakdown
    narrative TEXT,
    sources JSONB,                      -- [{ "label": "Progress note", "date": "2026-06-14" }, ...]
    raf_delta NUMERIC(6, 3),
    plan_benchmark_annual NUMERIC(10, 2),
    months_remaining_in_year INTEGER,
    contract_share_pct NUMERIC(5, 2),

    -- "Proposed coding change" comparison box
    as_submitted_code TEXT,
    as_submitted_description TEXT,
    as_submitted_raf NUMERIC(6, 3),
    proposed_code TEXT,
    proposed_description TEXT,
    proposed_raf NUMERIC(6, 3)
);

-- Detailed multi-row checklist backing "Criteria that triggered the flag" on
-- the item detail page (criteria_matched above is just the table-row summary).
CREATE TABLE IF NOT EXISTS criteria_checklist (
    id SERIAL PRIMARY KEY,
    flagged_item_id INTEGER NOT NULL REFERENCES flagged_items(id),
    criterion TEXT NOT NULL,
    evidence_found TEXT,
    source_label TEXT,
    met BOOLEAN NOT NULL DEFAULT true,
    sort_order INTEGER NOT NULL DEFAULT 0
);

-- System-generated timeline events (detection, assignment). Merged with
-- review_log and internal_notes to build the "Audit trail" feed.
CREATE TABLE IF NOT EXISTS audit_events (
    id SERIAL PRIMARY KEY,
    flagged_item_id INTEGER NOT NULL REFERENCES flagged_items(id),
    event_type TEXT NOT NULL,
    description TEXT NOT NULL,
    actor TEXT,
    occurred_at TIMESTAMP NOT NULL DEFAULT now()
);

-- Free-form comment thread, explicitly never sent to the payer.
CREATE TABLE IF NOT EXISTS internal_notes (
    id SERIAL PRIMARY KEY,
    flagged_item_id INTEGER NOT NULL REFERENCES flagged_items(id),
    author TEXT NOT NULL,
    note TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS review_log (
    id SERIAL PRIMARY KEY,
    flagged_item_id INTEGER NOT NULL REFERENCES flagged_items(id),
    reviewer TEXT NOT NULL,
    action TEXT NOT NULL,
    notes TEXT,
    timestamp TIMESTAMP NOT NULL DEFAULT now()
);

-- Monthly rollup per program. `period` is 'YYYY-MM'. Seeded with 12 trailing
-- months to back the Overview page's trend chart and period-to-date figures;
-- treated as an independently-reconciled reporting table rather than a live
-- derivation of flagged_items (mirrors how a real recovery rollup would work
-- once fed from Clarity/claims data).
CREATE TABLE IF NOT EXISTS recovery_summary (
    id SERIAL PRIMARY KEY,
    program_id INTEGER NOT NULL REFERENCES programs(id),
    period TEXT NOT NULL,
    total_recovered NUMERIC(12, 2),
    total_flagged INTEGER,
    total_reviewed INTEGER
);

CREATE INDEX IF NOT EXISTS idx_flagged_items_program_id ON flagged_items(program_id);
CREATE INDEX IF NOT EXISTS idx_flagged_items_status ON flagged_items(status);
CREATE INDEX IF NOT EXISTS idx_flagged_items_rule_id ON flagged_items(rule_id);
CREATE INDEX IF NOT EXISTS idx_criteria_checklist_flagged_item_id ON criteria_checklist(flagged_item_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_flagged_item_id ON audit_events(flagged_item_id);
CREATE INDEX IF NOT EXISTS idx_internal_notes_flagged_item_id ON internal_notes(flagged_item_id);
CREATE INDEX IF NOT EXISTS idx_review_log_flagged_item_id ON review_log(flagged_item_id);
CREATE INDEX IF NOT EXISTS idx_rule_set_changes_program_id ON rule_set_changes(program_id);
CREATE INDEX IF NOT EXISTS idx_rules_program_id ON rules(program_id);
CREATE INDEX IF NOT EXISTS idx_rule_versions_rule_id ON rule_versions(rule_id);
CREATE INDEX IF NOT EXISTS idx_rule_reviews_rule_id ON rule_reviews(rule_id);
CREATE INDEX IF NOT EXISTS idx_recovery_summary_program_id ON recovery_summary(program_id);
