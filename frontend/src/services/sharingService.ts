import type { SharedUser, ShareInvite, RevokeRequest, SharedWithMeEntry, Permission } from '../types';
import { apiFetch } from './api';
import { _setNoteShared } from './notesService';

/**
 * Get active users who have access to a note from backend.
 */
export async function getSharedUsers(noteId: string): Promise<SharedUser[]> {
  try {
    const list = await apiFetch<SharedUser[]>(`/notes/${noteId}/shares`);
    return list;
  } catch (error) {
    console.error('Failed to get shared users:', error);
    return [];
  }
}

/**
 * Share a note with a user (by email or user ID) with a chosen permission.
 */
export async function shareNote(invite: ShareInvite): Promise<SharedUser> {
  const payload = {
    email: invite.email,
    role: invite.permission === 'edit' ? 'editor' : 'viewer',
  };

  const shared = await apiFetch<SharedUser>(`/notes/${invite.noteId}/share`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  _setNoteShared(invite.noteId, true);
  return shared;
}

/**
 * Update permission of an existing collaborator between 'view' and 'edit'.
 */
export async function updatePermission(
  noteId: string,
  recipientUserId: string,
  permission: Permission
): Promise<SharedUser> {
  const payload = {
    recipientUserId,
    role: permission === 'edit' ? 'editor' : 'viewer',
  };

  const updated = await apiFetch<SharedUser>(`/notes/${noteId}/share`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  return updated;
}

/**
 * Revoke a user's access to a note in backend.
 */
export async function revokeAccess(req: RevokeRequest): Promise<void> {
  await apiFetch(`/notes/${req.noteId}/share/${req.userId}`, {
    method: 'DELETE',
  });
}

/**
 * Get notes shared with the current authenticated user from backend.
 */
export async function getSharedWithMe(
  _userId: string
): Promise<SharedWithMeEntry[]> {
  try {
    const entries = await apiFetch<SharedWithMeEntry[]>('/notes/shared-with-me');
    return entries;
  } catch (error) {
    console.error('Failed to get shared notes:', error);
    return [];
  }
}
