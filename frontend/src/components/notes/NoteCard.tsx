import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MoreHorizontal, Lock, Globe, Edit3, Share2, Copy, Trash2 } from 'lucide-react';
import type { Note } from '../../types';
import { SecurityBadge } from '../security/SecurityBadge';
import { cn, formatRelativeTime, truncate } from '../../lib/utils';

interface NoteCardProps {
  note: Note;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onShare: (note: Note) => void;
  searchQuery?: string;
  viewMode?: 'grid' | 'list';
}

function highlightText(text: string, query: string): React.ReactNode {
  if (!query?.trim()) return text;
  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase() ? (
      <mark key={i} className="bg-yellow-200 text-yellow-900 dark:bg-yellow-500/30 dark:text-yellow-200 rounded px-0.5">
        {part}
      </mark>
    ) : (
      part
    )
  );
}

export function NoteCard({
  note,
  onDelete,
  onDuplicate,
  onShare,
  searchQuery = '',
  viewMode = 'grid',
}: NoteCardProps) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const preview = truncate(note.content.replace(/#+\s/g, '').replace(/\n/g, ' '), 120);

  const handleCardClick = () => {
    if (!menuOpen) navigate(`/app/notes/${note.id}`);
  };

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen((v) => !v);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirmDelete) {
      onDelete(note.id);
      setMenuOpen(false);
      setConfirmDelete(false);
    } else {
      setConfirmDelete(true);
    }
  };

  const isOwner = note.isOwner !== false;

  if (viewMode === 'list') {
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={handleCardClick}
        onKeyDown={(e) => e.key === 'Enter' && handleCardClick()}
        className="group flex items-center gap-4 rounded-xl border border-zinc-100 bg-white px-5 py-4 transition-all hover:border-zinc-200 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700 cursor-pointer"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 truncate text-sm">
              {highlightText(note.title || 'Untitled', searchQuery)}
            </h3>
            {note.isPinned && <span className="text-amber-500 text-xs">📌</span>}
          </div>
          <p className="mt-0.5 text-xs text-zinc-400 truncate">
            {preview && highlightText(preview, searchQuery)}
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <SecurityBadge status={note.securityStatus} />
          {!isOwner ? (
            <span className="flex items-center gap-1 text-xs text-indigo-500 dark:text-indigo-400">
              <Globe className="h-3.5 w-3.5" />
              {note.myRole === 'view' ? 'View' : 'Edit'}
            </span>
          ) : note.isShared ? (
            <Globe className="h-3.5 w-3.5 text-indigo-400" />
          ) : (
            <Lock className="h-3.5 w-3.5 text-zinc-300 dark:text-zinc-600" />
          )}
          <span className="text-xs text-zinc-400">{formatRelativeTime(note.updatedAt)}</span>
          <NoteMenu
            note={note}
            isOwner={isOwner}
            menuOpen={menuOpen}
            confirmDelete={confirmDelete}
            menuRef={menuRef}
            onMenuClick={handleMenuClick}
            onDelete={handleDelete}
            onDuplicate={(e) => { e.stopPropagation(); onDuplicate(note.id); setMenuOpen(false); }}
            onShare={(e) => { e.stopPropagation(); onShare(note); setMenuOpen(false); }}
            onEdit={(e) => { e.stopPropagation(); navigate(`/app/notes/${note.id}`); }}
            setMenuOpen={setMenuOpen}
            setConfirmDelete={setConfirmDelete}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={(e) => e.key === 'Enter' && handleCardClick()}
      className="group relative flex flex-col rounded-xl border border-zinc-100 bg-white p-4 transition-all hover:border-zinc-200 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700 cursor-pointer"
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 min-w-0">
          {note.isPinned && <span className="text-amber-500 text-xs shrink-0">📌</span>}
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 line-clamp-1 text-sm">
            {highlightText(note.title || 'Untitled', searchQuery)}
          </h3>
        </div>
        <NoteMenu
          note={note}
          isOwner={isOwner}
          menuOpen={menuOpen}
          confirmDelete={confirmDelete}
          menuRef={menuRef}
          onMenuClick={handleMenuClick}
          onDelete={handleDelete}
          onDuplicate={(e) => { e.stopPropagation(); onDuplicate(note.id); setMenuOpen(false); }}
          onShare={(e) => { e.stopPropagation(); onShare(note); setMenuOpen(false); }}
          onEdit={(e) => { e.stopPropagation(); navigate(`/app/notes/${note.id}`); }}
          setMenuOpen={setMenuOpen}
          setConfirmDelete={setConfirmDelete}
        />
      </div>

      {/* Preview */}
      {preview && (
        <p className="text-xs leading-relaxed text-zinc-400 line-clamp-3 dark:text-zinc-500 mb-3 flex-1">
          {highlightText(preview, searchQuery)}
        </p>
      )}

      {/* Security badge */}
      <div className="mb-3">
        <SecurityBadge status={note.securityStatus} />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-[10px] text-zinc-400 dark:text-zinc-500 border-t border-zinc-50 dark:border-zinc-800/50 pt-3 mt-auto">
        <span>{formatRelativeTime(note.updatedAt)}</span>
        <span className="flex items-center gap-1">
          {!isOwner ? (
            <>
              <Globe className="h-3 w-3 text-indigo-400" />
              <span className="text-indigo-500 dark:text-indigo-400">
                Shared · {note.myRole === 'view' ? 'Can view' : 'Can edit'}
              </span>
            </>
          ) : note.isShared ? (
            <>
              <Globe className="h-3 w-3 text-indigo-400" />
              <span className="text-indigo-500 dark:text-indigo-400">Shared</span>
            </>
          ) : (
            <>
              <Lock className="h-3 w-3" />
              Private
            </>
          )}
        </span>
      </div>
    </div>
  );
}

// ─── Note menu (extracted for reuse) ──────────────────────────────────────────

interface NoteMenuProps {
  note: Note;
  isOwner: boolean;
  menuOpen: boolean;
  confirmDelete: boolean;
  menuRef: React.RefObject<HTMLDivElement | null>;
  onMenuClick: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
  onDuplicate: (e: React.MouseEvent) => void;
  onShare: (e: React.MouseEvent) => void;
  onEdit: (e: React.MouseEvent) => void;
  setMenuOpen: (v: boolean) => void;
  setConfirmDelete: (v: boolean) => void;
}

function NoteMenu({ note, isOwner, menuOpen, confirmDelete, menuRef, onMenuClick, onDelete, onDuplicate, onShare, onEdit, setMenuOpen, setConfirmDelete }: NoteMenuProps) {
  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={onMenuClick}
        aria-label="Note options"
        className={cn(
          'rounded-lg p-1 transition-colors',
          menuOpen
            ? 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
            : 'text-zinc-300 hover:text-zinc-500 dark:text-zinc-600 dark:hover:text-zinc-400'
        )}
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>

      {menuOpen && (
        <>
          {/* Backdrop to close */}
          <div
            className="fixed inset-0 z-10"
            onClick={(e) => { e.stopPropagation(); setMenuOpen(false); setConfirmDelete(false); }}
          />
          <div className="absolute right-0 top-7 z-20 min-w-[160px] rounded-xl border border-zinc-100 bg-white py-1 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
            <MenuBtn icon={<Edit3 className="h-3.5 w-3.5" />} onClick={onEdit}>
              {note.myRole === 'view' ? 'View' : 'Edit'}
            </MenuBtn>
            {isOwner && (
              <MenuBtn icon={<Share2 className="h-3.5 w-3.5" />} onClick={onShare}>Share</MenuBtn>
            )}
            <MenuBtn icon={<Copy className="h-3.5 w-3.5" />} onClick={onDuplicate}>Duplicate</MenuBtn>
            {isOwner && (
              <>
                <div className="my-1 border-t border-zinc-100 dark:border-zinc-800" />
                <MenuBtn
                  icon={<Trash2 className="h-3.5 w-3.5" />}
                  onClick={onDelete}
                  danger
                >
                  {confirmDelete ? 'Confirm delete?' : 'Delete'}
                </MenuBtn>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function MenuBtn({
  icon,
  onClick,
  children,
  danger,
}: {
  icon: React.ReactNode;
  onClick: (e: React.MouseEvent) => void;
  children: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-2.5 px-3 py-2 text-xs transition-colors',
        danger
          ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30'
          : 'text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800/50'
      )}
    >
      {icon}
      {children}
    </button>
  );
}
