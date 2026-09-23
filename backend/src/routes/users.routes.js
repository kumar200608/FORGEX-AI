const express = require('express');
const { searchUsers } = require('../controllers/users.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { apiLimiter } = require('../middleware/rateLimiter.middleware');

const router = express.Router();

router.use(apiLimiter);
router.use(authenticate);

router.get('/search', searchUsers);

module.exports = router;
