const express = require('express');
const router = express.Router();
const controller = require('../controllers/rulesController');
const requireRole = require('../middleware/requireRole');

router.get('/', controller.listRules);
router.get('/:id', controller.getRule);
router.post('/', controller.createRule);
router.put('/:id', controller.updateRule);
router.post('/:id/preview', controller.previewRule);
router.post('/:id/submit-for-review', controller.submitForReview);
// Finalizing detection logic is owner-only — the request already passed
// requireAuth (mounted globally in server.js) by the time it gets here, so
// req.user is available for requireRole to check.
router.post('/:id/review', requireRole('owner'), controller.reviewRule);
router.post('/:id/archive', controller.archiveRule);

module.exports = router;
