import { useEffect, useRef } from 'react'
import { useAdaptive } from '../adaptive/AdaptiveProvider.jsx'
import ModeBadge from './ModeBadge.jsx'
import ThemeToggle from './ThemeToggle.jsx'
import { compareDeliveries, formatSize } from '../adaptive/compare.js'

const fmtPct = (v) => v == null ? '—' : `${Math.round(v * 100)}%`
const fmtS = (v) => v == null ? '—' : `${v.toFixed(2)} s`
const fmtKB = (v) => v == null ? '—' : `${Math.round(v)} KB`

function Tile({ label, value, sub, testid }) {
  return (
    <div className="tile" data-testid={testid}>
      <span className="tile-label">{label}</span>
      <span className="tile-value">{value}</span>
      {sub && <span className="tile-sub">{sub}</span>}
    </div>
  )
}

const fmtTime = (ts) => {
  const d = new Date(ts)
  return d.toTimeString().slice(0, 8)
}

// Four restrained tones for the whole ledger, instead of one colour per event
// type. Colour marks the row's family; the type column carries the meaning.
const TONE = {
  boot: 'tone-neutral', probe: 'tone-neutral-firm', decision: 'tone-accent',
  'mode-change': 'tone-caution', chunk: 'tone-neutral-firm', prefetch: 'tone-positive',
  override: 'tone-caution', offline: 'tone-neutral', predict: 'tone-accent',
}

// The dashboard is split into pages, one grouping of sections each, so a page
// holds a single idea rather than one long scroll:
//
//   overview  - the decision and why it was taken
//   metrics   - what the engine then shipped, measured
//   log       - the event ledger
//
// Pages are routes (see App.jsx), so each one is linkable and refreshable.
const PAGES = [
  ['overview', 'Overview'],
  ['metrics', 'Metrics'],
  ['log', 'Event log'],
]

export default function Dashboard({ page = 'overview', onNavigate, onClose }) {
  const { decision, budget, mode, metrics, swStats, events, refresh, prediction, preemptive } = useAdaptive()
  const cmp = compareDeliveries(metrics)
  const titleRef = useRef(null)
  const tilesRef = useRef(null)

  // Focus the title only on arrival. Doing it in an effect that depends on a
  // prop would re-steal focus on every adaptive re-render.
  const focusedOnce = useRef(false)
  useEffect(() => {
    if (focusedOnce.current) return
    focusedOnce.current = true
    titleRef.current?.focus?.({ preventScroll: true })
  }, [])

  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose
  useEffect(() => {
    const onKeyDown = (e) => { if (e.key === 'Escape') onCloseRef.current?.() }
    document.addEventListener('keydown', onKeyDown, true)
    return () => document.removeEventListener('keydown', onKeyDown, true)
  }, [])

  // Adaptive JS in action: the animated counters only arrive with the
  // heavy-motion chunk, which the engine ships on FULL delivery only.
  useEffect(() => {
    if (budget.jsLevel !== 'full' || !tilesRef.current) return
    let cancelled = false
    import('../heavy/motion.js').then((mod) => {
      if (cancelled || !tilesRef.current) return
      mod.staggerIn(tilesRef.current.querySelectorAll('.tile'))
    }).catch(() => {})
    return () => { cancelled = true }
  }, [budget.jsLevel, page])

  const net = decision.signals?.network || {}
  const dev = decision.signals?.device || {}
  const probe = decision.signals?.probe
  const score = decision.totalScore

  const pipeline = [
    ['Detect', `${net.effectiveType || '?'} · ${probe && probe.ok ? probe.mbps.toFixed(1) + ' Mbps' : 'no probe'}`, `${dev.memoryGB ?? '?'} GB · ${dev.cores ?? '?'} cores`],
    ['Decide', mode, score != null ? `score ${score}/105` : 'cached'],
    ['Optimize', `images: ${budget.imageTier}`, `JS: ${budget.jsLevel} · anim: ${budget.animations}`],
    ['Deliver', `prefetch: ${budget.prefetch}`, `features: video ${budget.videoPreview ? 'on' : 'off'} · zoom ${budget.zoom ? 'on' : 'off'}`],
  ]

  return (
    <div className="dash-page" data-testid="dashboard">
      <header className="dash-head">
        <div className="dash-head-row">
          <div className="dash-head-main">
            <button className="btn ghost dash-back" onClick={onClose} data-testid="dashboard-back">
              <span aria-hidden="true">←</span> Back to shop
            </button>
            <div className="dash-title">
              <h1 id="dashboard-title" ref={titleRef} tabIndex={-1}>Performance dashboard</h1>
              <p className="dash-sub">The app measures itself — live readout of what just happened to you.</p>
            </div>
          </div>
          <div className="dash-head-actions">
            <ThemeToggle />
            <button className="btn ghost" onClick={refresh}>Re-decide</button>
          </div>
        </div>

        {/* One page per grouping. These are real routes, so the browser's back
            button and a refresh both land back here. */}
        <nav className="dash-nav" aria-label="Dashboard pages">
          {PAGES.map(([key, label]) => (
            <button
              key={key}
              type="button"
              className={`dash-tab${page === key ? ' is-current' : ''}`}
              aria-current={page === key ? 'page' : undefined}
              onClick={() => onNavigate?.(key)}
              data-testid={`dashboard-tab-${key}`}
            >
              {label}
            </button>
          ))}
        </nav>
      </header>

      <div className="dash-body">
        {page === 'overview' && (
          <>
            <section className="dash-section">
              <h2>Current delivery</h2>
              <div className="mode-hero">
                <ModeBadge mode={mode} />
                <div className="score-bars">
                  <div className="score-row">
                    <span>link</span>
                    <div className="score-track" role="img" aria-label={`link score ${decision.linkScore ?? 'unknown'} of 60`}>
                      <div className="score-fill link" style={{ width: `${((decision.linkScore ?? 0) / 60) * 100}%` }} />
                    </div>
                    <b>{decision.linkScore ?? '—'}/60</b>
                  </div>
                  <div className="score-row">
                    <span>device</span>
                    <div className="score-track" role="img" aria-label={`device score ${decision.deviceScore ?? 'unknown'} of 45`}>
                      <div className="score-fill device" style={{ width: `${((decision.deviceScore ?? 0) / 45) * 100}%` }} />
                    </div>
                    <b>{decision.deviceScore ?? '—'}/45</b>
                  </div>
                </div>
              </div>
              {/* The measured headline, on the page a judge lands on first. The
                  full table is one tab away. */}
              <p className="delivery-summary">
                This session: <b>{formatSize(metrics.transferKB)}</b> in <b>{metrics.requests}</b>{' '}
                {metrics.requests === 1 ? 'request' : 'requests'}
                {cmp.savedKB > 0
                  ? ` - ${formatSize(cmp.savedKB)} below what a non-adaptive delivery would have sent`
                  : ' - already the fastest delivery, so there is nothing to save yet'}
              </p>
            </section>

            <section className="dash-section predict">
              <h2>Prediction</h2>
              {prediction.ready ? (
                <>
                  <p className="predict-head">
                    Next link: <b>{prediction.state}</b>
                    <span className="predict-conf">{Math.round(prediction.confidence * 100)}% confidence</span>
                  </p>
                  <div className="predict-bars">
                    {['fast', 'moderate', 'slow'].map((state) => (
                      <div className="predict-row" key={state}>
                        <span>{state}</span>
                        <div className="predict-track">
                          <div className={`predict-fill is-${state}`} style={{ width: `${Math.round(prediction.probabilities[state] * 100)}%` }} />
                        </div>
                        <b>{Math.round(prediction.probabilities[state] * 100)}%</b>
                      </div>
                    ))}
                  </div>
                  <ul className="predict-basis">
                    {prediction.basis.map((line) => <li key={line}>{line}</li>)}
                  </ul>
                  <p className="predict-note">
                    {preemptive
                      ? 'Pre-emptive adaptation is armed: a confident slow prediction lowers the budget before the first slow request.'
                      : 'Pre-emptive adaptation is off, so the engine only reacts to the link it already has.'}
                  </p>
                </>
              ) : (
                <p className="predict-note">
                  Collecting link samples ({prediction.samples} so far). A prediction needs a few
                  readings before it will commit to one.
                </p>
              )}
            </section>

            {decision.reasons?.length > 0 && (
              <section className="dash-section reasons">
                <h2>Why {mode}?</h2>
                <ul>
                  {decision.reasons.slice(0, 7).map((r, i) => <li key={i}>{r}</li>)}
                </ul>
                {decision.reasons.length > 7 && (
                  <p className="reasons-note">
                    Showing the top 7 of {decision.reasons.length} signals that fired.
                  </p>
                )}
                {decision.overridden && (
                  <p className="override-note">
                    A demo override is active — real signals are listed in the demo panel
                  </p>
                )}
              </section>
            )}
          </>
        )}

        {page === 'metrics' && (
          <>
            <section className="dash-section">
              <h2>Pipeline</h2>
              <div className="pipeline-strip">
                {pipeline.map(([step, l1, l2]) => (
                  <div className="pipe-step" key={step}>
                    <span className="pipe-name">{step}</span>
                    <span className="pipe-v1">{l1}</span>
                    <span className="pipe-v2">{l2}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="dash-section">
              <h2>Measurements</h2>
              <div className="tile-grid" ref={tilesRef}>
                <Tile label="NETWORK" value={net.effectiveType ? `${net.effectiveType}${probe?.ok ? ` · ${probe.mbps.toFixed(1)} Mbps` : ''}` : '—'} testid="tile-network" />
                <Tile
                  label="DEVICE"
                  value={dev.memoryGB ? `${dev.memoryGB} GB · ${dev.cores} cores` : `${dev.cores ?? '—'} cores`}
                  sub={dev.deviceFallback ? <><em>estimated</em> — no native device signal</> : undefined}
                  testid="tile-device"
                />
                <Tile label="MODE" value={mode} testid="tile-mode" />
                <Tile label="DATA SAVED" value={fmtPct(metrics.dataSavedPct)} sub="vs FULL delivery" testid="tile-data-saved" />
                <Tile label="LCP" value={fmtS(metrics.lcp)} testid="tile-lcp" />
                <Tile label="FIRST PAINT" value={fmtS(metrics.fcp)} testid="tile-fcp" />
                <Tile label="JS LOADED" value={fmtKB(metrics.jsKB)} sub={`${metrics.jsChunks} chunks${metrics.heavyLoaded.length ? ` · heavy: ${metrics.heavyLoaded.length}` : ' · heavy: 0'}`} testid="tile-js" />
                <Tile label="IMAGE DATA SAVED" value={fmtPct(metrics.imageSavedPct)} sub={`${fmtKB(metrics.imageKB)} of ${fmtKB(metrics.imageBaselineKB)}`} testid="tile-image-saved" />
                <Tile
                  label="CACHE HIT"
                  value={fmtPct(swStats && swStats.requests > 0 ? swStats.hits / swStats.requests : null)}
                  sub={swStats ? `${swStats.hits}/${swStats.requests} cacheable requests · ${swStats.probes || 0} probes (never cached)` : 'no SW'}
                  testid="tile-cache"
                />
                <Tile
                  label="TRANSFERRED"
                  value={formatSize(metrics.transferKB)}
                  sub={`${formatSize(metrics.networkKB)} over the wire`}
                  testid="tile-transfer"
                />
                <Tile label="REQUESTS" value={metrics.requests ?? '—'} sub="resource entries" testid="tile-requests" />
              </div>
            </section>

            {cmp.normal.kb > 0 && (
              <section className="dash-section compare">
                <h2>Normal vs adaptive</h2>
                <p className="dash-note">
                  Adaptive is what this session actually transferred. Normal is the same session with the
                  adaptive parts swapped for the high-tier images and the full chunk set - sizes measured at
                  build time. Everything that does not adapt is carried across unchanged.
                </p>
                <div className="cmp-table">
                  <div className="cmp-head">
                    <span />
                    <span>Normal</span>
                    <span>Adaptive</span>
                  </div>
                  <div className="cmp-line">
                    <span>Payload</span>
                    <b>{formatSize(cmp.normal.kb)}</b>
                    <b className="is-best">{formatSize(cmp.adaptive.kb)}</b>
                  </div>
                  <div className="cmp-line">
                    <span>Requests</span>
                    <b>{cmp.normal.requests}</b>
                    <b className="is-best">{cmp.adaptive.requests}</b>
                  </div>
                  <div className="cmp-line">
                    <span>Images</span>
                    <b>{formatSize(cmp.breakdown.imageBaselineKB)}</b>
                    <b className="is-best">{formatSize(cmp.breakdown.imageKB)}</b>
                  </div>
                  <div className="cmp-line">
                    <span>JavaScript</span>
                    <b>{formatSize(cmp.breakdown.jsBaselineKB)}</b>
                    <b className="is-best">{formatSize(cmp.breakdown.jsKB)}</b>
                  </div>
                </div>
                <p className="cmp-saved">
                  Saved <b>{formatSize(cmp.savedKB)}</b>
                  {cmp.savedPct != null ? ` (${Math.round(cmp.savedPct * 100)}%)` : ''}
                  <span className="cmp-extra">about {cmp.savedPer1000VisitorsGB.toFixed(1)} GB per 1,000 visitors</span>
                </p>
                {mode === 'FULL' && (
                  <p className="cmp-hint">
                    Nothing to save on this session: it is already getting the fastest delivery, so the two
                    columns should match. Throttle the network - DevTools, or the Demo panel - and the saving
                    appears here.
                  </p>
                )}
              </section>
            )}
          </>
        )}

        {page === 'log' && (
          <section className="dash-section event-log">
            <h2>Adaptive event log</h2>
            <ul data-testid="event-log">
              {events.slice(0, 14).map((e) => (
                <li
                  key={e.id}
                  className={`${TONE[e.type] || 'tone-neutral'}${e.type === 'mode-change' ? ' log-row-accent' : ''}`}
                >
                  <span className="log-ts">{fmtTime(e.ts)}</span>
                  <span className="log-type">{e.type}</span>
                  <span className="log-detail">{e.detail}</span>
                </li>
              ))}
              {!events.length && <li className="log-empty">no events yet</li>}
            </ul>
          </section>
        )}
      </div>

      <footer className="site-footer">
        <span>Adaptive Web — signal-adaptive delivery · Hackathon 2026</span>
        <span>React PWA · Service Worker · Network &amp; Device APIs · Cache API · IndexedDB</span>
      </footer>
    </div>
  )
}
