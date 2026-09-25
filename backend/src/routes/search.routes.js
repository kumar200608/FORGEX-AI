const express = require('express');
const { searchNotes, addBlindIndex } = require('../controllers/search.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');
const { searchSchema } = require('../utils/validationSchemas');
const { apiLimiter } = require('../middleware/rateLimiter.middleware');

const router = express.Router();

router.use(apiLimiter);
router.use(authenticate);

// Search via POST since we might send tokens in body to avoid URL logging
router.post('/', validate(searchSchema), searchNotes);

// Endpoint to add index tokens to a specific note
router.post('/index/:noteId', validate(searchSchema), addBlindIndex);

module.exports = router;
