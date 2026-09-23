import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import type { SharedUser } from '../../types';

interface RevokeModalProps {
  isOpen: boolean;
  user: SharedUser;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export function RevokeModal({ isOpen, user, onClose, onConfirm }: RevokeModalProps) {
  const [isRevoking, setIsRevoking] = useState(false);

  const handleConfirm = async () => {
    setIsRevoking(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setIsRevoking(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Revoke this user's access to this note?"
      size="sm"
    >
      <div className="space-y-5">
        {/* Warning */}
        <div className="flex gap-3 rounded-xl bg-amber-50 p-4 dark:bg-amber-950/30">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-500" />
          <div className="text-sm text-amber-700 dark:text-amber-400 space-y-1">
            <p>
              <strong>{user.email || user.name}</strong> will immediately lose access to this note. The note will be removed from their shared notes list.
            </p>
            <p className="text-xs opacity-80">
              The note itself will not be deleted.
            </p>
          </div>
        </div>

        {/* User summary */}
        <div className="flex items-center gap-3 rounded-xl border border-zinc-100 px-4 py-3 dark:border-zinc-800">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-100 text-sm font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
            {user.avatarInitials}
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{user.email || user.name}</p>
            <p className="text-xs capitalize text-zinc-400">Permission: {user.permission === 'edit' ? 'Edit' : 'View'}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2.5">
          <Button variant="outline" fullWidth onClick={onClose} disabled={isRevoking}>
            Cancel
          </Button>
          <Button variant="danger" fullWidth onClick={handleConfirm} isLoading={isRevoking}>
            Revoke Access
          </Button>
        </div>
      </div>
    </Modal>
  );
}
