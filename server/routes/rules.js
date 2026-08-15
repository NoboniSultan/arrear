const express = require('express');
const router = express.Router();
const controller = require('../controllers/rulesController');

router.get('/', controller.listRules);
router.get('/:id', controller.getRule);
router.post('/', controller.createRule);
router.put('/:id', controller.updateRule);
router.post('/:id/preview', controller.previewRule);
router.post('/:id/submit-for-review', controller.submitForReview);
router.post('/:id/review', controller.reviewRule);
router.post('/:id/archive', controller.archiveRule);

module.exports = router;
