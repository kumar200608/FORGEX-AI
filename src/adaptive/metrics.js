// The app measures itself. Every byte that arrives, every paint, every cache
// hit is folded into a live snapshot the dashboard renders. This is what turns
// the deck's claims into a readout - nothing on the dashboard is an estimate.

let productSizes = {}        // { '<id>': { low, mid, high } } bytes
let buildManifest = null     // { chunks: { '<file>.js': bytes } }
let jsBaselineBytes = 0      // everything a FULL delivery would load
let jsBaselineChunks = 0
let heavyBytes = 0

const HEAVY_RE = /^heavy-(motion|video|zoom)-/
const JS_RE = /\.js($|\?)/
const IMG_RE = /\/assets\/products\/(.+)-(low|mid|high)\.(avif|webp|jpg)/

const state = {
  fcp: null,
  lcp: null,
  jsBytes: 0,           // decoded bytes of JS actually loaded
  jsChunks: 0,
  heavyLoaded: [],
  imageBytes: 0,        // bytes of product images actually loaded
  imageCount: 0,
  imageBaseline: 0,     // what those same products cost at 'high' tier
  payloadBytes: 0,      // decoded bytes of *everything* that loaded
  networkBytes: 0,      // what actually crossed the network (transferSize)
  resourceCount: 0,     // one per resource entry, images and scripts included
}

// per-URL image accounting, so baselines can be recomputed once the size
// manifest arrives (early entries land before the fetch resolves)
const imageLoads = new Map()

const subscribers = new Set()
let throttleTimer = null

// Paint metrics follow web-vitals semantics: a page loaded while hidden
// defers its paint (timestamps are then meaningless), and LCP stops at the
// first user input. Both cases report "—" instead of a misleading number.
let pageWasHidden = document.hidden
let lcpStopped = false
function initPaintGuards() {
  document.addEventListener('visibilitychange', () => { if (document.hidden) pageWasHidden = true })
  const stop = () => { lcpStopped = true }
  window.addEventListener('click', stop, { once: true, capture: true })
  window.addEventListener('keydown', stop, { once: true, capture: true })
}

export function initMetrics() {
  initPaintGuards()

  // Painting + LCP timing.
  try {
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === 'first-contentful-paint' && !pageWasHidden && state.fcp == null) {
          state.fcp = entry.startTime / 1000
        }
      }
      notify()
    }).observe({ type: 'paint', buffered: true })
  } catch { /* older engines */ }
  try {
    new PerformanceObserver((list) => {
      if (lcpStopped || pageWasHidden) return
      const entries = list.getEntries()
      if (entries.length) { state.lcp = entries[entries.length - 1].startTime / 1000; notify() }
    }).observe({ type: 'largest-contentful-paint', buffered: true })
  } catch { /* not supported */ }

  // Resource accounting. Buffered so late subscribers still see the boot load.
  try {
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) accountResource(entry)
      notify()
    }).observe({ type: 'resource', buffered: true })
  } catch { /* not supported */ }

  // Boot-time reference data.
  fetch('/assets/products/manifest.json')
    .then((r) => r.json())
    .then((m) => {
      productSizes = m.products || {}
      recomputeImageStats()
      notify()
    })
    .catch(() => {})
  fetch('/adaptive-build-manifest.json')
    .then((r) => r.json())
    .then((m) => {
      buildManifest = m.chunks || {}
      const entries = Object.entries(buildManifest)
      jsBaselineBytes = entries
        .filter(([file]) => !HEAVY_RE.test(file))
        .reduce((sum, [, bytes]) => sum + bytes, 0)
      jsBaselineChunks = entries.length
      heavyBytes = entries
        .filter(([file]) => HEAVY_RE.test(file))
        .reduce((sum, [, bytes]) => sum + bytes, 0)
      // Chunks already loaded before the manifest arrived.
      for (const entry of performance.getEntriesByType('resource')) accountResource(entry)
      notify()
    })
    .catch(() => {})
}

const countedResources = new Set()

function accountResource(entry) {
  const name = entry.name
  // The observer buffer and getEntriesByType() can hand us separate entry
  // objects for the same load - dedupe on URL, not object identity.
  if (countedResources.has(name)) return
  countedResources.add(name)
  const path = (() => { try { return new URL(name, location.href).pathname } catch { return name } })()

  // Two different questions, two different numbers:
  //   payloadBytes - decoded size, comparable with the manifest sizes and with
  //                  what a FULL delivery would have cost;
  //   networkBytes - transferSize, what actually crossed the wire. This is 0 for
  //                  a service-worker cache hit, which is the point.
  state.payloadBytes += entry.decodedBodySize || entry.encodedBodySize || entry.transferSize || 0
  state.networkBytes += entry.transferSize || 0
  state.resourceCount += 1

  const imgMatch = path.match(IMG_RE)
  if (imgMatch) {
    const [, id, tier, format] = imgMatch
    imageLoads.set(path, { id, tier, format, bytes: bytesOf(entry, () => sizeOf(id, format, tier)) })
    recomputeImageStats()
    return
  }
  if (JS_RE.test(path) && entry.initiatorType !== 'link') {
    const file = path.split('/').pop()
    state.jsChunks += 1
    state.jsBytes += bytesOf(entry, () => (buildManifest || {})[file] || 0)
    if (HEAVY_RE.test(file) && !state.heavyLoaded.includes(file)) state.heavyLoaded.push(file)
    return
  }
}

/**
 * Manifest lookup. The manifest nests sizes per format:
 *   { '<id>': { avif: { low, mid, high }, webp: {...}, jpg: {...} } }
 * A flat { low, mid, high } (the older shape) is still understood, so a stale
 * manifest degrades to a JPEG baseline instead of silently reporting 0.
 */
function sizeOf(id, format, tier) {
  const entry = (productSizes[id] || {})[format]
  if (entry && typeof entry === 'object') return entry[tier] || 0
  return format === 'jpg' ? ((productSizes[id] || {})[tier] || 0) : 0
}

function recomputeImageStats() {
  let bytes = 0
  let baseline = 0
  for (const { id, format, bytes: b } of imageLoads.values()) {
    bytes += b
    // Like for like: the same format at the top tier, which is what a
    // non-adaptive delivery would have sent to this browser.
    baseline += sizeOf(id, format, 'high')
  }
  state.imageCount = imageLoads.size
  state.imageBytes = bytes
  state.imageBaseline = baseline
}

function bytesOf(entry, fallback) {
  return entry.decodedBodySize || entry.encodedBodySize || entry.transferSize || fallback() || 0
}

export function setSWStats(stats) {
  if (!stats) return
  state.cacheHits = stats.hits || 0
  state.swRequests = stats.requests || 0
  notify()
}

export function snapshot() {
  const jsTotalBaseline = jsBaselineBytes + heavyBytes
  const payloadBaseline = state.imageBaseline + jsTotalBaseline
  const payloadActual = state.imageBytes + state.jsBytes
  return {
    fcp: state.fcp,
    lcp: state.lcp,
    jsKB: state.jsBytes / 1024,
    jsChunks: state.jsChunks,
    // How many chunks a full delivery would have fetched, so the comparison can
    // count the ones this session skipped.
    jsChunksBaseline: jsBaselineChunks,
    heavyLoaded: [...state.heavyLoaded],
    jsBaselineKB: jsTotalBaseline / 1024,
    imageKB: state.imageBytes / 1024,
    imageCount: state.imageCount,
    imageBaselineKB: state.imageBaseline / 1024,
    imageSavedPct: state.imageBaseline > 0 ? 1 - state.imageBytes / state.imageBaseline : null,
    dataSavedPct: payloadBaseline > 0 ? 1 - payloadActual / payloadBaseline : null,
    // Everything that loaded, and what of it actually crossed the wire.
    transferKB: state.payloadBytes / 1024,
    networkKB: state.networkBytes / 1024,
    requests: state.resourceCount,
    cacheHits: state.cacheHits || 0,
    swRequests: state.swRequests || 0,
    cacheHitPct: state.swRequests > 0 ? (state.cacheHits || 0) / state.swRequests : null,
  }
}

function notify() {
  if (throttleTimer) return
  throttleTimer = setTimeout(() => {
    throttleTimer = null
    const snap = snapshot()
    subscribers.forEach((fn) => { try { fn(snap) } catch { /* noop */ } })
  }, 250)
}

export function onMetrics(fn) {
  subscribers.add(fn)
  fn(snapshot())
  return () => subscribers.delete(fn)
}
