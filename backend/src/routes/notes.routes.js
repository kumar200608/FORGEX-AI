const express = require('express');
const { createNote, getNotes, getSharedNotes, getNote, updateNote, deleteNote, rotateKey } = require('../controllers/notes.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');
const { createNoteSchema, updateNoteSchema, rotateKeySchema } = require('../utils/validationSchemas');
const { apiLimiter } = require('../middleware/rateLimiter.middleware');

const router = express.Router();

router.use(apiLimiter);
router.use(authenticate);

router.post('/', validate(createNoteSchema), createNote);
router.get('/', getNotes);
router.get('/shared-with-me', getSharedNotes);
router.get('/:id', getNote);
router.put('/:id', validate(updateNoteSchema), updateNote);
router.delete('/:id', deleteNote);
router.post('/:id/rotate-key', validate(rotateKeySchema), rotateKey);

module.exports = router;
