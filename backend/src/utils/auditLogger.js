const prisma = require('../prisma');

const auditLog = async ({ userId, action, noteId = null, status = 'SUCCESS', metadata = {} }) => {
  try {
    // Fire and forget; don't await blocking the main request ideally,
    // but for simplicity in a serverless/hackathon setup, awaiting is fine.
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        noteId,
        status,
        metadata
      }
    });
  } catch (error) {
    console.error('Failed to write audit log:', error);
  }
};

module.exports = { auditLog };
