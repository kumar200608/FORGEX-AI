const express = require('express');
const authRoutes = require('./auth.routes');
const notesRoutes = require('./notes.routes');
const searchRoutes = require('./search.routes');
const sharingRoutes = require('./sharing.routes');
const usersRoutes = require('./users.routes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/notes/search', searchRoutes);
// Mount sharing routes on /notes so they become /notes/:noteId/share
router.use('/notes', sharingRoutes);
router.use('/notes', notesRoutes);
router.use('/users', usersRoutes);

module.exports = router;
