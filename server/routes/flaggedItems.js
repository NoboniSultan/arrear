const express = require('express');
const router = express.Router();
const controller = require('../controllers/flaggedItemsController');

// GET /api/flagged-items?program=MIPS&status=new,reviewed&assignee=M.+Reyes&minValue=0&days=45&sort=estimated_dollar_value&order=desc&page=1&pageSize=10
router.get('/', controller.list);
router.get('/:id', controller.getOne);
router.post('/:id/review', controller.review);
router.post('/:id/notes', controller.addNote);

module.exports = router;
