import { useEffect, useState } from 'react';


import { Users, Globe } from 'lucide-react';
import { NoteCard } from '../components/notes/NoteCard';
import { EmptyState } from '../components/notes/EmptyState';
import { NoteSkeletonGrid } from '../components/ui/Skeleton';
import { ToastContainer } from '../components/ui/Toast';
import { useAuthStore } from '../store/authStore';
import { useToast } from '../hooks/useToast';
import * as sharingService from '../services/sharingService';
import type { SharedWithMeEntry } from '../types';
import { formatRelativeTime } from '../lib/utils';

export default function SharedPage() {
  const { user } = useAuthStore();
  const { toasts, toast, removeToast } = useToast();

  const [entries, setEntries] = useState<SharedWithMeEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    sharingService.getSharedWithMe(user.id)
      .then(setEntries)
      .finally(() => setIsLoading(false));
  }, [user]);

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b border-zinc-100 bg-white px-6 py-5 dark:border-zinc-800/80 dark:bg-zinc-950">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-zinc-400" />
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Shared with me</h1>
        </div>
        <p className="mt-0.5 text-sm text-zinc-400 dark:text-zinc-500">
          Notes others have shared with you.
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {isLoading ? (
          <NoteSkeletonGrid />
        ) : entries.length === 0 ? (
          <EmptyState
            icon={<Globe className="h-7 w-7" />}
            title="Nothing shared yet"
            description="Notes shared with you by teammates or collaborators will appear here."
          />
        ) : (
          <div className="space-y-6">
            {entries.map(({ note, sharedBy, permission, sharedAt }) => (
              <div key={note.id} className="space-y-1.5">
                <div className="flex items-center gap-2 px-1">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-100 text-xs font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                    {(sharedBy.name || sharedBy.email || 'U')[0].toUpperCase()}
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    <span className="font-medium text-zinc-700 dark:text-zinc-300">{sharedBy.name}</span>
                    {' '}shared with you · Can {permission} · {formatRelativeTime(sharedAt)}
                  </p>
                </div>
                <NoteCard
                  note={note}
                  onDelete={() => toast.info("You can't delete shared notes.")}
                  onDuplicate={() => toast.info("Duplicate not available for shared notes.")}
                  onShare={() => toast.info("Only the note owner can manage sharing.")}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
