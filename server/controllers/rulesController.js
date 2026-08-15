const Rule = require('../models/rule');
const RuleVersion = require('../models/ruleVersion');
const RuleReview = require('../models/ruleReview');
const { previewRule: runPreview } = require('../services/rulePreviewService');
const { isReadOnlyQuery } = require('../services/sqlValidationService');

const EDITABLE_STATUSES = ['draft', 'in_review'];
const REVIEW_ACTIONS = ['approved', 'requested_changes', 'rejected'];

async function listRules(req, res) {
  try {
    const { program_id: programId, status } = req.query;
    const rules = await Rule.getAll({ programId, status });
    res.json(rules);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch rules' });
  }
}

async function getRule(req, res) {
  try {
    const rule = await Rule.getById(req.params.id);
    if (!rule) return res.status(404).json({ error: 'Rule not found' });

    const [versions, reviews] = await Promise.all([
      RuleVersion.getByRuleId(rule.id),
      RuleReview.getByRuleId(rule.id),
    ]);

    res.json({ ...rule, versions, reviews });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch rule' });
  }
}

async function createRule(req, res) {
  try {
    const { programId, name, description, sqlQuery, createdBy } = req.body;
    if (!programId || !name || !sqlQuery) {
      return res.status(400).json({ error: 'programId, name, and sqlQuery are required' });
    }
    const rule = await Rule.create({ programId, name, description, sqlQuery, createdBy });
    res.status(201).json(rule);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create rule' });
  }
}

async function updateRule(req, res) {
  try {
    const rule = await Rule.getById(req.params.id);
    if (!rule) return res.status(404).json({ error: 'Rule not found' });

    if (!EDITABLE_STATUSES.includes(rule.status)) {
      return res.status(409).json({
        error: `This rule is '${rule.status}' and can no longer be edited. Only draft or in_review rules can be edited.`,
      });
    }

    const { name, description, sqlQuery } = req.body;
    const updated = await Rule.update(req.params.id, { name, description, sqlQuery });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update rule' });
  }
}

// Previews whatever SQL is passed in the body (the analyst's in-progress,
// possibly-unsaved edit), falling back to the rule's saved query. Never
// persists anything — see rulePreviewService.
async function previewRule(req, res) {
  try {
    const rule = await Rule.getById(req.params.id);
    if (!rule) return res.status(404).json({ error: 'Rule not found' });

    const sqlQuery = req.body.sqlQuery || rule.sql_query;
    const result = await runPreview(sqlQuery);
    res.json(result);
  } catch (err) {
    // A validation/query failure here is a 400 (bad input), not a server bug.
    res.status(400).json({ error: err.message });
  }
}

async function submitForReview(req, res) {
  try {
    const rule = await Rule.getById(req.params.id);
    if (!rule) return res.status(404).json({ error: 'Rule not found' });
    if (rule.status !== 'draft') {
      return res.status(409).json({ error: `Only draft rules can be submitted for review (current status: ${rule.status}).` });
    }

    // Not strictly required by the preview-only spec, but catching an unsafe
    // query here gives the analyst feedback before a reviewer ever looks at
    // it, rather than only at the final approval gate below.
    const validation = isReadOnlyQuery(rule.sql_query);
    if (!validation.ok) {
      return res.status(400).json({ error: `Cannot submit for review: ${validation.reason}` });
    }

    const updated = await Rule.setStatus(req.params.id, 'in_review');
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to submit rule for review' });
  }
}

// Records the review decision. On approval, this is the point of no return:
// the rule becomes 'active' and its query is what would run against real
// data — so this is also where we make the read-only check a hard gate, not
// just an early warning. A rule can never reach 'active' with a query that
// fails isReadOnlyQuery, no matter what happened earlier in its lifecycle.
async function reviewRule(req, res) {
  try {
    const { reviewer, action, notes } = req.body;
    if (!reviewer || !action) {
      return res.status(400).json({ error: 'reviewer and action are required' });
    }
    if (!REVIEW_ACTIONS.includes(action)) {
      return res.status(400).json({ error: `action must be one of: ${REVIEW_ACTIONS.join(', ')}` });
    }
    if (action !== 'approved' && !notes) {
      return res.status(400).json({ error: 'notes are required when requesting changes or rejecting' });
    }

    const rule = await Rule.getById(req.params.id);
    if (!rule) return res.status(404).json({ error: 'Rule not found' });
    if (rule.status !== 'in_review') {
      return res.status(409).json({ error: `Only rules that are in_review can be reviewed (current status: ${rule.status}).` });
    }

    if (action === 'approved') {
      const validation = isReadOnlyQuery(rule.sql_query);
      if (!validation.ok) {
        return res.status(400).json({ error: `Cannot approve: ${validation.reason}` });
      }
    }

    const review = await RuleReview.create({ ruleId: rule.id, reviewer, action, notes });

    let updatedRule;
    if (action === 'approved') {
      const nextVersion = rule.version + 1;
      await RuleVersion.create({
        ruleId: rule.id,
        version: nextVersion,
        sqlQuery: rule.sql_query,
        changeNotes: notes || 'Approved with no additional notes.',
        finalizedBy: reviewer,
      });
      updatedRule = await Rule.activateVersion(rule.id, nextVersion);
    } else {
      updatedRule = await Rule.setStatus(rule.id, 'draft');
    }

    res.status(201).json({ review, rule: updatedRule });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to record review' });
  }
}

async function archiveRule(req, res) {
  try {
    const rule = await Rule.getById(req.params.id);
    if (!rule) return res.status(404).json({ error: 'Rule not found' });
    const updated = await Rule.setStatus(req.params.id, 'archived');
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to archive rule' });
  }
}

module.exports = { listRules, getRule, createRule, updateRule, previewRule, submitForReview, reviewRule, archiveRule };
