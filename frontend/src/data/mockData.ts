import type { User } from '../types/user';
import type { Note, NoteActivity } from '../types/note';
import type { SharedUser, SharedWithMeEntry } from '../types/sharing';

// ─── Mock Users ──────────────────────────────────────────────────────────────

export const MOCK_USERS: Array<User & { password: string }> = [
  {
    id: 'user-001',
    name: 'Praveen Kumar',
    email: 'praveen@example.com',
    avatarInitials: 'PK',
    password: 'demo1234',
    createdAt: '2026-01-15T00:00:00Z',
  },
  {
    id: 'user-002',
    name: 'Alice Johnson',
    email: 'alice@example.com',
    avatarInitials: 'AJ',
    password: 'password',
    createdAt: '2026-02-01T00:00:00Z',
  },
  {
    id: 'user-003',
    name: 'Bob Smith',
    email: 'bob@example.com',
    avatarInitials: 'BS',
    password: 'password',
    createdAt: '2026-02-10T00:00:00Z',
  },
  {
    id: 'user-004',
    name: 'Sarah Lee',
    email: 'sarah@example.com',
    avatarInitials: 'SL',
    password: 'password',
    createdAt: '2026-03-01T00:00:00Z',
  },
];

// ─── Mock Notes ───────────────────────────────────────────────────────────────

export const INITIAL_MOCK_NOTES: Note[] = [
  {
    id: 'note-001',
    title: 'Machine Learning Project',
    content: `## Research Notes

The goal of this project is to build a simple image classification model using PyTorch.

### Architecture
- ResNet-18 backbone
- Transfer learning from ImageNet
- Fine-tune on custom dataset

### Dataset
- 5,000 images across 10 classes
- 80/10/10 train/val/test split
- Data augmentation: random flip, rotation, color jitter

### Training
- Learning rate: 1e-4
- Optimizer: AdamW
- Epochs: 30
- Batch size: 32

### Results so far
- Baseline accuracy: 62%
- After fine-tuning: 89.4%

### Next steps
1. Try a larger backbone (ResNet-50)
2. Add label smoothing
3. Experiment with cosine learning rate schedule`,
    ownerId: 'user-001',
    createdAt: '2026-09-01T10:00:00Z',
    updatedAt: '2026-09-22T14:30:00Z',
    isShared: true,
    isPinned: true,
    tags: ['ml', 'research', 'pytorch'],
    securityStatus: 'encrypted',
    wordCount: 142,
  },
  {
    id: 'note-002',
    title: 'Database Assignment',
    content: `## CS 4320 - Database Systems

### Assignment 3: Query Optimization

**Due:** October 5th

**Tasks:**
1. Implement a simple query optimizer in Python
2. Compare nested loop join vs hash join
3. Write a short report on your findings

**Resources:**
- Chapter 15 of the textbook
- Lecture slides from Week 7
- Piazza discussion threads

**Notes:**
The query plan estimator uses a simplified cost model:
- I/O cost dominates
- Assume uniform distribution
- Buffer pool size = 100 pages

**Status:** In progress — need to finish part 3`,
    ownerId: 'user-001',
    createdAt: '2026-09-10T14:00:00Z',
    updatedAt: '2026-09-21T09:00:00Z',
    isShared: false,
    isPinned: false,
    tags: ['cs', 'database', 'assignment'],
    securityStatus: 'encrypted',
    wordCount: 97,
  },
  {
    id: 'note-003',
    title: 'Portfolio Ideas',
    content: `## Personal Portfolio v2

### Projects to showcase
1. **SecureNotes** — End-to-end encrypted notes app (this project!)
2. **MLPipeline** — Automated ML training pipeline with experiment tracking
3. **Threadify** — Twitter-style short-form content platform
4. **Budget Tracker** — Personal finance app with categorization

### Design direction
- Clean, minimal aesthetic
- Focus on readability
- Dark mode first
- Fast load times — no JS frameworks for static pages

### Tech stack for portfolio site
- Astro (static site generator)
- Tailwind CSS
- Deployed on Vercel

### Copy ideas
"Building things that matter."
"Software engineer focused on privacy and performance."

### Timeline
- First draft: October 15
- Review: October 22
- Launch: November 1`,
    ownerId: 'user-001',
    createdAt: '2026-09-12T18:00:00Z',
    updatedAt: '2026-09-19T20:00:00Z',
    isShared: false,
    isPinned: false,
    tags: ['portfolio', 'career', 'design'],
    securityStatus: 'encrypted',
    wordCount: 118,
  },
  {
    id: 'note-004',
    title: 'Team Meeting Notes',
    content: `## Weekly Team Sync — Sep 22

**Attendees:** Praveen, Alice, Bob, Sarah

### Updates

**Praveen:**
- Finished frontend scaffold for SecureNotes
- Working on share modal this week
- Blocked on: design review for settings page

**Alice:**
- Backend API endpoints 90% done
- Auth middleware complete
- Need review on note sharing endpoint

**Bob:**
- Crypto research — evaluating libsodium vs WebCrypto
- Draft proposal for key derivation scheme
- Will share doc by EOW

**Sarah:**
- UX review complete
- Found 3 accessibility issues in sidebar
- Will file GitHub issues

### Action items
- [ ] Praveen: finish share modal by Thursday
- [ ] Alice: PR for sharing API by Wednesday
- [ ] Bob: share key derivation doc by Friday
- [ ] Sarah: file accessibility issues today`,
    ownerId: 'user-001',
    createdAt: '2026-09-22T09:00:00Z',
    updatedAt: '2026-09-22T10:30:00Z',
    isShared: true,
    isPinned: false,
    tags: ['meeting', 'team', 'work'],
    securityStatus: 'encrypted',
    wordCount: 138,
  },
  {
    id: 'note-005',
    title: 'Research Notes — Encryption Schemes',
    content: `## E2E Encryption Research

### Options Evaluated

#### 1. libsodium (recommended)
- Well-audited, battle-tested
- XChaCha20-Poly1305 for symmetric encryption
- X25519 for key exchange
- Bindings available for JS via libsodium.js
- Used by 1Password, Keybase

#### 2. Web Crypto API
- Native browser API
- No external dependencies
- Slightly more verbose API
- Less straightforward for key wrapping scenarios

#### 3. OpenPGP.js
- OpenPGP standard
- More complex key management
- Interoperable with desktop PGP

### Recommendation
Use libsodium.js for symmetric note encryption.
Use X25519 key exchange for secure key sharing.
Derive keys using Argon2id (via libsodium).

### Architecture sketch

\`\`\`
User passphrase
    ↓ Argon2id
User master key
    ↓ XChaCha20-Poly1305
Encrypted note key
    ↓ stored on server

Note content
    ↓ XChaCha20-Poly1305 (note key)
Encrypted note
    ↓ stored on server
\`\`\`

### Status
- [ ] Write cryptoService.ts implementation
- [ ] Integrate with notesService
- [ ] Write tests`,
    ownerId: 'user-001',
    createdAt: '2026-09-15T16:00:00Z',
    updatedAt: '2026-09-20T11:00:00Z',
    isShared: false,
    isPinned: true,
    tags: ['security', 'crypto', 'research'],
    securityStatus: 'encryption-ready',
    wordCount: 197,
  },
];

// ─── Mock Shared Users (per note) ─────────────────────────────────────────────

export const MOCK_SHARED_USERS: Record<string, SharedUser[]> = {
  'note-001': [
    {
      id: 'user-003',
      name: 'Bob Smith',
      email: 'bob@example.com',
      avatarInitials: 'BS',
      permission: 'edit',
      sharedAt: '2026-09-18T10:00:00Z',
    },
    {
      id: 'user-004',
      name: 'Sarah Lee',
      email: 'sarah@example.com',
      avatarInitials: 'SL',
      permission: 'view',
      sharedAt: '2026-09-19T14:00:00Z',
    },
  ],
  'note-004': [
    {
      id: 'user-002',
      name: 'Alice Johnson',
      email: 'alice@example.com',
      avatarInitials: 'AJ',
      permission: 'edit',
      sharedAt: '2026-09-22T09:00:00Z',
    },
    {
      id: 'user-003',
      name: 'Bob Smith',
      email: 'bob@example.com',
      avatarInitials: 'BS',
      permission: 'edit',
      sharedAt: '2026-09-22T09:00:00Z',
    },
    {
      id: 'user-004',
      name: 'Sarah Lee',
      email: 'sarah@example.com',
      avatarInitials: 'SL',
      permission: 'view',
      sharedAt: '2026-09-22T09:00:00Z',
    },
  ],
};

// ─── Mock Shared-With-Me ───────────────────────────────────────────────────────

export const MOCK_SHARED_WITH_ME: SharedWithMeEntry[] = [
  {
    note: {
      id: 'ext-note-001',
      title: 'Q4 Product Roadmap',
      content: `## Q4 2026 Roadmap

### SecureNotes priorities:
- [ ] Backend API complete
- [ ] Client-side encryption MVP
- [ ] Beta launch to 100 users
- [ ] Security audit
- [ ] Public launch`,
      ownerId: 'user-002',
      createdAt: '2026-09-20T10:00:00Z',
      updatedAt: '2026-09-22T08:00:00Z',
      isShared: true,
      isPinned: false,
      tags: ['product', 'roadmap'],
      securityStatus: 'encrypted',
      wordCount: 43,
    },
    sharedBy: {
      id: 'user-002',
      name: 'Alice Johnson',
      email: 'alice@example.com',
    },
    permission: 'edit',
    sharedAt: '2026-09-22T09:00:00Z',
  },
  {
    note: {
      id: 'ext-note-002',
      title: 'Crypto Library Comparison',
      content: `Comparing libsodium, WebCrypto, and noble-curves for our use case...`,
      ownerId: 'user-003',
      createdAt: '2026-09-18T12:00:00Z',
      updatedAt: '2026-09-21T16:00:00Z',
      isShared: true,
      isPinned: false,
      tags: ['research', 'security'],
      securityStatus: 'encrypted',
      wordCount: 12,
    },
    sharedBy: {
      id: 'user-003',
      name: 'Bob Smith',
      email: 'bob@example.com',
    },
    permission: 'view',
    sharedAt: '2026-09-21T16:00:00Z',
  },
];

// ─── Mock Activity ─────────────────────────────────────────────────────────────

export const MOCK_ACTIVITY: Record<string, NoteActivity[]> = {
  'note-001': [
    {
      id: 'act-001',
      noteId: 'note-001',
      userId: 'user-001',
      userEmail: 'praveen@example.com',
      action: 'created',
      timestamp: '2026-09-01T10:00:00Z',
    },
    {
      id: 'act-002',
      noteId: 'note-001',
      userId: 'user-001',
      userEmail: 'praveen@example.com',
      action: 'shared',
      timestamp: '2026-09-18T10:00:00Z',
    },
    {
      id: 'act-003',
      noteId: 'note-001',
      userId: 'user-003',
      userEmail: 'bob@example.com',
      action: 'viewed',
      timestamp: '2026-09-19T11:00:00Z',
    },
    {
      id: 'act-004',
      noteId: 'note-001',
      userId: 'user-001',
      userEmail: 'praveen@example.com',
      action: 'edited',
      timestamp: '2026-09-22T14:30:00Z',
    },
  ],
};

// ─── Searchable users (for sharing autocomplete) ─────────────────────────────

export const SEARCHABLE_USERS = MOCK_USERS.map(({ password: _pw, ...u }) => {
  void _pw;
  return u;
}).filter((u) => u.id !== 'user-001');
