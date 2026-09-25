import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Trash2, Share2, Save, Loader2, Check,
  MoreHorizontal, Pin, PinOff, AlertCircle, Eye
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { ToastContainer } from '../components/ui/Toast';
import { SecurityBadge } from '../components/security/SecurityBadge';
import { ShareModal } from '../components/sharing/ShareModal';
import { useNotesStore } from '../store/notesStore';
import { useAuthStore } from '../store/authStore';
import { useToast } from '../hooks/useToast';
import { formatDateTime, countWords, cn } from '../lib/utils';
import * as notesService from '../services/notesService';
import type { Note } from '../types';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error' | 'unsaved';

export default function NoteEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { getNoteById, updateNote, deleteNote, fetchNotes } = useNotesStore();
  const { toasts, toast, removeToast } = useToast();

  const [note, setNote] = useState<Note | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [wordCount, setWordCount] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isDirty = useRef(false);
  const titleRef = useRef(title);
  const contentRef = useRef(content);

  // Determine permissions
  const isOwner = note ? (note.isOwner !== false && (note.ownerId === user?.id || note.myRole === 'owner')) : true;
  const isViewOnly = note ? (note.myRole === 'view' && !isOwner) : false;

  // Keep refs in sync
  useEffect(() => { titleRef.current = title; }, [title]);
  useEffect(() => { contentRef.current = content; }, [content]);

  // Load note
  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      let found = id ? getNoteById(id) : undefined;
      if (!found && user) {
        await fetchNotes(user.id);
        found = id ? getNoteById(id) : undefined;
      }
      if (!found && id) {
        try {
          found = await notesService.getNote(id, user?.id);
        } catch {
          // not found or unauthorized
        }
      }
      if (found) {
        setNote(found);
        setTitle(found.title);
        setContent(found.content);
        setLastSaved(found.updatedAt);
        setWordCount(found.wordCount);
      } else {
        setNotFound(true);
      }
      setIsLoading(false);
    };
    load();
  }, [id, user]); // eslint-disable-line react-hooks/exhaustive-deps

  const save = useCallback(async (t: string, c: string, silent = false) => {
    if (!id || isViewOnly) return;
    if (!silent) setSaveStatus('saving');
    try {
      const updated = await updateNote(id, { title: t, content: c });
      setLastSaved(updated.updatedAt);
      setWordCount(updated.wordCount);
      setSaveStatus('saved');
      isDirty.current = false;
      setTimeout(() => setSaveStatus('idle'), 2500);
    } catch {
      setSaveStatus('error');
      if (!silent) toast.error('Unable to save note. Your changes are still on this device.');
    }
  }, [id, updateNote, toast, isViewOnly]);

  const scheduleAutoSave = useCallback(() => {
    if (isViewOnly) return;
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    setSaveStatus('unsaved');
    autoSaveTimer.current = setTimeout(() => {
      save(titleRef.current, contentRef.current);
    }, 1500);
  }, [save, isViewOnly]);

  const handleTitleChange = (v: string) => {
    if (isViewOnly) return;
    setTitle(v);
    isDirty.current = true;
    scheduleAutoSave();
  };

  const handleContentChange = (v: string) => {
    if (isViewOnly) return;
    setContent(v);
    setWordCount(countWords(v));
    isDirty.current = true;
    scheduleAutoSave();
  };

  const handleManualSave = () => {
    if (isViewOnly) return;
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    save(title, content);
  };

  const handleDelete = async () => {
    if (!id) return;
    if (!isOwner) {
      toast.error('Only the note owner can delete this note.');
      return;
    }
    if (!window.confirm('Delete this note? This action cannot be undone.')) return;
    setIsDeleting(true);
    try {
      await deleteNote(id);
      navigate('/app/notes');
    } catch {
      toast.error('Unable to delete note.');
      setIsDeleting(false);
    }
  };

  const handleTogglePin = async () => {
    if (!id || !note) return;
    try {
      const updated = await updateNote(id, { isPinned: !note.isPinned });
      setNote(updated);
      toast.success(updated.isPinned ? 'Note pinned.' : 'Note unpinned.');
    } catch {
      toast.error('Unable to update note.');
    }
    setMoreOpen(false);
  };

  // Cleanup — save on unmount if dirty
  useEffect(() => {
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
      if (isDirty.current && id && !isViewOnly) {
        updateNote(id, { title: titleRef.current, content: contentRef.current }).catch(() => {});
      }
    };
  }, [id, updateNote, isViewOnly]);

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
        <AlertCircle className="h-8 w-8 text-zinc-400" />
        <div>
          <p className="font-medium text-zinc-700 dark:text-zinc-300">Note not found</p>
          <p className="mt-1 text-sm text-zinc-400">This note may have been deleted or access was revoked.</p>
        </div>
        <Button variant="outline" onClick={() => navigate('/app/notes')} leftIcon={<ArrowLeft className="h-4 w-4" />}>
          Back to notes
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center justify-between border-b border-zinc-100 bg-white px-4 py-3 dark:border-zinc-800/80 dark:bg-zinc-950">
          {/* Left */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
            aria-label="Back"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back</span>
          </button>

          {/* Center — security badge & role */}
          <div className="flex items-center gap-2">
            {note && (
              <SecurityBadge status={note.securityStatus} size="sm" />
            )}
            {isViewOnly && (
              <span className="flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/60 dark:border-blue-900/40">
                <Eye className="h-3 w-3" />
                View only
              </span>
            )}
            {!isOwner && !isViewOnly && (
              <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-900/40">
                Can edit
              </span>
            )}
          </div>

          {/* Right — status + actions */}
          <div className="flex items-center gap-2">
            {/* Save status */}
            {!isViewOnly && (
              <span className="hidden sm:inline text-xs text-zinc-400 dark:text-zinc-500">
                {saveStatus === 'saving' && (
                  <span className="flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Saving…
                  </span>
                )}
                {saveStatus === 'saved' && (
                  <span className="flex items-center gap-1 text-emerald-500">
                    <Check className="h-3 w-3" />
                    Saved just now
                  </span>
                )}
                {saveStatus === 'unsaved' && (
                  <span className="text-amber-500">Unsaved changes</span>
                )}
                {saveStatus === 'error' && (
                  <span className="text-red-500">Save failed</span>
                )}
                {saveStatus === 'idle' && lastSaved && (
                  `Saved ${formatDateTime(lastSaved)}`
                )}
              </span>
            )}

            {/* Share button (owner only) */}
            {isOwner && (
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<Share2 className="h-4 w-4" />}
                onClick={() => setShowShare(true)}
              >
                <span className="hidden sm:inline">Share</span>
              </Button>
            )}

            {/* More menu */}
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<MoreHorizontal className="h-4 w-4" />}
                onClick={() => setMoreOpen((v) => !v)}
                aria-label="More options"
              />
              {moreOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMoreOpen(false)} />
                  <div className="absolute right-0 top-10 z-20 min-w-[160px] rounded-xl border border-zinc-100 bg-white py-1 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
                    {!isViewOnly && (
                      <button
                        onClick={handleTogglePin}
                        className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800/50"
                      >
                        {note?.isPinned
                          ? <><PinOff className="h-4 w-4" /> Unpin</>
                          : <><Pin className="h-4 w-4" /> Pin note</>}
                      </button>
                    )}
                    {isOwner && (
                      <>
                        <div className="my-1 border-t border-zinc-100 dark:border-zinc-800" />
                        <button
                          onClick={() => { handleDelete(); setMoreOpen(false); }}
                          className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete note
                        </button>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Manual Save button (only for users with edit/owner access) */}
            {!isViewOnly && (
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Save className="h-4 w-4" />}
                onClick={handleManualSave}
                isLoading={saveStatus === 'saving'}
              >
                Save
              </Button>
            )}
          </div>
        </div>

        {/* Editor */}
        <div className="flex-1 overflow-y-auto bg-white dark:bg-zinc-950">
          <div className="mx-auto w-full max-w-3xl px-6 py-10 sm:px-10 lg:px-16">
            {/* View only banner */}
            {isViewOnly && (
              <div className="mb-6 flex items-center gap-2.5 rounded-xl border border-blue-200/80 bg-blue-50/70 p-3.5 text-xs text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-300">
                <AlertCircle className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
                <span>You have <strong>view-only</strong> access to this note. Editing is disabled.</span>
              </div>
            )}

            {/* Title */}
            <input
              type="text"
              value={title}
              readOnly={isViewOnly}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Note title"
              aria-label="Note title"
              className={cn(
                "mb-6 w-full border-none bg-transparent text-[2rem] font-bold leading-tight text-zinc-900 outline-none placeholder:text-zinc-200 dark:text-zinc-100 dark:placeholder:text-zinc-800",
                isViewOnly && "cursor-default select-text"
              )}
            />

            {/* Divider */}
            <div className="mb-6 flex items-center justify-between">
              <div className="h-px flex-1 bg-zinc-100 dark:bg-zinc-800" />
            </div>

            {/* Content */}
            <textarea
              value={content}
              readOnly={isViewOnly}
              onChange={(e) => handleContentChange(e.target.value)}
              placeholder={isViewOnly ? "No content in this note." : "Start writing…"}
              aria-label="Note content"
              className={cn(
                "min-h-[60vh] w-full resize-none border-none bg-transparent font-mono text-sm leading-7 text-zinc-700 outline-none placeholder:text-zinc-200 dark:text-zinc-300 dark:placeholder:text-zinc-800",
                isViewOnly && "cursor-default select-text"
              )}
            />
          </div>
        </div>

        {/* Footer bar */}
        <div className="flex items-center justify-between border-t border-zinc-100 bg-white px-6 py-2.5 dark:border-zinc-800/80 dark:bg-zinc-950">
          <span className="text-xs text-zinc-400 dark:text-zinc-500">
            {wordCount} word{wordCount !== 1 ? 's' : ''}
          </span>
          <div className="flex items-center gap-3">
            {/* Mobile save status */}
            {!isViewOnly && (
              <span className="sm:hidden text-xs text-zinc-400 dark:text-zinc-500">
                {saveStatus === 'unsaved' && <span className="text-amber-500">Unsaved</span>}
                {saveStatus === 'saved' && <span className="text-emerald-500">Saved</span>}
                {saveStatus === 'error' && <span className="text-red-500">Error</span>}
              </span>
            )}
            {/* Owner delete button in footer */}
            {isOwner && (
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                aria-label="Delete note"
                className="flex items-center gap-1 text-xs text-zinc-400 hover:text-red-500 dark:hover:text-red-400 transition-colors disabled:opacity-50"
              >
                {isDeleting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                Delete
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Share modal */}
      {note && isOwner && (
        <ShareModal
          note={note}
          isOpen={showShare}
          onClose={() => setShowShare(false)}
          onSuccess={(msg) => { toast.success(msg); setShowShare(false); }}
        />
      )}

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  );
}
