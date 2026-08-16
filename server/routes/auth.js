const express = require('express');
const router = express.Router();
const controller = require('../controllers/authController');
const loginRateLimiter = require('../middleware/loginRateLimiter');

// No registration route here, deliberately — accounts are created only via
// db/createUser.js.
router.post('/login', loginRateLimiter, controller.login);
router.post('/logout', controller.logout);
router.get('/me', controller.getCurrentUser);

module.exports = router;
