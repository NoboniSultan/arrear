const express = require('express');
const router = express.Router();
const controller = require('../controllers/reportController');

router.post('/generate/:flaggedItemId', controller.generateReport);

module.exports = router;
