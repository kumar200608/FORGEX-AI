// Adaptive Web service worker — offline support + the cache the adaptive
// engine delivers through.
//
// Strategy:
//   navigation requests  → network-first, fall back to the cached app shell
//   probe requests       → always network (they ARE the measurement)
//   everything else GET  → cache-first, populate the runtime cache on miss

const VERSION = 'v1'
const SHELL_CACHE = `shell-${VERSION}`
const RUNTIME_CACHE = `runtime-${VERSION}`
const RUNTIME_LIMIT = 300

const SHELL_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable-512.png',
  '/assets/products/manifest.json',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE)
      .then((cache) => Promise.allSettled(SHELL_ASSETS.map((a) => cache.add(a))))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => ![SHELL_CACHE, RUNTIME_CACHE].includes(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

// `requests` counts only requests that could be served from the cache — it is
// the denominator of the dashboard's CACHE HIT ratio. Probes are deliberately
// never cacheable (they ARE the measurement), so counting them here would
// understate the real hit ratio on every re-decision. They get their own
// counter instead.
const EMPTY_STATS = { requests: 0, hits: 0, probes: 0 }
const stats = { ...EMPTY_STATS }

// Service workers are terminated after ~30 s idle, so in-memory counters die
// with them. Counters live in IndexedDB; memory is the working copy.
const STATS_DB = 'adaptive-sw-stats'
function idbOpen() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(STATS_DB, 1)
    req.onupgradeneeded = () => req.result.createObjectStore('counters')
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}
async function loadStats() {
  try {
    const db = await idbOpen()
    return await new Promise((resolve) => {
      const rq = db.transaction('counters').objectStore('counters').get('v1')
      rq.onsuccess = () => resolve({ ...EMPTY_STATS, ...(rq.result || {}) })
      rq.onerror = () => resolve({ ...EMPTY_STATS })
    })
  } catch { return { ...EMPTY_STATS } }
}
let saveQueued = false
function saveStats() {
  if (saveQueued) return
  saveQueued = true
  setTimeout(async () => {
    saveQueued = false
    try {
      const db = await idbOpen()
      db.transaction('counters', 'readwrite').objectStore('counters').put({ ...stats }, 'v1')
    } catch { /* best-effort */ }
  }, 300)
}
loadStats().then((s) => { Object.assign(stats, s) })

async function trimRuntimeCache() {
  const cache = await caches.open(RUNTIME_CACHE)
  const keys = await cache.keys()
  if (keys.length <= RUNTIME_LIMIT) return
  for (const key of keys.slice(0, keys.length - RUNTIME_LIMIT)) await cache.delete(key)
}

async function handleFetch(event) {
  const request = event.request
  if (request.method !== 'GET') return fetch(request)
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return fetch(request)

  // The probe must always measure the real network — never serve it from cache.
  // Counted separately so it cannot dilute the hit ratio (see `stats` above).
  if (url.pathname.startsWith('/assets/probe')) {
    stats.probes += 1
    saveStats()
    return fetch(request)
  }

  stats.requests += 1
  saveStats()

  if (request.mode === 'navigate') {
    try {
      const fresh = await fetch(request)
      return fresh
    } catch {
      const cache = await caches.open(SHELL_CACHE)
      const cached = (await cache.match('/index.html')) || (await cache.match('/'))
      if (cached) { stats.hits += 1; saveStats(); return cached }
      return new Response('<h1>Offline</h1>', { headers: { 'Content-Type': 'text/html' }, status: 504 })
    }
  }

  const cache = await caches.open(RUNTIME_CACHE)
  const cached = (await cache.match(request)) || (await caches.match(request))
  if (cached) { stats.hits += 1; saveStats(); return cached }

  try {
    const fresh = await fetch(request)
    if (fresh && fresh.ok && fresh.type === 'basic') {
      cache.put(request, fresh.clone()).then(trimRuntimeCache)
    }
    return fresh
  } catch {
    const shell = await caches.open(SHELL_CACHE)
    const fallback = await shell.match(request)
    if (fallback) { stats.hits += 1; saveStats(); return fallback }
    return new Response('', { status: 504, statusText: 'Offline' })
  }
}

self.addEventListener('fetch', (event) => {
  if (event.request.url.startsWith('chrome-extension')) return
  event.respondWith(handleFetch(event))
})

self.addEventListener('message', (event) => {
  const { type } = event.data || {}
  const port = event.ports && event.ports[0]
  if (type === 'get-stats' && port) {
    event.waitUntil(
      loadStats().then((persisted) => {
        // memory holds the live session; persisted may be newer after a restart
        if (persisted.requests > stats.requests) stats.requests = persisted.requests
        if (persisted.hits > stats.hits) stats.hits = persisted.hits
        if (persisted.probes > stats.probes) stats.probes = persisted.probes
        saveStats()
        port.postMessage({ requests: stats.requests, hits: stats.hits, probes: stats.probes })
      })
    )
  } else if (type === 'reset-stats' && port) {
    Object.assign(stats, EMPTY_STATS)
    event.waitUntil(
      idbOpen()
        .then((db) => { db.transaction('counters', 'readwrite').objectStore('counters').put({ ...EMPTY_STATS }, 'v1') })
        .then(() => port.postMessage({ ok: true }))
        .catch(() => port.postMessage({ ok: true }))
    )
  } else if (type === 'clear-runtime-caches' && port) {
    event.waitUntil(
      caches.delete(RUNTIME_CACHE).then(() => {
        Object.assign(stats, EMPTY_STATS)
        if (port) port.postMessage({ ok: true })
      })
    )
  }
})
