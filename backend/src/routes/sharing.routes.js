const express = require('express');
const { shareNote, getShares, revokeAccess } = require('../controllers/sharing.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');
const { shareNoteSchema } = require('../utils/validationSchemas');
const { apiLimiter } = require('../middleware/rateLimiter.middleware');

const router = express.Router();

router.use(apiLimiter);
router.use(authenticate);

// Typically nested under /api/notes/:noteId/shares but mounted at /api/sharing here.
// But we'll mount it at /api/notes/:noteId/share via the main index or explicitly here.
// For clean API: POST /api/notes/:noteId/share

router.post('/:noteId/share', validate(shareNoteSchema), shareNote);
router.get('/:noteId/shares', getShares);
router.delete('/:noteId/share/:recipientUserId', revokeAccess);
router.delete('/:noteId/shares/:recipientUserId', revokeAccess);
router.delete('/:noteId/access/:recipientUserId', revokeAccess);
router.post('/:noteId/revoke', revokeAccess);

module.exports = router;
