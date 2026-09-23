// ============================================================
// FieldSync Service Worker Extension: sw-custom.js
//
// Handles:
// 1. One-Shot Background Sync ('sync' event - fieldsync-pending-ops)
// 2. Periodic Background Sync ('periodicsync' event - fieldsync-periodic-sync)
// 3. Client communication for offline-first replication
// ============================================================

self.addEventListener('install', () => {
  // Activate immediately without waiting for existing clients to close
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Broadcast a sync trigger to all open window clients
async function notifyClients(tag) {
  try {
    const windowClients = await self.clients.matchAll({
      type: 'window',
      includeUncontrolled: true,
    });

    if (windowClients && windowClients.length > 0) {
      for (const client of windowClients) {
        client.postMessage({
          type: 'BACKGROUND_SYNC_TRIGGERED',
          tag,
          timestamp: Date.now(),
        });
      }
    }
  } catch (err) {
    console.warn('[SW-Custom] Failed to notify clients of background sync:', err);
  }
}

// ── One-shot Background Sync (Android TWA / PWA)
// Fired by the OS when network connectivity returns even if the app was backgrounded
self.addEventListener('sync', (event) => {
  if (
    event.tag === 'fieldsync-pending-ops' ||
    event.tag === 'fieldsync-sync' ||
    event.tag === 'fieldsync-media'
  ) {
    event.waitUntil(notifyClients(event.tag));
  }
});

// ── Periodic Background Sync (Android TWA / PWA)
// Fired periodically by Android OS (e.g. every 15-60 min on Wi-Fi/unmetered network)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'fieldsync-periodic-sync') {
    event.waitUntil(notifyClients(event.tag));
  }
});

// ── Client messages
self.addEventListener('message', (event) => {
  if (!event.data) return;
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
