import { createContext, useContext, useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { decide, MODES, BUDGETS } from './engine.js'
import { readNetwork, readDevice, onNetworkChange, measureProbe } from './detect.js'
import { logEvent, onLog, loadPastEvents, clearPastEvents } from './log.js'
import { initMetrics, onMetrics, snapshot, setSWStats } from './metrics.js'
import { registerSW, getSWStats, resetSWStats, clearRuntimeCaches } from './swBridge.js'
import { prefetchImages, resetPrefetchState } from './prefetch.js'
import { PRODUCTS, productImage, bestImageFormat } from '../data/products.js'
import { createPredictor } from './predict.js'

const AdaptiveContext = createContext(null)
export const useAdaptive = () => useContext(AdaptiveContext)

const OVERRIDE_KEY = 'adaptive-overrides'
const loadOverrides = () => {
  try { return JSON.parse(sessionStorage.getItem(OVERRIDE_KEY)) || {} } catch { return {} }
}

const MODE_CLASS = {
  [MODES.FULL]: 'mode-full',
  [MODES.LIGHT]: 'mode-light',
  [MODES.DATA_SAVER]: 'mode-saver',
  [MODES.OFFLINE]: 'mode-offline',
}

export function AdaptiveProvider({ children }) {
  const [online, setOnline] = useState(navigator.onLine)
  const [overrides, setOverridesState] = useState(loadOverrides)
  const [probe, setProbe] = useState(null)
  const [events, setEvents] = useState([])
  const [metrics, setMetrics] = useState(snapshot())
  const [swStats, setSWStatsState] = useState(null)
  // Demo switches. "Normal" bypasses the engine entirely so a judge can watch
  // the same page deliver the non-adaptive payload; pre-emption lets the
  // predictor act before the link actually degrades.
  const [normalMode, setNormalModeState] = useState(false)
  const [preemptive, setPreemptiveState] = useState(true)
  const [prediction, setPrediction] = useState(() => ({ ready: false, state: null, confidence: 0, basis: [], samples: 0 }))
  const normalModeRef = useRef(false)
  const preemptiveRef = useRef(true)
  const predictorRef = useRef(createPredictor())

  const [decision, setDecision] = useState(() => decide({
    online: navigator.onLine, network: readNetwork(), device: readDevice(),
    probe: null, overrides: loadOverrides(), previousBudget: null,
  }))

  // latest-value refs so callbacks never fire on stale state
  const decisionRef = useRef(decision)
  const overridesRef = useRef(overrides)
  const probeRef = useRef(null)
  const recomputeRef = useRef(null)
  overridesRef.current = overrides

  /**
   * Post-process a decision: apply the demo switches, feed the predictor, and
   * let a confident prediction pre-empt the link rather than follow it.
   */
  function finish(base, why) {
    const net = readNetwork()
    const reading = {
      // The probe is ground truth when it succeeded; downlink is the fallback.
      mbps: probeRef.current?.ok ? probeRef.current.mbps : (net.downlink ?? null),
      rtt: net.rtt ?? null,
    }
    const p = predictorRef.current.push(reading)
    setPrediction(p)

    if (normalModeRef.current) {
      applyDecision({ ...base, mode: MODES.FULL, budget: { ...BUDGETS[MODES.FULL] }, forcedNormal: true }, why)
      return
    }

    const probeConfirmsFastLink = probeRef.current?.ok && probeRef.current.mbps >= 5
    if (
      preemptiveRef.current &&
      p.ready &&
      p.state === 'slow' &&
      p.confidence >= 0.65 &&
      base.mode === MODES.FULL &&
      !probeConfirmsFastLink
    ) {
      const message = `predicted a slow link (${Math.round(p.confidence * 100)}% confidence, ${p.samples} samples) - pre-adapting to LIGHT before the first slow request`
      applyDecision({ ...base, mode: MODES.LIGHT, budget: { ...BUDGETS[MODES.LIGHT] }, predicted: p.state, predictedConfidence: p.confidence }, why)
      logEvent('predict', message, MODES.LIGHT)
      return
    }

    applyDecision(base, why)
  }

  const setNormalMode = useCallback((value) => {
    normalModeRef.current = !!value
    setNormalModeState(!!value)
    logEvent('override', value ? 'normal mode ON - adaptation bypassed, delivery pinned to FULL' : 'normal mode OFF - adaptive delivery resumed')
    setTimeout(() => recomputeRef.current('force', { withProbe: true }), 0)
  }, [])

  const setPreemptive = useCallback((value) => {
    preemptiveRef.current = !!value
    setPreemptiveState(!!value)
    logEvent('predict', value ? 'pre-emptive adaptation enabled' : 'pre-emptive adaptation disabled - the engine will follow the link instead of anticipating it')
  }, [])

  function applyDecision(next, why) {
    const prev = decisionRef.current
    decisionRef.current = next
    setDecision(next)
    if (prev && prev.mode !== next.mode) {
      logEvent('mode-change', `${prev.mode} → ${next.mode} — ${why}`, next.mode)
    } else if (why === 'boot') {
      logEvent('decision', `boot decision: ${next.mode} — link ${next.linkScore ?? '—'}/60 · device ${next.deviceScore ?? '—'}/45`, next.mode)
    } else {
      logEvent('decision', `re-decided (${why}): ${next.mode} — link ${next.linkScore ?? '—'}/60 · device ${next.deviceScore ?? '—'}/45`, next.mode)
    }
  }

  const recompute = useCallback(async (why, { withProbe = false } = {}) => {
    const ovr = overridesRef.current
    if (!navigator.onLine) {
      finish(decide({
        online: false, network: readNetwork(), device: readDevice(),
        probe: probeRef.current, overrides: ovr, previousBudget: decisionRef.current.budget,
      }), why)
      return
    }
    let prb = probeRef.current
    if (withProbe && (ovr.network || 'auto') === 'auto') {
      logEvent('probe', 'measuring link quality (16 KB probe, cache bypassed)…')
      prb = await measureProbe(15700)
      probeRef.current = prb
      setProbe(prb)
      logEvent('probe', prb.ok
        ? `probe result: ${prb.mbps.toFixed(1)} Mbps (${prb.bytes} B in ${prb.ms} ms)`
        : `probe failed: ${prb.error}`)
    }
    finish(decide({
      online: true, network: readNetwork(), device: readDevice(),
      probe: prb, overrides: ovr, previousBudget: decisionRef.current.budget,
    }), why)
  }, [])
  recomputeRef.current = recompute

  // ---- event log ------------------------------------------------------
  useEffect(() => {
    const off = onLog((e) => setEvents((prev) => [e, ...prev].slice(0, 60)))
    loadPastEvents(12).then((past) => {
      if (!past.length) return
      setEvents((prev) => {
        const have = new Set(prev.map((e) => e.id))
        return [...prev, ...past.filter((p) => !have.has(p.id))].slice(0, 60)
      })
    })
    return off
  }, [])

  // ---- metrics + SW stats ---------------------------------------------
  useEffect(() => {
    initMetrics()
    const off = onMetrics(setMetrics)
    let t = null
    registerSW().then(() => {
      const poll = () => getSWStats().then((s) => { if (s) { setSWStatsState(s); setSWStats(s) } })
      poll()
      t = setInterval(poll, 2500)
    })
    const t0 = setInterval(() => setMetrics(snapshot()), 2000)
    return () => { off(); clearInterval(t0); if (t) clearInterval(t) }
  }, [])

  // ---- boot -------------------------------------------------------------
  useEffect(() => {
    logEvent('boot', 'app booted — detection layer reading network + device signals')
    recomputeRef.current('boot', { withProbe: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ---- live signal listeners --------------------------------------------
  useEffect(() => {
    const offNet = onNetworkChange(() => {
      const net = readNetwork()
      logEvent('decision', `network change event: effectiveType=${net.effectiveType} · downlink=${net.downlink} Mbps · rtt=${net.rtt} ms`)
      recomputeRef.current('network-change', { withProbe: true })
    })
    const goOnline = () => {
      setOnline(true)
      logEvent('offline', 'back online — resuming normal delivery')
      recomputeRef.current('back-online', { withProbe: true })
    }
    const goOffline = () => {
      setOnline(false)
      logEvent('offline', 'connection lost — switching to cached delivery', MODES.OFFLINE)
      finish(decide({
        online: false, network: readNetwork(), device: readDevice(),
        probe: probeRef.current, overrides: overridesRef.current,
        previousBudget: decisionRef.current.budget,
      }), 'offline')
    }
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    return () => { offNet(); window.removeEventListener('online', goOnline); window.removeEventListener('offline', goOffline) }
  }, [])

  // ---- side effects of the active budget ---------------------------------
  const mode = decision.mode
  const budget = decision.budget
  useEffect(() => {
    document.documentElement.className = MODE_CLASS[mode] || ''
    if (mode === MODES.FULL && budget.prefetch === 'all') {
      const timer = setTimeout(() => {
        // Warm the format the browser would actually request, so the prefetch
        // is not wasted on a file <picture> will never ask for.
        const format = bestImageFormat()
        const urls = PRODUCTS.map((p) => productImage(p.id, 'high', format))
        const n = prefetchImages(urls, budget, logEvent)
        if (n) logEvent('prefetch', `idle: prefetched ${n} high-tier product images (fast link)`, mode)
      }, 2200)
      return () => clearTimeout(timer)
    }
  }, [mode, budget])

  // ---- overrides ----------------------------------------------------------
  const setOverride = useCallback((key, value) => {
    const next = { ...overridesRef.current }
    if (value === 'auto' || value === false) delete next[key]
    else next[key] = value
    overridesRef.current = next
    setOverridesState(next)
    try { sessionStorage.setItem(OVERRIDE_KEY, JSON.stringify(next)) } catch { /* noop */ }
    logEvent('override', `${key} → ${value === 'auto' || value === false ? 'auto (live signals)' : value}`)
    setTimeout(() => recomputeRef.current('override', { withProbe: true }), 0)
  }, [])

  const resetOverrides = useCallback(async () => {
    overridesRef.current = {}
    setOverridesState({})
    try { sessionStorage.removeItem(OVERRIDE_KEY) } catch { /* noop */ }
    resetPrefetchState()
    await resetSWStats()
    await clearRuntimeCaches()
    await clearPastEvents()
    logEvent('override', 'demo reset — overrides cleared · runtime cache cleared · stats zeroed')
    recomputeRef.current('force', { withProbe: true })
  }, [])

  const refresh = useCallback(() => recomputeRef.current('force', { withProbe: true }), [])

  const value = useMemo(() => ({
    online, mode, budget, decision, overrides, probe,
    setOverride, resetOverrides, refresh,
    events, metrics, swStats, logEvent,
    prediction, preemptive, setPreemptive,
    normalMode, setNormalMode,
  }), [online, mode, budget, decision, overrides, probe, setOverride, resetOverrides, refresh,
       events, metrics, swStats, prediction, preemptive, setPreemptive, normalMode, setNormalMode])

  return <AdaptiveContext.Provider value={value}>{children}</AdaptiveContext.Provider>
}

export { BUDGETS }
