const FlaggedItem = require('../models/flaggedItem');
const ReviewLog = require('../models/reviewLog');
const InternalNote = require('../models/internalNote');

const VALID_STATUSES = ['new', 'reviewed', 'submitted', 'rejected'];

async function list(req, res) {
  try {
    const { program, status, assignee, minValue, days, deadlineDays, sort, order, page, pageSize } = req.query;
    const result = await FlaggedItem.getAll({ program, status, assignee, minValue, days, deadlineDays, sort, order, page, pageSize });
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch flagged items' });
  }
}

async function getOne(req, res) {
  try {
    const item = await FlaggedItem.getById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Flagged item not found' });
    res.json(item);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch flagged item' });
  }
}

// Human review step: records what a reviewer decided, and — if the action
// matches a valid status — advances the flagged item's status accordingly.
// This is the gate that must happen before anything is ever submitted.
// Actions that aren't a status (e.g. "needs_info") are still logged to the
// audit trail but leave the item's status untouched.
async function review(req, res) {
  try {
    const { id } = req.params;
    const { action, notes } = req.body;

    if (!action) {
      return res.status(400).json({ error: 'action is required' });
    }

    const item = await FlaggedItem.getById(id);
    if (!item) return res.status(404).json({ error: 'Flagged item not found' });

    // Attributed to the authenticated session, not a client-supplied name —
    // otherwise any caller could claim to be a different reviewer in the
    // audit trail.
    const log = await ReviewLog.create({ flaggedItemId: id, reviewer: req.user.full_name, action, notes });

    let updatedItem = item;
    if (VALID_STATUSES.includes(action)) {
      updatedItem = await FlaggedItem.updateStatus(id, action);
    }

    res.status(201).json({ log, item: updatedItem });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to record review' });
  }
}

async function addNote(req, res) {
  try {
    const { id } = req.params;
    const { note } = req.body;

    if (!note || !note.trim()) {
      return res.status(400).json({ error: 'note is required' });
    }

    const item = await FlaggedItem.getById(id);
    if (!item) return res.status(404).json({ error: 'Flagged item not found' });

    const created = await InternalNote.create({ flaggedItemId: id, author: req.user.full_name, note: note.trim() });
    res.status(201).json(created);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add note' });
  }
}

async function globalAuditLog(req, res) {
  try {
    const log = await FlaggedItem.getGlobalAuditLog();
    res.json(log);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch audit log' });
  }
}

module.exports = { list, getOne, review, addNote, globalAuditLog };
