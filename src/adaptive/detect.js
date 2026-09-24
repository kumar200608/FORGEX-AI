// Detection layer — reads every signal the web platform offers about the
// user's real conditions. No user prompt, no permission, no backend.

export function readNetwork() {
  const c = navigator.connection || navigator.mozConnection || navigator.webkitConnection || {}
  return {
    effectiveType: c.effectiveType || null,  // 'slow-2g' | '2g' | '3g' | '4g'
    downlink: typeof c.downlink === 'number' ? c.downlink : null,  // Mbps estimate
    rtt: typeof c.rtt === 'number' ? c.rtt : null,                 // ms round-trip estimate
    saveData: !!c.saveData,
  }
}

export function onNetworkChange(fn) {
  const c = navigator.connection || navigator.mozConnection || navigator.webkitConnection
  if (c && typeof c.addEventListener === 'function') {
    c.addEventListener('change', fn)
    return () => c.removeEventListener('change', fn)
  }
  return () => {}
}

export function readDevice() {
  // `navigator.deviceMemory` is Chromium-only; `navigator.hardwareConcurrency`
  // is widely implemented but Firefox's fingerprinting resistance reduces it
  // and some WebViews omit it. Either way, a missing value used to reach the
  // engine as null — and scoreDevice() scores "unknown" as the same constant
  // for every user, so the device half of the score stopped discriminating
  // between a phone and a workstation. Fill the gap with an estimate instead.
  const nativeMemory = typeof navigator.deviceMemory === 'number' ? navigator.deviceMemory : null
  const nativeCores = typeof navigator.hardwareConcurrency === 'number' ? navigator.hardwareConcurrency : null
  const deviceFallback = nativeMemory == null || nativeCores == null
  const est = deviceFallback ? estimateDevice() : null

  return {
    memoryGB: nativeMemory ?? (est ? est.memoryGB : null),
    cores: nativeCores ?? (est ? est.cores : null),
    deviceFallback,                                    // true ⇒ the two fields above are estimates
    viewportW: window.innerWidth,
    viewportH: window.innerHeight,
    coarsePointer: window.matchMedia('(pointer: coarse)').matches,
    reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  }
}

// ---------------------------------------------------------------------------
// Device-signal fallback (Firefox / Safari / WebKit, and any engine that omits
// the two APIs above).
//
// What it recovers: a coarse, monotonic device class — a phone still scores
// lower than a workstation, so the mode can still flip between LIGHT and FULL
// on device capability alone.
// What it does NOT recover: the real RAM figure or the real logical core count.
// These are estimates and must never be presented as measured (callers get
// `deviceFallback: true` and the dashboard/demo panel label them as such).
//
// Two cheap, synchronous inputs, both optional:
//   • physical framebuffer size (screen × devicePixelRatio²) — deterministic,
//     needs no calibration, cannot be blocked by anything;
//   • one short CPU timing sample — median of 3 × 1 ms loops, wide bands, and
//     it may move the estimate by at most one tier, so a noisy reading can
//     never dominate the deterministic signal.
// The combined result is memoised: readDevice() runs on every re-decision and
// must stay cheap.
// ---------------------------------------------------------------------------

// Tiers by physical pixels: 1366×768@1 ≈ 1.0 M … 3840×2160@1 ≈ 8.3 M.
const FALLBACK_TIERS = [
  { minPx: 6e6, memoryGB: 8, cores: 8 },   // 4K, or a high-DPI large panel
  { minPx: 3e6, memoryGB: 8, cores: 4 },   // 1440p, or a retina laptop
  { minPx: 1.5e6, memoryGB: 4, cores: 4 }, // 1080p laptop, or a phone panel
  { minPx: 0, memoryGB: 2, cores: 2 },     // small/old screen
]

// Deliberately wide bands around desktop-class V8 throughput on this loop
// (~5 k ops/ms idle). The point is "is there evidence of a throttled or tiny
// CPU", not a benchmark: a 6× DevTools CPU throttle lands below the slow band
// and drops one tier, which is exactly the demo we want to keep working on
// non-Chromium browsers.
const FAST_OPS_PER_MS = 20000
const SLOW_OPS_PER_MS = 1500

const clampTier = (i) => Math.min(FALLBACK_TIERS.length - 1, Math.max(0, i))

/**
 * Pure: turn fallback inputs into { memoryGB, cores }.
 * Exported so the estimate ladder can be tested without a browser.
 */
export function classifyFallbackDevice({ opsPerMs = 0, physicalPixels = 0, coarsePointer = false, touchPoints = 0, shortSide = 0 } = {}) {
  let tier = FALLBACK_TIERS.findIndex((t) => physicalPixels >= t.minPx)
  if (tier < 0) tier = FALLBACK_TIERS.length - 1

  if (opsPerMs >= FAST_OPS_PER_MS) tier -= 1        // evidence of a fast CPU
  else if (opsPerMs > 0 && opsPerMs < SLOW_OPS_PER_MS) tier += 1  // throttled / tiny CPU
  tier = clampTier(tier)

  const { memoryGB, cores } = FALLBACK_TIERS[tier]
  // A handheld is a handheld however many pixels it drives: mobile SoCs have
  // plenty of cores but a fraction of the per-core throughput.
  const handheld = coarsePointer && touchPoints > 0 && shortSide > 0 && shortSide <= 500
  return handheld
    ? { memoryGB: Math.min(memoryGB, 4), cores: Math.min(cores, 4) }
    : { memoryGB, cores }
}

// Median of 3 × 1 ms samples — sync, ~3 ms once per session, and the median
// keeps a single scheduler hiccup from deciding the tier.
function sampleOpsPerMs() {
  const samples = []
  for (let s = 0; s < 3; s++) {
    const t0 = performance.now()
    let acc = 0
    let n = 0
    while (performance.now() - t0 < 1) {
      for (let i = 0; i < 1000; i++) acc += Math.sqrt(i) * 1.000001
      n += 1000
    }
    const ms = Math.max(performance.now() - t0, 0.1)
    // `acc` is read so the loop cannot be optimised away.
    samples.push(n > 0 && acc > 0 ? n / ms : 0)
  }
  return samples.sort((a, b) => a - b)[1]
}

let deviceEstimate = null

function estimateDevice() {
  if (deviceEstimate) return deviceEstimate
  const dpr = window.devicePixelRatio || 1
  const screenW = (window.screen && window.screen.width) || window.innerWidth || 0
  const screenH = (window.screen && window.screen.height) || window.innerHeight || 0
  deviceEstimate = classifyFallbackDevice({
    opsPerMs: sampleOpsPerMs(),
    physicalPixels: screenW * screenH * dpr * dpr,
    coarsePointer: window.matchMedia('(pointer: coarse)').matches,
    touchPoints: navigator.maxTouchPoints || 0,
    shortSide: Math.min(screenW, screenH),
  })
  return deviceEstimate
}

// Active link probe: download an incompressible image with the cache bypassed
// and time it. Unlike the Network Information API (which reports the OS's
// last-known connection class and does NOT react to DevTools throttling),
// this measures the link as it is right now — which is what makes the
// "DevTools → Slow 3G" demo work.
export async function measureProbe(probeBytes) {
  const url = `/assets/probe.png?cb=${Date.now()}-${Math.random().toString(36).slice(2)}`
  const t0 = performance.now()
  try {
    const res = await fetch(url, { cache: 'no-store' })
    const buf = await res.arrayBuffer()
    const type = res.headers.get('content-type') || ''
    // A captive portal, error page, or SPA fallback can answer instead of the
    // image — that response says nothing about the link, so discard it.
    if (!res.ok || !type.includes('image/') || buf.byteLength < probeBytes * 0.5) {
      return { ok: false, error: `unexpected probe response (${buf.byteLength} B, ${type || 'no type'})`, at: Date.now() }
    }
    const ms = Math.max(performance.now() - t0, 1)
    const mbps = (buf.byteLength * 8) / (ms / 1000) / 1e6
    return { ok: true, ms: Math.round(ms), bytes: buf.byteLength, mbps, at: Date.now() }
  } catch (err) {
    return { ok: false, error: String(err && err.message || err), at: Date.now() }
  }
}
