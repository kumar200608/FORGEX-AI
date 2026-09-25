import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Note, SortOption, ViewMode } from '../types';
import * as notesService from '../services/notesService';

interface NotesStore {
  notes: Note[];
  isLoading: boolean;
  error: string | null;
  sort: SortOption;
  viewMode: ViewMode;
  searchQuery: string;

  setSort: (sort: SortOption) => void;
  setViewMode: (mode: ViewMode) => void;
  setSearch: (q: string) => void;

  fetchNotes: (ownerId: string) => Promise<void>;
  createNote: (ownerId: string) => Promise<Note>;
  updateNote: (id: string, data: Partial<Pick<Note, 'title' | 'content' | 'isPinned'>>) => Promise<Note>;
  duplicateNote: (id: string, ownerId: string) => Promise<Note>;
  deleteNote: (id: string) => Promise<void>;
  searchNotes: (query: string, ownerId: string) => Promise<Note[]>;
  getNoteById: (id: string) => Note | undefined;
  setNoteShared: (id: string, isShared: boolean) => void;
}

export const useNotesStore = create<NotesStore>()(
  persist(
    (set, get) => ({
      notes: [],
      isLoading: false,
      error: null,
      sort: 'recently-updated',
      viewMode: 'grid',
      searchQuery: '',

      setSort: (sort) => set({ sort }),
      setViewMode: (viewMode) => set({ viewMode }),
      setSearch: (searchQuery) => set({ searchQuery }),

      fetchNotes: async (ownerId) => {
        set({ isLoading: true, error: null });
        try {
          const notes = await notesService.getNotes(ownerId, get().sort);
          set({ notes, isLoading: false });
        } catch (err) {
          set({ error: String(err), isLoading: false });
        }
      },

      createNote: async (ownerId) => {
        const note = await notesService.createNote(ownerId);
        set((s) => ({ notes: [note, ...s.notes] }));
        return note;
      },

      updateNote: async (id, data) => {
        const updated = await notesService.updateNote(id, data);
        set((s) => ({ notes: s.notes.map((n) => (n.id === id ? updated : n)) }));
        return updated;
      },

      duplicateNote: async (id, ownerId) => {
        const copy = await notesService.duplicateNote(id, ownerId);
        set((s) => ({ notes: [copy, ...s.notes] }));
        return copy;
      },

      deleteNote: async (id) => {
        await notesService.deleteNote(id);
        set((s) => ({ notes: s.notes.filter((n) => n.id !== id) }));
      },

      searchNotes: async (query, ownerId) => {
        return notesService.searchNotes(query, ownerId);
      },

      getNoteById: (id) => get().notes.find((n) => n.id === id),

      setNoteShared: (id, isShared) =>
        set((s) => ({
          notes: s.notes.map((n) => (n.id === id ? { ...n, isShared } : n)),
        })),
    }),
    {
      name: 'securenotes-v2-notes',
      partialize: (s) => ({ sort: s.sort, viewMode: s.viewMode }),
    }
  )
);
