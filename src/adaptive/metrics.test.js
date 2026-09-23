// @vitest-environment jsdom
//
// metrics.js is the measurement core, and it had no test at all - which is how a
// snapshot() that referenced an undefined identifier shipped and left every page
// blank while the suite stayed green. These tests exist to close that hole.

import { describe, it, expect, beforeEach, vi } from 'vitest'

const observers = new Map()
const buffered = []

class FakePerformanceObserver {
  constructor(callback) { this.callback = callback }
  observe({ type }) { observers.set(type, this.callback) }
}

globalThis.PerformanceObserver = FakePerformanceObserver
vi.stubGlobal('PerformanceObserver', FakePerformanceObserver)

Object.defineProperty(performance, 'getEntriesByType', {
  value: () => buffered,
  configurable: true,
})

globalThis.fetch = async (url) => {
  const href = String(url)
  if (href.includes('products/manifest.json')) {
    return {
      json: async () => ({
        formats: ['avif', 'webp', 'jpg'],
        products: {
          'aurora-lamp': {
            avif: { low: 6, mid: 12, high: 24 },
            webp: { low: 8, mid: 16, high: 32 },
            jpg: { low: 10, mid: 20, high: 40 },
          },
        },
      }),
    }
  }
  if (href.includes('adaptive-build-manifest.json')) {
    return { json: async () => ({ chunks: { 'index-abc.js': 1000, 'heavy-video-abc.js': 500 } }) }
  }
  throw new Error(`unexpected fetch: ${href}`)
}

/** Drive the resource observer the way the browser would. */
function emitResource(entry) {
  const callback = observers.get('resource')
  if (!callback) throw new Error('the resource observer was never registered')
  callback({ getEntries: () => [entry] })
}

let metrics

beforeEach(async () => {
  observers.clear()
  buffered.length = 0
  vi.resetModules()
  metrics = await import('./metrics.js')
  metrics.initMetrics()
  // let the two manifest fetches resolve
  await new Promise((resolve) => setTimeout(resolve, 0))
})

describe('metrics snapshot', () => {
  it('can be taken before anything has loaded', async () => {
    // The regression: this used to throw, and because the provider reads a
    // snapshot during its first render, the whole app rendered blank.
    vi.resetModules()
    const fresh = await import('./metrics.js')
    expect(() => fresh.snapshot()).not.toThrow()
    expect(fresh.snapshot().requests).toBe(0)
    expect(fresh.snapshot().jsChunksBaseline).toBe(0)
  })

  it('counts payload bytes, network bytes and requests for every resource', () => {
    emitResource({ name: '/index.html', initiatorType: 'navigation', decodedBodySize: 5000, transferSize: 1200, encodedBodySize: 4000 })
    const snap = metrics.snapshot()
    expect(snap.transferKB).toBeCloseTo(5000 / 1024, 6)
    expect(snap.networkKB).toBeCloseTo(1200 / 1024, 6)
    expect(snap.requests).toBe(1)
  })

  it('separates a cache hit (nothing on the wire) from the payload size', () => {
    emitResource({ name: '/assets/index-abc.js', initiatorType: 'script', decodedBodySize: 1024, transferSize: 0, encodedBodySize: 1024 })
    const snap = metrics.snapshot()
    expect(snap.networkKB).toBe(0)          // served from cache
    expect(snap.transferKB).toBeCloseTo(1, 6)
  })

  it('accounts a product image against its high-tier baseline', () => {
    emitResource({ name: '/assets/products/aurora-lamp-mid.jpg', initiatorType: 'img', decodedBodySize: 20, transferSize: 20 })
    const snap = metrics.snapshot()
    expect(snap.imageCount).toBe(1)
    expect(snap.imageKB).toBeCloseTo(20 / 1024, 6)
    expect(snap.imageBaselineKB).toBeCloseTo(40 / 1024, 6)
    expect(snap.imageSavedPct).toBeCloseTo(0.5, 6)
  })

  it('baselines an avif image against the avif high tier, not the jpeg one', () => {
    // Like for like: what a non-adaptive delivery would have sent this browser
    // is the same format at the top tier.
    emitResource({ name: '/assets/products/aurora-lamp-mid.avif', initiatorType: 'img', decodedBodySize: 12, transferSize: 12 })
    const snap = metrics.snapshot()
    expect(snap.imageBaselineKB).toBeCloseTo(24 / 1024, 6)
    expect(snap.imageSavedPct).toBeCloseTo(0.5, 6)
  })

  it('does not invent a baseline for a product the manifest does not price', () => {
    emitResource({ name: '/assets/products/not-in-catalogue-mid.avif', initiatorType: 'img', decodedBodySize: 12, transferSize: 12 })
    const snap = metrics.snapshot()
    expect(snap.imageKB).toBeCloseTo(12 / 1024, 6)
    expect(snap.imageBaselineKB).toBe(0)
    expect(snap.imageSavedPct).toBeNull()
  })

  it('counts JS chunks, flags the heavy ones, and knows the full-delivery total', () => {
    emitResource({ name: '/assets/index-abc.js', initiatorType: 'script', decodedBodySize: 1000, transferSize: 1000 })
    emitResource({ name: '/assets/heavy-video-abc.js', initiatorType: 'script', decodedBodySize: 500, transferSize: 500 })
    const snap = metrics.snapshot()
    expect(snap.jsChunks).toBe(2)
    expect(snap.heavyLoaded).toEqual(['heavy-video-abc.js'])
    expect(snap.jsChunksBaseline).toBe(2)     // the build manifest lists two chunks
    expect(snap.jsBaselineKB).toBeCloseTo(1500 / 1024, 6)
  })

  it('counts each URL once, however many observers report it', () => {
    const entry = { name: '/index.html', initiatorType: 'navigation', decodedBodySize: 100, transferSize: 100 }
    emitResource(entry)
    emitResource(entry)
    expect(metrics.snapshot().requests).toBe(1)
  })

  it('reports the skip-a-chunk saving, so the comparison can count requests', () => {
    // Only the core chunk loads; heavy-video is skipped.
    emitResource({ name: '/assets/index-abc.js', initiatorType: 'script', decodedBodySize: 1000, transferSize: 1000 })
    const snap = metrics.snapshot()
    expect(snap.jsChunksBaseline - snap.jsChunks).toBe(1)
  })
})

describe('metrics subscription', () => {

  it('still understands a flat manifest, the older shape', async () => {
    // A manifest from before the format split must degrade to a JPEG baseline
    // rather than silently reporting a 0-byte baseline everywhere.
    // Swap the manifest response temporarily; restore it so the other tests in
    // this file keep the format-aware manifest.
    const originalFetch = globalThis.fetch
    globalThis.fetch = async (url) => {
      const href = String(url)
      if (href.includes('products/manifest.json')) {
        return { json: async () => ({ products: { 'aurora-lamp': { low: 10, mid: 20, high: 40 } } }) }
      }
      if (href.includes('adaptive-build-manifest.json')) {
        return { json: async () => ({ chunks: { 'index-abc.js': 1000 } }) }
      }
      throw new Error(`unexpected fetch: ${href}`)
    }
    vi.resetModules()
    const legacy = await import('./metrics.js')
    legacy.initMetrics()
    await new Promise((resolve) => setTimeout(resolve, 0))

    emitResource({ name: '/assets/products/aurora-lamp-mid.jpg', initiatorType: 'img', decodedBodySize: 20, transferSize: 20 })
    expect(legacy.snapshot().imageBaselineKB).toBeCloseTo(40 / 1024, 6)
    globalThis.fetch = originalFetch
  })
  it('pushes a snapshot to subscribers and stops after unsubscribe', () => {
    const seen = []
    const off = metrics.onMetrics((snap) => seen.push(snap))
    expect(seen).toHaveLength(1)             // immediate first value
    off()
    emitResource({ name: '/late.js', initiatorType: 'script', decodedBodySize: 10, transferSize: 10 })
    expect(seen).toHaveLength(1)
  })
})
