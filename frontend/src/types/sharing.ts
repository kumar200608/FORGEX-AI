export type Permission = 'view' | 'edit';

export interface SharedUser {
  id: string;
  name: string;
  email: string;
  avatarInitials: string;
  permission: Permission;
  sharedAt: string;
}

export interface ShareInvite {
  noteId: string;
  email: string;
  permission: Permission;
}

export interface RevokeRequest {
  noteId: string;
  userId: string;
}

export interface SharedWithMeEntry {
  note: import('./note').Note;
  sharedBy: {
    id: string;
    name: string;
    email: string;
  };
  permission: Permission;
  sharedAt: string;
}
