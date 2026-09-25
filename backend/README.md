# WA-3 Backend

End-to-End Encrypted Notes Backend with Search and Revocable Sharing.
Built for a 24-hour hackathon.

## Security Architecture

The WA-3 backend is designed around a strict zero-knowledge, End-to-End Encrypted (E2EE) threat model. The server acts purely as a dumb datastore for encrypted metadata and ciphertexts.

- **Client-Side Encryption:** All notes are encrypted and decrypted on the client. The backend NEVER receives or stores plaintext note content, titles, or passwords.
- **Ciphertext Storage:** The server only stores the AES-GCM output (`ciphertext`, `iv`, `authTag`).
- **Blind-Index Search:** To enable search without revealing queries, the client computes an HMAC-SHA-256 of the normalized search terms. The backend matches these blind tokens (`blindIndex`) exactly.
- **Encrypted Key Envelopes:** When sharing notes, the note's symmetric key is encrypted with the recipient's public key (e.g., using RSA-OAEP). The backend routes these envelopes but cannot open them.
- **Access Revocation:** Revoking a user instantly destroys their backend `NoteAccess` relation and invalidates their key envelope, meaning they cannot fetch future updates. The client then handles cryptographic key rotation to lock them out of future edits.
- **Key Rotation/Versioning:** Fully supported via the `POST /api/notes/:id/rotate-key` endpoint, allowing the owner to bump the encryption key version and issue new envelopes to authorized peers.
- **Authentication & Rate Limiting:** JWT-based authentication combined with bcrypt hashing and strict `express-rate-limit` limits on login/registration endpoints to mitigate brute force attacks.
- **Database Compromise Scenario:** In the event of a total database breach, attackers would only acquire encrypted ciphertexts, blind HMAC tokens, and encrypted key envelopes. Without the clients' private keys or the HMAC secret (stored securely on the client), the note data remains entirely inaccessible.

### Post-Quantum Roadmap
The current architecture relies on standard elliptic-curve/RSA cryptography for public-key operations (key envelopes) and AES-256-GCM for symmetric encryption. In the future, the client-side cryptographic layer could be upgraded to post-quantum algorithms (e.g., Kyber for key encapsulation) without requiring structural changes to this backend. The backend simply stores larger `encryptedNoteKey` strings.

## Setup Instructions

### Prerequisites
- Node.js (v18+)
- PostgreSQL database

### Environment Variables
Create a `.env` file from `.env.example`:
```
DATABASE_URL="postgresql://username:password@localhost:5432/wa3_db?schema=public"
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN="1d"
FRONTEND_URL="http://localhost:3000"
PORT=3000
NODE_ENV="development"
```

### Installation
```bash
npm install
```

### Database Setup
Ensure PostgreSQL is running and the database exists. Then run:
```bash
npx prisma generate
npx prisma migrate dev --name init
```

### Starting the Server
```bash
npm run dev
```

## API Documentation
Once the server is running, visit `http://localhost:3000/api-docs` for full OpenAPI/Swagger documentation of all endpoints.
