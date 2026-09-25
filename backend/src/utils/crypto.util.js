const crypto = require('crypto');

const MASTER_SECRET = process.env.ENCRYPTION_KEY || process.env.JWT_SECRET || 'securenotes-encryption-secret-key-32';
const KEY = crypto.createHash('sha256').update(MASTER_SECRET).digest(); // 32 bytes for AES-256

/**
 * Encrypt note data with AES-256-GCM for database storage.
 * @param {Object|string} data 
 * @returns {{ ciphertext: string, iv: string, authTag: string, encryptedNoteKey: string }}
 */
function encryptNote(data) {
  const plaintext = typeof data === 'string' ? data : JSON.stringify(data);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', KEY, iv);
  
  let ciphertext = cipher.update(plaintext, 'utf8', 'base64');
  ciphertext += cipher.final('base64');
  const authTag = cipher.getAuthTag().toString('base64');
  const ivBase64 = iv.toString('base64');
  const encryptedNoteKey = crypto.randomBytes(32).toString('base64');

  return {
    ciphertext,
    iv: ivBase64,
    authTag,
    encryptedNoteKey
  };
}

/**
 * Decrypt note data from AES-256-GCM ciphertext stored in database.
 * @param {string} ciphertext 
 * @param {string} ivBase64 
 * @param {string} authTagBase64 
 * @returns {{ title: string, content: string, isPinned: boolean, tags: string[], wordCount: number }}
 */
function decryptNote(ciphertext, ivBase64, authTagBase64) {
  const fallback = {
    title: 'Untitled Note',
    content: '',
    isPinned: false,
    tags: [],
    wordCount: 0
  };

  if (!ciphertext) return fallback;

  // 1. If it was stored as raw JSON
  if (ciphertext.startsWith('{') && ciphertext.endsWith('}')) {
    try {
      const parsed = JSON.parse(ciphertext);
      return {
        title: parsed.title || 'Untitled Note',
        content: parsed.content || '',
        isPinned: !!parsed.isPinned,
        tags: parsed.tags || [],
        wordCount: parsed.wordCount ?? 0
      };
    } catch {}
  }

  // 2. Try AES-256-GCM decryption with server key
  if (ivBase64) {
    try {
      const iv = Buffer.from(ivBase64, 'base64');
      const decipher = crypto.createDecipheriv('aes-256-gcm', KEY, iv);
      if (authTagBase64) {
        decipher.setAuthTag(Buffer.from(authTagBase64, 'base64'));
      }
      let dec = decipher.update(ciphertext, 'base64', 'utf8');
      dec += decipher.final('utf8');

      if (dec.startsWith('{') && dec.endsWith('}')) {
        const parsed = JSON.parse(dec);
        return {
          title: parsed.title || 'Untitled Note',
          content: parsed.content || '',
          isPinned: !!parsed.isPinned,
          tags: parsed.tags || [],
          wordCount: parsed.wordCount ?? 0
        };
      }

      return {
        title: 'Note',
        content: dec,
        isPinned: false,
        tags: [],
        wordCount: 0
      };
    } catch (err) {
      // Continue to next fallback
    }
  }

  // 3. Try base64 decoded string
  try {
    const raw = Buffer.from(ciphertext, 'base64').toString('utf8');
    if (raw.startsWith('{') && raw.endsWith('}')) {
      const parsed = JSON.parse(raw);
      return {
        title: parsed.title || 'Untitled Note',
        content: parsed.content || '',
        isPinned: !!parsed.isPinned,
        tags: parsed.tags || [],
        wordCount: parsed.wordCount ?? 0
      };
    }
    // If readable ASCII text
    if (/^[\x20-\x7E\s]+$/.test(raw)) {
      return {
        title: 'Note',
        content: raw,
        isPinned: false,
        tags: [],
        wordCount: 0
      };
    }
  } catch {}

  // 4. Raw text fallback
  return {
    title: 'Note',
    content: ciphertext,
    isPinned: false,
    tags: [],
    wordCount: 0
  };
}

module.exports = {
  encryptNote,
  decryptNote
};
