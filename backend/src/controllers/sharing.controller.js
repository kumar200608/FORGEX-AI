const prisma = require('../prisma');
const { sendSuccess, sendError } = require('../utils/response.util');
const { auditLog } = require('../utils/auditLogger');

const shareNote = async (req, res) => {
  try {
    const { noteId } = req.params;
    const { recipientUserId, email, role, encryptedNoteKey } = req.body;
    const userId = req.user.id;

    if (!recipientUserId && !email) {
      return sendError(res, 'Recipient user ID or email is required', 400);
    }
    if (!role) {
      return sendError(res, 'Role/permission is required', 400);
    }

    // Check if current user is owner
    const note = await prisma.note.findUnique({ where: { id: noteId } });
    if (!note) {
      return sendError(res, 'Note not found', 404);
    }
    if (note.ownerId !== userId) {
      return sendError(res, 'Forbidden: Only the note owner can manage sharing', 403);
    }

    // Lookup recipient user
    let recipient = null;
    if (recipientUserId) {
      recipient = await prisma.user.findUnique({ where: { id: recipientUserId } });
    } else if (email) {
      recipient = await prisma.user.findFirst({
        where: { email: { equals: email.trim(), mode: 'insensitive' } }
      });
    }

    if (!recipient) {
      return sendError(res, 'Recipient user not found with that email', 404);
    }

    if (recipient.id === userId) {
      return sendError(res, 'You cannot share a note with yourself', 400);
    }

    const normalizedRole = (role === 'editor' || role === 'edit') ? 'editor' : 'viewer';

    // Upsert access
    const access = await prisma.noteAccess.upsert({
      where: {
        noteId_userId: {
          noteId,
          userId: recipient.id
        }
      },
      update: {
        role: normalizedRole,
        revokedAt: null
      },
      create: {
        noteId,
        userId: recipient.id,
        role: normalizedRole
      }
    });

    // Ensure an active key envelope exists for recipient
    let envelope = await prisma.keyEnvelope.findFirst({
      where: {
        noteId,
        userId: recipient.id,
        revokedAt: null
      }
    });

    if (!envelope) {
      const ownerEnvelope = await prisma.keyEnvelope.findFirst({
        where: { noteId, userId, revokedAt: null }
      });

      envelope = await prisma.keyEnvelope.create({
        data: {
          noteId,
          userId: recipient.id,
          encryptedNoteKey: encryptedNoteKey || ownerEnvelope?.encryptedNoteKey || 'shared-note-key'
        }
      });
    }

    await auditLog({
      userId,
      action: 'NOTE_SHARED',
      noteId,
      metadata: { recipientUserId: recipient.id, role: normalizedRole }
    });

    return sendSuccess(res, {
      id: recipient.id,
      name: recipient.name || recipient.email.split('@')[0],
      email: recipient.email,
      avatarInitials: (recipient.name || recipient.email.slice(0, 2)).slice(0, 2).toUpperCase(),
      permission: normalizedRole === 'editor' ? 'edit' : 'view',
      role: normalizedRole,
      sharedAt: access.createdAt.toISOString()
    }, 201);
  } catch (error) {
    console.error('Failed to share note:', error);
    return sendError(res, 'Failed to share note', 500);
  }
};

const getShares = async (req, res) => {
  try {
    const { noteId } = req.params;
    const userId = req.user.id;

    const note = await prisma.note.findUnique({ where: { id: noteId } });
    if (!note) {
      return sendError(res, 'Note not found', 404);
    }
    if (note.ownerId !== userId) {
      return sendError(res, 'Forbidden: Only the note owner can view sharing settings', 403);
    }

    const accesses = await prisma.noteAccess.findMany({
      where: {
        noteId,
        revokedAt: null,
        userId: { not: userId }
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, publicKey: true }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    const formatted = accesses.map((a) => ({
      id: a.user.id,
      name: a.user.name || a.user.email.split('@')[0],
      email: a.user.email,
      avatarInitials: (a.user.name || a.user.email.slice(0, 2)).slice(0, 2).toUpperCase(),
      permission: a.role === 'editor' || a.role === 'edit' ? 'edit' : 'view',
      role: a.role,
      sharedAt: a.createdAt.toISOString()
    }));

    return sendSuccess(res, formatted);
  } catch (error) {
    console.error('Failed to get shares:', error);
    return sendError(res, 'Failed to get shares', 500);
  }
};

const revokeAccess = async (req, res) => {
  try {
    const noteId = req.params.noteId || req.body.noteId;
    const recipientUserId = req.params.recipientUserId || req.params.userId || req.body.recipientUserId || req.body.userId;
    const userId = req.user.id;

    if (!recipientUserId) {
      return sendError(res, 'Recipient user ID is required to revoke access', 400);
    }

    const note = await prisma.note.findUnique({ where: { id: noteId } });
    if (!note) {
      return sendError(res, 'Note not found', 404);
    }
    if (note.ownerId !== userId) {
      return sendError(res, 'Forbidden: Only the note owner can revoke access', 403);
    }
    if (recipientUserId === userId) {
      return sendError(res, 'Cannot revoke owner access', 400);
    }

    // Mark access as revoked
    await prisma.noteAccess.updateMany({
      where: {
        noteId,
        userId: recipientUserId
      },
      data: {
        revokedAt: new Date()
      }
    });

    // Mark envelopes as revoked
    await prisma.keyEnvelope.updateMany({
      where: {
        noteId,
        userId: recipientUserId,
        revokedAt: null
      },
      data: {
        revokedAt: new Date()
      }
    });

    await auditLog({ userId, action: 'ACCESS_REVOKED', noteId, metadata: { recipientUserId } });

    return sendSuccess(res, { message: 'Access revoked successfully' });
  } catch (error) {
    console.error('Failed to revoke access:', error);
    return sendError(res, 'Failed to revoke access', 500);
  }
};

module.exports = { shareNote, getShares, revokeAccess };
