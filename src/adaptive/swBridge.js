// Service-worker bridge: registration, cache-hit stats polling, cache reset.
// Only registered in production builds so dev-server HMR stays clean.

let swReg = null

export function registerSW() {
  if (!('serviceWorker' in navigator)) return Promise.resolve(null)
  if (!import.meta.env.PROD) return Promise.resolve(null)
  return navigator.serviceWorker.register('/sw.js')
    .then((reg) => { swReg = reg; return reg })
    .catch(() => null)
}

function talkToSW(message, timeoutMs = 1500) {
  return new Promise((resolve) => {
    if (!navigator.serviceWorker || !navigator.serviceWorker.controller) return resolve(null)
    const channel = new MessageChannel()
    const timer = setTimeout(() => resolve(null), timeoutMs)
    channel.port1.onmessage = (e) => { clearTimeout(timer); resolve(e.data) }
    try {
      navigator.serviceWorker.controller.postMessage(message, [channel.port2])
    } catch { clearTimeout(timer); resolve(null) }
  })
}

export const getSWStats = () => talkToSW({ type: 'get-stats' })
export const resetSWStats = () => talkToSW({ type: 'reset-stats' })
export async function clearRuntimeCaches() {
  await talkToSW({ type: 'clear-runtime-caches' }, 3000)
  try {
    const names = await caches.keys()
    await Promise.all(names.filter((n) => n.startsWith('runtime-')).map((n) => caches.delete(n)))
  } catch { /* noop */ }
}
