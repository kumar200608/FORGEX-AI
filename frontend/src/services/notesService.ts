import type { Note, SortOption } from '../types';
import { countWords } from '../lib/utils';
import { apiFetch } from './api';
import { decryptPayload } from './cryptoService';

interface BackendEnvelope {
  userId: string;
  encryptedNoteKey: string;
}

interface BackendAccess {
  userId: string;
  role: string;
}

interface BackendOwner {
  id: string;
  name?: string;
  email: string;
}

interface BackendNote {
  id: string;
  ownerId: string;
  ciphertext?: string;
  iv?: string;
  authTag?: string | null;
  encryptionKeyVersion?: number;
  createdAt: string;
  updatedAt: string;
  title?: string;
  content?: string;
  isPinned?: boolean;
  tags?: string[];
  wordCount?: number;
  envelopes?: BackendEnvelope[];
  accesses?: BackendAccess[];
  myRole?: 'owner' | 'edit' | 'view';
  isOwner?: boolean;
  owner?: BackendOwner;
}

function sortNotes(notes: Note[], sort: SortOption): Note[] {
  return [...notes].sort((a, b) => {
    if (sort === 'alphabetical') return a.title.localeCompare(b.title);
    if (sort === 'recently-created')
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
}

async function mapBackendNote(bn: BackendNote, currentUserId?: string): Promise<Note> {
  const isOwner = bn.isOwner !== undefined ? bn.isOwner : (currentUserId ? bn.ownerId === currentUserId : true);
  const isShared = (bn.accesses?.length || 0) > 1 || !isOwner;
  const myRole = bn.myRole || (isOwner ? 'owner' : 'view');

  // 1. If backend decrypted and provided plain text fields
  if (bn.title !== undefined || bn.content !== undefined) {
    const content = bn.content || '';
    return {
      id: bn.id,
      title: bn.title || 'Untitled Note',
      content,
      ownerId: bn.ownerId,
      createdAt: bn.createdAt,
      updatedAt: bn.updatedAt,
      isShared,
      isPinned: !!bn.isPinned,
      tags: bn.tags || [],
      securityStatus: 'encrypted',
      wordCount: bn.wordCount || countWords(content),
      myRole,
      isOwner,
      owner: bn.owner
    };
  }

  // 2. Fallback decryption if only ciphertext is returned
  const envelope = bn.envelopes?.find((e) => !currentUserId || e.userId === currentUserId) || bn.envelopes?.[0];
  const encryptedKey = envelope?.encryptedNoteKey;

  const decrypted = await decryptPayload(bn.ciphertext || '', bn.iv || '', encryptedKey);
  const content = decrypted.content || '';

  return {
    id: bn.id,
    title: decrypted.title || 'Untitled Note',
    content,
    ownerId: bn.ownerId,
    createdAt: bn.createdAt,
    updatedAt: bn.updatedAt,
    isShared,
    isPinned: decrypted.isPinned,
    tags: decrypted.tags,
    securityStatus: 'encrypted',
    wordCount: decrypted.wordCount || countWords(content),
    myRole,
    isOwner,
    owner: bn.owner
  };
}

/**
 * Get all notes from PostgreSQL.
 */
export async function getNotes(
  ownerId: string,
  sort: SortOption = 'recently-updated'
): Promise<Note[]> {
  const backendNotes = await apiFetch<BackendNote[]>('/notes');
  const mapped = await Promise.all(
    backendNotes.map((bn) => mapBackendNote(bn, ownerId))
  );
  return sortNotes(mapped, sort);
}

/**
 * Get a single note by ID from PostgreSQL.
 */
export async function getNote(id: string, currentUserId?: string): Promise<Note> {
  const bn = await apiFetch<BackendNote>(`/notes/${id}`);
  return mapBackendNote(bn, currentUserId);
}

/**
 * Create a new note (encrypted into PostgreSQL database).
 */
export async function createNote(ownerId: string): Promise<Note> {
  const initialData = {
    title: 'Untitled Note',
    content: '',
    isPinned: false,
    tags: [],
  };

  const created = await apiFetch<BackendNote>('/notes', {
    method: 'POST',
    body: JSON.stringify(initialData),
  });

  return mapBackendNote(created, ownerId);
}

/**
 * Update note title and/or content (encrypted into PostgreSQL database).
 */
export async function updateNote(
  id: string,
  data: Partial<Pick<Note, 'title' | 'content' | 'isPinned'>>
): Promise<Note> {
  const updated = await apiFetch<BackendNote>(`/notes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });

  return mapBackendNote(updated);
}

/**
 * Duplicate a note.
 */
export async function duplicateNote(id: string, ownerId: string): Promise<Note> {
  const source = await getNote(id);
  const copyData = {
    title: `${source.title} (copy)`,
    content: source.content,
    isPinned: false,
    tags: [...source.tags],
  };

  const created = await apiFetch<BackendNote>('/notes', {
    method: 'POST',
    body: JSON.stringify(copyData),
  });

  return mapBackendNote(created, ownerId);
}

/**
 * Delete a note by ID in PostgreSQL.
 */
export async function deleteNote(id: string): Promise<void> {
  await apiFetch(`/notes/${id}`, {
    method: 'DELETE',
  });
}

/**
 * Search notes by query.
 */
export async function searchNotes(query: string, ownerId: string): Promise<Note[]> {
  const all = await getNotes(ownerId);
  if (!query.trim()) return all;
  const q = query.toLowerCase();
  return all.filter(
    (n) => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)
  );
}

/**
 * Helper to update shared state in local context if needed
 */
export function _setNoteShared(_id: string, _isShared: boolean): void {
  // Handled on backend
}
