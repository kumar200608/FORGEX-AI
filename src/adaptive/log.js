// Adaptive event log — every decision the engine makes is recorded here and
// surfaced live in the performance dashboard. Recent events are persisted to
// IndexedDB (the deck's storage stack: Cache API + IndexedDB).

const listeners = new Set()
const events = []
const MAX_EVENTS = 250

const DB_NAME = 'adaptive-web'
const STORE = 'events'
let dbPromise = null

function openDB() {
  if (dbPromise !== null) return dbPromise
  dbPromise = new Promise((resolve) => {
    try {
      if (!('indexedDB' in window)) return resolve(null)
      const req = indexedDB.open(DB_NAME, 1)
      req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: 'id' })
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => resolve(null)
    } catch { resolve(null) }
  })
  return dbPromise
}

async function persistEvent(e) {
  const db = await openDB()
  if (!db) return
  try {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).put(e)
  } catch { /* private mode etc. — logging is best-effort */ }
}

export async function loadPastEvents(limit = 30) {
  const db = await openDB()
  if (!db) return []
  return new Promise((resolve) => {
    try {
      const out = []
      const req = db.transaction(STORE, 'readonly').objectStore(STORE).openCursor(null, 'prev')
      req.onsuccess = () => {
        const cur = req.result
        if (cur && out.length < limit) { out.push(cur.value); cur.continue() }
        else resolve(out)
      }
      req.onerror = () => resolve(out)
    } catch { resolve([]) }
  })
}

export async function clearPastEvents() {
  const db = await openDB()
  if (!db) return
  try { db.transaction(STORE, 'readwrite').objectStore(STORE).clear() } catch { /* noop */ }
}

export function onLog(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function logEvent(type, detail, mode = null) {
  const e = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    ts: Date.now(),
    type,            // 'boot' | 'probe' | 'decision' | 'mode-change' | 'image' | 'chunk' | 'prefetch' | 'override' | 'offline'
    detail,
    mode,
  }
  events.unshift(e)
  if (events.length > MAX_EVENTS) events.length = MAX_EVENTS
  listeners.forEach((fn) => { try { fn(e) } catch { /* noop */ } })
  persistEvent(e)
  return e
}
