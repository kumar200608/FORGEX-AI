const { z } = require('zod');

// We use basic string schemas but tighten up lengths where appropriate.
// Ciphertexts, IVs, AuthTags, and encrypted keys should be non-empty strings.

const registerSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required').max(100),
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    publicKey: z.string().min(10, 'Public key is required')
  })
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required')
  })
});

const createNoteSchema = z.object({
  body: z.object({
    title: z.string().optional(),
    content: z.string().optional(),
    isPinned: z.boolean().optional(),
    tags: z.array(z.string()).optional(),
    ciphertext: z.string().optional(),
    iv: z.string().optional(),
    authTag: z.string().optional(),
    encryptedNoteKey: z.string().optional()
  }).refine(data => data.title !== undefined || data.content !== undefined || (data.ciphertext && data.iv), {
    message: 'Either note content (title/content) or encrypted payload (ciphertext/iv) must be provided'
  })
});

const updateNoteSchema = z.object({
  body: z.object({
    title: z.string().optional(),
    content: z.string().optional(),
    isPinned: z.boolean().optional(),
    tags: z.array(z.string()).optional(),
    ciphertext: z.string().optional(),
    iv: z.string().optional(),
    authTag: z.string().optional()
  }).refine(data => data.title !== undefined || data.content !== undefined || data.isPinned !== undefined || data.tags !== undefined || data.ciphertext || data.iv || data.authTag, {
    message: 'At least one field to update must be provided'
  })
});

const shareNoteSchema = z.object({
  body: z.object({
    recipientUserId: z.string().uuid('Invalid recipient user ID').optional(),
    email: z.string().email('Invalid email address').optional(),
    role: z.enum(['viewer', 'editor', 'view', 'edit']),
    encryptedNoteKey: z.string().optional()
  }).refine(data => data.recipientUserId !== undefined || data.email !== undefined, {
    message: 'Either recipientUserId or email must be provided'
  })
});

const rotateKeySchema = z.object({
  body: z.object({
    ciphertext: z.string().min(1, 'Ciphertext is required'),
    iv: z.string().min(1, 'IV is required'),
    authTag: z.string().optional(),
    encryptedNoteKey: z.string().min(1, 'New encrypted note key for owner is required'),
    sharedEnvelopes: z.array(z.object({
      userId: z.string().uuid(),
      encryptedNoteKey: z.string().min(1)
    })).optional()
  })
});

const searchSchema = z.object({
  body: z.object({
    blindIndex: z.string().min(1, 'Blind index is required')
  })
});

module.exports = {
  registerSchema,
  loginSchema,
  createNoteSchema,
  updateNoteSchema,
  shareNoteSchema,
  rotateKeySchema,
  searchSchema
};
