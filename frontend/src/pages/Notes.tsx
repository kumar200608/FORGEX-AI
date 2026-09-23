import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, SortAsc, LayoutGrid, List, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { NoteCard } from '../components/notes/NoteCard';
import { EmptyState } from '../components/notes/EmptyState';
import { NoteSkeletonGrid } from '../components/ui/Skeleton';
import { Button } from '../components/ui/Button';
import { ToastContainer } from '../components/ui/Toast';
import { ShareModal } from '../components/sharing/ShareModal';
import { useNotesStore } from '../store/notesStore';
import { useAuthStore } from '../store/authStore';
import { useToast } from '../hooks/useToast';
import { useDebounce } from '../hooks/useDebounce';
import type { Note, SortOption, ViewMode } from '../types';
import { cn } from '../lib/utils';

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'recently-updated', label: 'Recently updated' },
  { value: 'recently-created', label: 'Recently created' },
  { value: 'alphabetical', label: 'Alphabetical' },
];

export default function Notes() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    notes, isLoading, error,
    sort, viewMode,
    fetchNotes, createNote, duplicateNote, deleteNote,
    setSort, setViewMode,
    searchNotes,
  } = useNotesStore();

  const { toasts, toast, removeToast } = useToast();

  const [rawSearch, setRawSearch] = useState('');
  const [searchResults, setSearchResults] = useState<Note[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [shareNote, setShareNote] = useState<Note | null>(null);

  const debouncedSearch = useDebounce(rawSearch, 300);

  useEffect(() => {
    if (user) fetchNotes(user.id);
  }, [user, fetchNotes]);

  useEffect(() => {
    if (!user) return;
    if (!debouncedSearch.trim()) {
      setSearchResults(null);
      return;
    }
    setIsSearching(true);
    searchNotes(debouncedSearch, user.id)
      .then((r) => setSearchResults(r))
      .finally(() => setIsSearching(false));
  }, [debouncedSearch, user, searchNotes]);

  const handleNew = useCallback(async () => {
    if (!user) {
      toast.error('Please sign in to create notes.');
      navigate('/login');
      return;
    }
    setIsCreating(true);
    try {
      const note = await createNote(user.id);
      navigate(`/app/notes/${note.id}`);
    } catch (err) {
      console.error('Failed to create note:', err);
      const msg = err instanceof Error ? err.message : 'Unable to create note.';
      toast.error(msg);
      if (msg.toLowerCase().includes('token') || msg.toLowerCase().includes('auth') || msg.toLowerCase().includes('sign in')) {
        navigate('/login');
      }
    } finally {
      setIsCreating(false);
    }
  }, [user, createNote, navigate, toast]);

  const [filterTab, setFilterTab] = useState<'all' | 'mine' | 'shared'>('all');

  const ownedNotes = notes.filter((n) => n.isOwner !== false);
  const sharedNotes = notes.filter((n) => n.isOwner === false);

  const filteredNotes = notes.filter((n) => {
    if (filterTab === 'mine') return n.isOwner !== false;
    if (filterTab === 'shared') return n.isOwner === false;
    return true;
  });

  const displayed = searchResults ?? filteredNotes;

  const handleDelete = useCallback(async (id: string) => {
    const target = notes.find((n) => n.id === id);
    if (target && target.isOwner === false) {
      toast.error('You cannot delete a note shared with you.');
      return;
    }
    try {
      await deleteNote(id);
      toast.success('Note deleted.');
    } catch {
      toast.error('Unable to delete note.');
    }
  }, [deleteNote, toast, notes]);

  const handleDuplicate = useCallback(async (id: string) => {
    if (!user) return;
    const target = notes.find((n) => n.id === id);
    if (target && target.isOwner === false) {
      toast.info('Cannot duplicate a shared note.');
      return;
    }
    try {
      await duplicateNote(id, user.id);
      toast.success('Note duplicated.');
    } catch {
      toast.error('Unable to duplicate note.');
    }
  }, [user, duplicateNote, toast, notes]);

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b border-zinc-100 bg-white px-6 py-5 dark:border-zinc-800/80 dark:bg-zinc-950">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
              {filterTab === 'shared' ? 'Shared Notes' : 'My Notes'}
            </h1>
            <p className="mt-0.5 text-sm text-zinc-400 dark:text-zinc-500">
              {filterTab === 'shared'
                ? 'Notes that others have shared with you.'
                : 'Keep your thoughts private and secure.'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="primary"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={handleNew}
              isLoading={isCreating}
            >
              New note
            </Button>
          </div>
        </div>

        {/* Filter Tabs + Search + Controls */}
        <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Tabs */}
          <div className="flex items-center gap-1 rounded-xl border border-zinc-200/80 bg-zinc-100/70 p-1 dark:border-zinc-800 dark:bg-zinc-900/80 w-fit">
            <button
              onClick={() => setFilterTab('all')}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all',
                filterTab === 'all'
                  ? 'bg-white text-zinc-900 shadow-xs dark:bg-zinc-800 dark:text-zinc-100'
                  : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
              )}
            >
              <span>All</span>
              <span className="rounded-full bg-zinc-200/70 px-1.5 py-0.2 text-[10px] font-semibold text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
                {notes.length}
              </span>
            </button>
            <button
              onClick={() => setFilterTab('mine')}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all',
                filterTab === 'mine'
                  ? 'bg-white text-zinc-900 shadow-xs dark:bg-zinc-800 dark:text-zinc-100'
                  : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
              )}
            >
              <span>Owned by me</span>
              <span className="rounded-full bg-zinc-200/70 px-1.5 py-0.2 text-[10px] font-semibold text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
                {ownedNotes.length}
              </span>
            </button>
            <button
              onClick={() => setFilterTab('shared')}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all',
                filterTab === 'shared'
                  ? 'bg-white text-zinc-900 shadow-xs dark:bg-zinc-800 dark:text-zinc-100'
                  : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
              )}
            >
              <span>Shared with me</span>
              {sharedNotes.length > 0 && (
                <span className="rounded-full bg-indigo-100 px-1.5 py-0.2 text-[10px] font-semibold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400">
                  {sharedNotes.length}
                </span>
              )}
            </button>
          </div>

          {/* Search + View mode */}
          <div className="flex flex-1 items-center gap-3 lg:max-w-md">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
              <input
                type="search"
                placeholder="Search notes…"
                value={rawSearch}
                onChange={(e) => setRawSearch(e.target.value)}
                aria-label="Search notes"
                className="h-9 w-full rounded-lg border border-zinc-200 bg-zinc-50 pl-9 pr-3 text-sm outline-none transition-all placeholder:text-zinc-400 focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:bg-zinc-950"
              />
              {isSearching && (
                <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-zinc-400" />
              )}
            </div>

            {/* Sort */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-zinc-400">
                <SortAsc className="h-4 w-4" />
              </div>
              <select
                value={sort}
                onChange={(e) => { setSort(e.target.value as SortOption); if (user) fetchNotes(user.id); }}
                aria-label="Sort notes"
                className="h-9 rounded-lg border border-zinc-200 bg-white px-2.5 text-sm text-zinc-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>

              {/* View toggle */}
              <div className="flex rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                {(['grid', 'list'] as ViewMode[]).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    aria-label={`${mode} view`}
                    aria-pressed={viewMode === mode}
                    className={cn(
                      'px-2.5 py-1.5 transition-colors',
                      viewMode === mode
                        ? 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                        : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-400'
                    )}
                  >
                    {mode === 'grid' ? <LayoutGrid className="h-4 w-4" /> : <List className="h-4 w-4" />}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notes area */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Error state */}
        {error && !isLoading && (
          <div className="mb-4 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 dark:border-red-900/50 dark:bg-red-950/30">
            <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
            <p className="text-sm text-red-600 dark:text-red-400 flex-1">Unable to load notes.</p>
            <button
              onClick={() => user && fetchNotes(user.id)}
              className="flex items-center gap-1 text-xs text-red-500 hover:underline"
            >
              <RefreshCw className="h-3 w-3" />
              Try again
            </button>
          </div>
        )}

        {/* Loading */}
        {isLoading ? (
          <NoteSkeletonGrid />
        ) : displayed.length === 0 ? (
          <EmptyState
            icon={<Search className="h-7 w-7" />}
            title={
              rawSearch
                ? 'No notes found'
                : filterTab === 'shared'
                ? 'No shared notes yet'
                : filterTab === 'mine'
                ? 'No personal notes yet'
                : 'No notes yet'
            }
            description={
              rawSearch
                ? `No results for "${rawSearch}". Try a different search term.`
                : filterTab === 'shared'
                ? 'Notes that teammates or collaborators share with you will appear here.'
                : 'Create your first note to get started.'
            }
            action={!rawSearch && filterTab !== 'shared' ? { label: 'New note', onClick: handleNew } : undefined}
          />
        ) : (
          <>
            {rawSearch && (
              <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
                {displayed.length} result{displayed.length !== 1 ? 's' : ''} for &ldquo;{rawSearch}&rdquo;
              </p>
            )}
            <div className={cn(
              'gap-3',
              viewMode === 'grid'
                ? 'grid sm:grid-cols-2 lg:grid-cols-3'
                : 'flex flex-col'
            )}>
              {displayed.map((note) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  onDelete={handleDelete}
                  onDuplicate={handleDuplicate}
                  onShare={setShareNote}
                  searchQuery={rawSearch}
                  viewMode={viewMode}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Share modal */}
      {shareNote && (
        <ShareModal
          note={shareNote}
          isOpen={!!shareNote}
          onClose={() => setShareNote(null)}
          onSuccess={(msg) => { toast.success(msg); setShareNote(null); }}
        />
      )}

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
