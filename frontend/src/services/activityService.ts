import type { NoteActivity } from '../types';
import { MOCK_ACTIVITY } from '../data/mockData';

const delay = (ms = 400) => new Promise((r) => setTimeout(r, ms));

let store: Record<string, NoteActivity[]> = { ...MOCK_ACTIVITY };

/**
 * Get activity log for a note. MOCKED.
 */
export async function getNoteActivity(noteId: string): Promise<NoteActivity[]> {
  await delay();
  return store[noteId] ?? [];
}

/**
 * Record an activity event. MOCKED.
 */
export function recordActivity(
  noteId: string,
  event: Omit<NoteActivity, 'id' | 'noteId' | 'timestamp'>
): void {
  const entry: NoteActivity = {
    id: `act-${Date.now()}`,
    noteId,
    timestamp: new Date().toISOString(),
    ...event,
  };
  store = {
    ...store,
    [noteId]: [entry, ...(store[noteId] ?? [])],
  };
}
