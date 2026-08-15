const express = require('express');
const router = express.Router();
const controller = require('../controllers/programsController');

router.get('/', controller.list);
router.post('/', controller.create);
router.patch('/:id', controller.updateSettings);

module.exports = router;
