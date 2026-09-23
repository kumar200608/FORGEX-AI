export type NoteSecurityStatus =
  | 'unencrypted'
  | 'encryption-ready'
  | 'encrypted';

export type SortOption =
  | 'recently-updated'
  | 'recently-created'
  | 'alphabetical';

export type ViewMode = 'grid' | 'list';

export interface Note {
  id: string;
  title: string;
  content: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  isShared: boolean;
  isPinned: boolean;
  tags: string[];
  securityStatus: NoteSecurityStatus;
  wordCount: number;
  myRole?: 'owner' | 'edit' | 'view';
  isOwner?: boolean;
  owner?: {
    id: string;
    name?: string;
    email: string;
  };
}

export interface NoteActivity {
  id: string;
  noteId: string;
  userId: string;
  userEmail: string;
  action: 'created' | 'edited' | 'viewed' | 'shared' | 'access-removed';
  timestamp: string;
}
