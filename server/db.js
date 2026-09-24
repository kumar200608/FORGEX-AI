// Mongoose connection handling, kept in one place so `index.js` (boot) and
// `seed.js` (one-shot script) behave identically — including failing loudly
// instead of limping along with a half-open database.

import mongoose from 'mongoose'

// Human-readable names for mongoose.connection.readyState. The health endpoint
// reports these verbatim so "is the DB up?" is answerable without guessing.
const READY_STATES = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting',
  99: 'uninitialized',
}

/**
 * Read and validate MONGODB_URI.
 * Throws (rather than returning undefined) so callers cannot accidentally
 * connect to mongoose's default localhost:27017 and call it a success.
 */
export function getMongoUri(env = process.env) {
  const raw = env.MONGODB_URI
  if (typeof raw !== 'string' || raw.trim() === '') {
    throw new Error(
      'MONGODB_URI is not set. Copy .env.example to .env and point it at an ' +
        'Atlas cluster (mongodb+srv://…) or a local mongod (mongodb://127.0.0.1:27017/adaptive).'
    )
  }
  return raw.trim()
}

/** Current connection state as a stable string ("connected", "disconnected", …). */
export function dbState() {
  return READY_STATES[mongoose.connection.readyState] ?? 'unknown'
}

export function isConnected() {
  return mongoose.connection.readyState === 1
}

/**
 * Connect to MongoDB. Rejects on failure — callers decide whether that means
 * "exit non-zero" (index.js / seed.js) or "fail the test" (suites).
 */
export async function connect(uri = getMongoUri()) {
  mongoose.set('strictQuery', true)
  await mongoose.connect(uri, {
    // Fail in ~8s instead of the 30s default: a wrong URI should be obvious
    // immediately, not after a coffee break.
    serverSelectionTimeoutMS: 8000,
  })
  return mongoose.connection
}

/** Close the connection. Safe to call when already closed. */
export async function disconnect() {
  if (mongoose.connection.readyState !== 0) await mongoose.disconnect()
}

/** Strip credentials before a URI ever reaches a log line. */
export function redactUri(uri) {
  return String(uri).replace(/\/\/([^:@/]+):([^@/]+)@/, '//$1:***@')
}
