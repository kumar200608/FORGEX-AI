const prisma = require('../prisma');
const { sendSuccess, sendError } = require('../utils/response.util');

const searchNotes = async (req, res) => {
  try {
    const { blindIndex } = req.body;
    const userId = req.user.id;

    if (!blindIndex) {
      return sendError(res, 'Missing blindIndex', 400);
    }

    // Find all NoteIndices matching the blindIndex
    const indices = await prisma.noteIndex.findMany({
      where: { blindIndex },
      include: {
        note: {
          include: {
            accesses: {
              where: {
                userId,
                revokedAt: null
              }
            }
          }
        }
      }
    });

    // Filter to only notes the user has access to
    const accessibleNotes = indices
      .filter(index => index.note.accesses.length > 0)
      .map(index => ({
        id: index.note.id,
        ownerId: index.note.ownerId,
        ciphertext: index.note.ciphertext,
        iv: index.note.iv,
        authTag: index.note.authTag,
        createdAt: index.note.createdAt,
        updatedAt: index.note.updatedAt
      }));

    return sendSuccess(res, accessibleNotes);
  } catch (error) {
    console.error(error);
    return sendError(res, 'Search failed', 500);
  }
};

const addBlindIndex = async (req, res) => {
  try {
    const { noteId } = req.params;
    const { blindIndex } = req.body;
    const userId = req.user.id;

    // Check permissions (must be owner or editor)
    const access = await prisma.noteAccess.findFirst({
      where: {
        noteId,
        userId,
        revokedAt: null,
        role: { in: ['owner', 'editor'] }
      }
    });

    if (!access) {
      return sendError(res, 'Not found or unauthorized', 404);
    }

    if (!blindIndex) {
      return sendError(res, 'Missing blindIndex', 400);
    }

    const newIndex = await prisma.noteIndex.create({
      data: {
        noteId,
        blindIndex
      }
    });

    return sendSuccess(res, newIndex, 201);
  } catch (error) {
    console.error(error);
    return sendError(res, 'Failed to add index', 500);
  }
};

module.exports = { searchNotes, addBlindIndex };
