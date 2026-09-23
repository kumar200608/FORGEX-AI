const prisma = require('../prisma');
const { sendSuccess, sendError } = require('../utils/response.util');
const { auditLog } = require('../utils/auditLogger');
const { encryptNote, decryptNote } = require('../utils/crypto.util');

const createNote = async (req, res) => {
  try {
    let { ciphertext, iv, authTag, encryptedNoteKey, title, content, isPinned, tags } = req.body;
    const userId = req.user.id;

    // Encrypt for database storage
    if (title !== undefined || content !== undefined || !ciphertext || !iv) {
      const encrypted = encryptNote({
        title: title || 'Untitled Note',
        content: content || '',
        isPinned: !!isPinned,
        tags: tags || []
      });
      ciphertext = encrypted.ciphertext;
      iv = encrypted.iv;
      authTag = encrypted.authTag;
      encryptedNoteKey = encrypted.encryptedNoteKey;
    } else if (!authTag) {
      // Re-encrypt plaintext ciphertext if passed as raw text
      const encrypted = encryptNote(ciphertext);
      ciphertext = encrypted.ciphertext;
      iv = encrypted.iv;
      authTag = encrypted.authTag;
      encryptedNoteKey = encryptedNoteKey || encrypted.encryptedNoteKey;
    }

    const note = await prisma.note.create({
      data: {
        ownerId: userId,
        ciphertext,
        iv,
        authTag,
        accesses: {
          create: {
            userId,
            role: 'owner'
          }
        },
        envelopes: {
          create: {
            userId,
            encryptedNoteKey: encryptedNoteKey || 'default-note-key'
          }
        }
      },
      include: {
        owner: {
          select: { id: true, name: true, email: true }
        },
        accesses: true,
        envelopes: true
      }
    });

    await auditLog({ userId, action: 'NOTE_CREATED', noteId: note.id });

    // Decrypt so web app displays readable title and content
    const decrypted = decryptNote(note.ciphertext, note.iv, note.authTag);

    return sendSuccess(res, {
      ...note,
      title: decrypted.title,
      content: decrypted.content,
      isPinned: decrypted.isPinned,
      tags: decrypted.tags,
      wordCount: decrypted.wordCount,
      myRole: 'owner',
      isOwner: true
    }, 201);
  } catch (error) {
    console.error('Failed to create note:', error);
    return sendError(res, 'Failed to create note', 500);
  }
};

const getNotes = async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch notes where user is owner OR has an active NoteAccess
    const notes = await prisma.note.findMany({
      where: {
        accesses: {
          some: {
            userId: userId,
            revokedAt: null
          }
        }
      },
      include: {
        owner: {
          select: { id: true, name: true, email: true }
        },
        envelopes: {
          where: {
            userId: userId,
            revokedAt: null
          }
        },
        accesses: {
          where: {
            revokedAt: null
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    // Decrypt each note so the web app displays readable title and content
    const decryptedNotes = notes.map(note => {
      const decrypted = decryptNote(note.ciphertext, note.iv, note.authTag);
      const isOwner = note.ownerId === userId;
      const userAccess = note.accesses.find(a => a.userId === userId);
      const rawRole = userAccess?.role || (isOwner ? 'owner' : 'viewer');
      const myRole = isOwner ? 'owner' : ((rawRole === 'editor' || rawRole === 'edit') ? 'edit' : 'view');

      return {
        ...note,
        title: decrypted.title,
        content: decrypted.content,
        isPinned: decrypted.isPinned,
        tags: decrypted.tags,
        wordCount: decrypted.wordCount,
        myRole,
        isOwner,
        owner: note.owner
      };
    });

    return sendSuccess(res, decryptedNotes);
  } catch (error) {
    console.error('Failed to retrieve notes:', error);
    return sendError(res, 'Failed to retrieve notes', 500);
  }
};

const getSharedNotes = async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch notes shared with current user (active access, owner is someone else)
    const accesses = await prisma.noteAccess.findMany({
      where: {
        userId,
        revokedAt: null,
        note: {
          ownerId: { not: userId }
        }
      },
      include: {
        note: {
          include: {
            owner: {
              select: { id: true, name: true, email: true }
            },
            accesses: {
              where: { revokedAt: null }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const results = accesses.map(access => {
      const note = access.note;
      const decrypted = decryptNote(note.ciphertext, note.iv, note.authTag);
      const permission = (access.role === 'editor' || access.role === 'edit') ? 'edit' : 'view';

      return {
        permission,
        sharedAt: access.createdAt.toISOString(),
        sharedBy: {
          id: note.owner.id,
          name: note.owner.name || note.owner.email.split('@')[0],
          email: note.owner.email
        },
        note: {
          id: note.id,
          title: decrypted.title,
          content: decrypted.content,
          ownerId: note.ownerId,
          createdAt: note.createdAt.toISOString(),
          updatedAt: note.updatedAt.toISOString(),
          isShared: true,
          isPinned: !!decrypted.isPinned,
          tags: decrypted.tags || [],
          securityStatus: 'encrypted',
          wordCount: decrypted.wordCount,
          myRole: permission,
          isOwner: false,
          owner: note.owner
        }
      };
    });

    return sendSuccess(res, results);
  } catch (error) {
    console.error('Failed to retrieve shared notes:', error);
    return sendError(res, 'Failed to retrieve shared notes', 500);
  }
};

const getNote = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const access = await prisma.noteAccess.findFirst({
      where: {
        noteId: id,
        userId: userId,
        revokedAt: null
      }
    });

    if (!access) {
      return sendError(res, 'Not found or unauthorized', 404);
    }

    const note = await prisma.note.findUnique({
      where: { id },
      include: {
        owner: {
          select: { id: true, name: true, email: true }
        },
        accesses: {
          where: { revokedAt: null }
        },
        envelopes: {
          where: {
            userId: userId,
            revokedAt: null
          }
        }
      }
    });

    if (!note) {
      return sendError(res, 'Note not found', 404);
    }

    const decrypted = decryptNote(note.ciphertext, note.iv, note.authTag);
    const isOwner = note.ownerId === userId;
    const myRole = isOwner ? 'owner' : ((access.role === 'editor' || access.role === 'edit') ? 'edit' : 'view');

    return sendSuccess(res, {
      ...note,
      title: decrypted.title,
      content: decrypted.content,
      isPinned: decrypted.isPinned,
      tags: decrypted.tags,
      wordCount: decrypted.wordCount,
      myRole,
      isOwner,
      owner: note.owner
    });
  } catch (error) {
    console.error('Failed to retrieve note:', error);
    return sendError(res, 'Failed to retrieve note', 500);
  }
};

const updateNote = async (req, res) => {
  try {
    const { id } = req.params;
    let { ciphertext, iv, authTag, title, content, isPinned, tags } = req.body;
    const userId = req.user.id;

    const access = await prisma.noteAccess.findFirst({
      where: {
        noteId: id,
        userId: userId,
        revokedAt: null
      }
    });

    if (!access) {
      return sendError(res, 'Not found or unauthorized', 404);
    }

    // Enforce view vs edit permissions!
    if (access.role !== 'owner' && access.role !== 'editor' && access.role !== 'edit') {
      return sendError(res, 'Forbidden: You only have view permission for this note', 403);
    }

    const currentNote = await prisma.note.findUnique({
      where: { id },
      include: {
        owner: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    if (!currentNote) {
      return sendError(res, 'Note not found', 404);
    }

    // Encrypt plain title/content into ciphertext for database storage
    if (title !== undefined || content !== undefined || isPinned !== undefined || tags !== undefined) {
      const currentDecrypted = decryptNote(currentNote.ciphertext, currentNote.iv, currentNote.authTag);
      const updatedPayload = {
        title: title !== undefined ? title : currentDecrypted.title,
        content: content !== undefined ? content : currentDecrypted.content,
        isPinned: isPinned !== undefined ? isPinned : currentDecrypted.isPinned,
        tags: tags !== undefined ? tags : currentDecrypted.tags
      };
      const encrypted = encryptNote(updatedPayload);
      ciphertext = encrypted.ciphertext;
      iv = encrypted.iv;
      authTag = encrypted.authTag;
    }

    const updatedNote = await prisma.note.update({
      where: { id },
      data: {
        ...(ciphertext && { ciphertext }),
        ...(iv && { iv }),
        ...(authTag && { authTag })
      },
      include: {
        owner: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    await auditLog({ userId, action: 'NOTE_UPDATED', noteId: id });

    const decrypted = decryptNote(updatedNote.ciphertext, updatedNote.iv, updatedNote.authTag);
    const isOwner = currentNote.ownerId === userId;
    const myRole = isOwner ? 'owner' : 'edit';

    return sendSuccess(res, {
      ...updatedNote,
      title: decrypted.title,
      content: decrypted.content,
      isPinned: decrypted.isPinned,
      tags: decrypted.tags,
      wordCount: decrypted.wordCount,
      myRole,
      isOwner,
      owner: updatedNote.owner
    });
  } catch (error) {
    console.error('Failed to update note:', error);
    return sendError(res, 'Failed to update note', 500);
  }
};

const deleteNote = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const note = await prisma.note.findUnique({ where: { id } });

    if (!note) {
      return sendError(res, 'Note not found', 404);
    }

    if (note.ownerId !== userId) {
      return sendError(res, 'Forbidden: Only the note owner can delete this note', 403);
    }

    await prisma.note.delete({ where: { id } });

    await auditLog({ userId, action: 'NOTE_DELETED', noteId: id });

    return sendSuccess(res, { message: 'Note deleted successfully' });
  } catch (error) {
    console.error('Failed to delete note:', error);
    return sendError(res, 'Failed to delete note', 500);
  }
};

const rotateKey = async (req, res) => {
  try {
    const { id } = req.params;
    const { ciphertext, iv, authTag, encryptedNoteKey, sharedEnvelopes } = req.body;
    const userId = req.user.id;

    // Only owner can rotate key
    const note = await prisma.note.findUnique({ where: { id } });
    if (!note) {
      return sendError(res, 'Note not found', 404);
    }
    if (note.ownerId !== userId) {
      return sendError(res, 'Forbidden: Only the note owner can rotate keys', 403);
    }

    // Wrap in transaction
    const updatedNote = await prisma.$transaction(async (tx) => {
      // 1. Update note ciphertext/IV and bump version
      const n = await tx.note.update({
        where: { id },
        data: {
          ciphertext,
          iv,
          authTag,
          encryptionKeyVersion: { increment: 1 },
          keyRotatedAt: new Date()
        }
      });

      // 2. Mark old envelopes as revoked for this note
      await tx.keyEnvelope.updateMany({
        where: { noteId: id, revokedAt: null },
        data: { revokedAt: new Date() }
      });

      // 3. Create new owner envelope
      await tx.keyEnvelope.create({
        data: {
          noteId: id,
          userId,
          encryptedNoteKey
        }
      });

      // 4. Create new envelopes for active shares if provided
      if (sharedEnvelopes && sharedEnvelopes.length > 0) {
        const activeAccesses = await tx.noteAccess.findMany({
          where: { noteId: id, revokedAt: null }
        });
        
        const activeUserIds = new Set(activeAccesses.map(a => a.userId));
        const validEnvelopes = sharedEnvelopes.filter(env => activeUserIds.has(env.userId));
        
        if (validEnvelopes.length > 0) {
          await tx.keyEnvelope.createMany({
            data: validEnvelopes.map(env => ({
              noteId: id,
              userId: env.userId,
              encryptedNoteKey: env.encryptedNoteKey
            }))
          });
        }
      }

      return n;
    });

    await auditLog({ userId, action: 'KEY_ROTATED', noteId: id });

    return sendSuccess(res, updatedNote);
  } catch (error) {
    console.error('Failed to rotate key:', error);
    return sendError(res, 'Failed to rotate key', 500);
  }
};

module.exports = { createNote, getNotes, getSharedNotes, getNote, updateNote, deleteNote, rotateKey };
