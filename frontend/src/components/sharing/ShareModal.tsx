import { useState, useEffect, useCallback } from 'react';
import { Users, Search, Check, Loader2, Crown, Trash2 } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import type { Note, SharedUser, Permission } from '../../types';
import * as sharingService from '../../services/sharingService';
import { searchUsers } from '../../services/authService';
import { useAuthStore } from '../../store/authStore';
import { useNotesStore } from '../../store/notesStore';
import { cn } from '../../lib/utils';

import { RevokeModal } from './RevokeModal';

interface ShareModalProps {
  note: Note;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

export function ShareModal({ note, isOpen, onClose, onSuccess }: ShareModalProps) {
  const { user } = useAuthStore();
  const { setNoteShared } = useNotesStore();

  const isOwner = Boolean(
    note.isOwner === true ||
    note.myRole === 'owner' ||
    (user && note.ownerId && note.ownerId === user.id) ||
    (user && note.owner?.id && note.owner.id === user.id) ||
    (note.isOwner !== false && note.myRole !== 'view' && note.myRole !== 'edit')
  );

  const [sharedUsers, setSharedUsers] = useState<SharedUser[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  const [emailQuery, setEmailQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ id: string; name: string; email: string }>>([]);
  const [selectedUser, setSelectedUser] = useState<{ id: string; name: string; email: string } | null>(null);
  const [permission, setPermission] = useState<Permission>('view');
  const [isSharing, setIsSharing] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);
  const [shareError, setShareError] = useState('');
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  const [revokeTarget, setRevokeTarget] = useState<SharedUser | null>(null);

  const loadSharedUsers = useCallback(async () => {
    setIsLoadingUsers(true);
    try {
      const users = await sharingService.getSharedUsers(note.id);
      setSharedUsers(users);
    } catch (err) {
      console.error('Failed to load shared users:', err);
    } finally {
      setIsLoadingUsers(false);
    }
  }, [note.id]);

  useEffect(() => {
    if (isOpen) {
      loadSharedUsers();
      setShareError('');
      setShareSuccess(false);
    }
  }, [isOpen, loadSharedUsers]);

  const handleEmailSearch = async (q: string) => {
    setEmailQuery(q);
    setSelectedUser(null);
    setShareError('');
    if (q.trim().length < 1) {
      setSearchResults([]);
      return;
    }
    setIsSearchingUsers(true);
    try {
      const results = await searchUsers(q, user?.id ?? '');
      const sharedIds = sharedUsers.map((s) => s.id);
      setSearchResults(results.filter((r) => !sharedIds.includes(r.id)));
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearchingUsers(false);
    }
  };

  const handleSelectUser = (u: { id: string; name: string; email: string }) => {
    setSelectedUser(u);
    setEmailQuery(u.email);
    setSearchResults([]);
  };

  const handleShare = async () => {
    const email = selectedUser?.email ?? emailQuery.trim();
    if (!email) return;
    setIsSharing(true);
    setShareError('');
    try {
      const shared = await sharingService.shareNote({
        noteId: note.id,
        email,
        permission,
      });

      setSharedUsers((prev) => {
        const exists = prev.find((u) => u.id === shared.id);
        return exists
          ? prev.map((u) => (u.id === shared.id ? shared : u))
          : [...prev, shared];
      });

      setNoteShared(note.id, true);
      setEmailQuery('');
      setSelectedUser(null);
      setShareSuccess(true);
      onSuccess(`Note shared with ${shared.name || shared.email} (${permission === 'edit' ? 'Can edit' : 'Can view'})`);
      setTimeout(() => setShareSuccess(false), 2000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to share note. Please verify the email and try again.';
      setShareError(msg);
    } finally {
      setIsSharing(false);
    }
  };

  const handlePermissionChange = async (targetUserId: string, newPermission: Permission) => {
    setUpdatingUserId(targetUserId);
    setShareError('');
    try {
      await sharingService.updatePermission(note.id, targetUserId, newPermission);
      setSharedUsers((prev) =>
        prev.map((u) => (u.id === targetUserId ? { ...u, permission: newPermission } : u))
      );
      onSuccess(`Updated access to ${newPermission === 'edit' ? 'Can edit' : 'Can view'}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to update permission.';
      setShareError(msg);
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleRevokeConfirm = async () => {
    if (!revokeTarget) return;
    try {
      await sharingService.revokeAccess({ noteId: note.id, userId: revokeTarget.id });
      setSharedUsers((prev) => prev.filter((u) => u.id !== revokeTarget.id));
      if (sharedUsers.length <= 1) setNoteShared(note.id, false);
      onSuccess(`Revoked ${revokeTarget.name}'s access to this note`);
      setRevokeTarget(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to revoke access.';
      setShareError(msg);
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Share note"
        description={note.title || 'Untitled'}
      >
        <div className="space-y-5">
          {/* Note Owner */}
          <div className="flex items-center justify-between rounded-lg px-3 py-2 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800 text-xs">
            <div className="flex items-center gap-2">
              <Crown className="h-4 w-4 text-amber-500" />
              <span className="text-zinc-500 dark:text-zinc-400">Owner:</span>
              <span className="font-medium text-zinc-800 dark:text-zinc-200">
                {note.owner?.email || user?.email}
              </span>
            </div>
            <span className="text-amber-600 dark:text-amber-400 font-medium">Owner</span>
          </div>

          {/* Collaborators section */}
          {isLoadingUsers ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
            </div>
          ) : sharedUsers.length > 0 ? (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Collaborators
                </h3>
                <span className="text-[11px] text-zinc-400">
                  {sharedUsers.length} collaborator{sharedUsers.length !== 1 ? 's' : ''}
                </span>
              </div>

              <div className="divide-y divide-zinc-100 rounded-xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-950">
                {sharedUsers.map((su) => (
                  <div key={su.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar initials={su.avatarInitials} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">{su.email}</p>
                        {su.name && su.name !== su.email && (
                          <p className="text-xs text-zinc-400 truncate">{su.name}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* Permission Display */}
                      <span className={cn(
                        "text-xs font-medium px-2 py-0.5 rounded-md",
                        su.permission === 'edit'
                          ? "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200/60 dark:border-amber-900/40"
                          : "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200/60 dark:border-blue-900/40"
                      )}>
                        {su.permission === 'edit' ? 'Edit' : 'View'}
                      </span>

                      {/* [Change] permission control (Owner only) */}
                      {isOwner && (
                        <select
                          value={su.permission}
                          disabled={updatingUserId === su.id}
                          onChange={(e) => handlePermissionChange(su.id, e.target.value as Permission)}
                          className="rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs font-medium text-zinc-700 outline-none hover:bg-zinc-100 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 cursor-pointer disabled:opacity-50"
                          aria-label={`Change permission for ${su.email}`}
                        >
                          <option value="view">Change to View</option>
                          <option value="edit">Change to Edit</option>
                        </select>
                      )}

                      {/* [Revoke Access] button (Owner only) */}
                      {isOwner && (
                        <button
                          type="button"
                          onClick={() => setRevokeTarget(su)}
                          className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-100 hover:border-red-300 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-400 dark:hover:bg-red-900/50 transition-colors cursor-pointer"
                          title={`Revoke access for ${su.email}`}
                          aria-label={`Revoke access for ${su.email}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Revoke Access</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {/* Add person (Owner only) */}
          {isOwner && (
            <>
              {/* Divider */}
              <div className="border-t border-zinc-100 dark:border-zinc-800" />

              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                  Invite a user
                </p>
                <div className="relative">
                  <Input
                    placeholder="Search user by name or email…"
                    value={emailQuery}
                    onChange={(e) => handleEmailSearch(e.target.value)}
                    leftIcon={<Search className="h-4 w-4" />}
                    rightIcon={isSearchingUsers ? <Loader2 className="h-4 w-4 animate-spin" /> : undefined}
                    aria-label="Search people to share with"
                  />
                  {searchResults.length > 0 && (
                    <div className="absolute left-0 right-0 top-full z-10 mt-1 max-h-48 overflow-y-auto rounded-xl border border-zinc-200 bg-white py-1 shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
                      {searchResults.map((u) => (
                        <button
                          key={u.id}
                          onClick={() => handleSelectUser(u)}
                          className="flex w-full items-center gap-3 px-4 py-2.5 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                        >
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-400">
                            {u.email[0].toUpperCase()}
                          </div>
                          <div className="text-left">
                            <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{u.name}</p>
                            <p className="text-xs text-zinc-400">{u.email}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Permission dropdown for invite */}
                <div className="flex items-center justify-between gap-3 rounded-lg border border-zinc-100 bg-zinc-50/60 p-2.5 dark:border-zinc-800 dark:bg-zinc-900/60">
                  <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                    Permission:
                  </span>
                  <select
                    value={permission}
                    onChange={(e) => setPermission(e.target.value as Permission)}
                    className="rounded-lg border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-700 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 cursor-pointer"
                    aria-label="Select permission for new user"
                  >
                    <option value="view">Can view (Read-only)</option>
                    <option value="edit">Can edit (Read & Modify)</option>
                  </select>
                </div>

                {shareError && (
                  <p className="text-xs text-red-500 bg-red-50 dark:bg-red-950/30 p-2 rounded-lg border border-red-200 dark:border-red-900/40">
                    {shareError}
                  </p>
                )}

                <Button
                  variant="primary"
                  fullWidth
                  onClick={handleShare}
                  isLoading={isSharing}
                  disabled={!emailQuery.trim()}
                  leftIcon={shareSuccess ? <Check className="h-4 w-4" /> : <Users className="h-4 w-4" />}
                >
                  {shareSuccess ? 'Shared!' : 'Share note'}
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* Revoke modal */}
      {revokeTarget && (
        <RevokeModal
          isOpen={!!revokeTarget}
          user={revokeTarget}
          onClose={() => setRevokeTarget(null)}
          onConfirm={handleRevokeConfirm}
        />
      )}
    </>
  );
}

function Avatar({ initials }: { initials: string }) {
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-400">
      {initials}
    </div>
  );
}
