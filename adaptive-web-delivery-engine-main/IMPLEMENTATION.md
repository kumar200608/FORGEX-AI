# IMPLEMENTATION.md — Adaptive Web Delivery Engine

## 1. Architecture

```
detector → classifier → rules → adaptation → metrics
```

- **detector** (`src/lib/adaptive/detector.ts`, `src/lib/networkProbe.ts`,
  `src/lib/deviceSignals.ts`): reads the Network Information API
  (`effectiveType`, `downlink`, `rtt`, `saveData`) plus a ~50 KB bandwidth
  probe (`/probe/probe-50kb.bin`, `cache: no-store`) and device signals
  (`hardwareConcurrency`, `deviceMemory`). Output: `NetworkInfo` with
  `source: "api" | "probe" | "unknown"`.
- **classifier** (context layer, `src/context/AdaptiveModeContext.tsx`):
  resolves `?forceMode=FULL|CONSTRAINED` override first, else delegates to
  the rules engine. Default state is `CONSTRAINED` + `detecting` (fail-safe,
  never fail-flashy).
- **rules** (`src/lib/decisionEngine.ts`, thresholds re-exported via
  `src/lib/adaptive/rules.ts`): pure `decideMode(network, device)` —
  saveData / slow effectiveType / low downlink / low cores / low memory /
  unknown source → `CONSTRAINED`, else `FULL`. `MAX_RTT_MS = 400` lives in
  `adaptive/rules.ts` for the detector/classifier layer.
- **adaptation** (context `changes` + components): `imageReduced`,
  `componentDeferred`, `animationsReduced`, `prefetchDisabled` all mirror
  the mode (`CONSTRAINED` → all true). Components switch image variants,
  defer heavy sections (`ProductCarousel`, `PromoBanner`,
  `RecommendationWidget` via `next/dynamic ssr:false`), gate motion, and
  disable prefetch.
- **metrics** (`src/lib/vitalsLogger.ts`, `/performance` lab):
  `web-vitals` (CLS/FCP/LCP/INP) tagged with the active mode into
  `sessionStorage`; the lab renders live vitals + resource stats
  (`performance.getEntriesByType("resource")`).

## 2. File map

```
src/
  app/
    layout.tsx                  # root layout + AdaptiveModeProvider wiring
    page.tsx                    # home
    products/page.tsx           # canonical listing
    products/[id]/page.tsx      # canonical detail
    product/[id]/page.tsx       # legacy detail (RecommendationWidget dynamic)
    browse/page.tsx             # legacy listing compat
    performance/page.tsx        # canonical Performance Lab (client)
    lab/page.tsx                # thin compat re-export of /performance
    checkout/page.tsx, cart/page.tsx, order-success/...
    globals.css                 # Tailwind base (no gradients/glass/fancy keyframes)
  components/
    AdaptationStatusPanel.tsx   # self-hideable status badge (localStorage awd-panel-hidden)
    RecommendationWidget.tsx    # related-first ordering via recommendations.json
    StoreHeader.tsx / SiteNav.tsx / ProductCard.tsx / ProductCarousel.tsx / ...
  context/
    AdaptiveModeContext.tsx     # single provider: probe+device → mode + changes
  lib/
    decisionEngine.ts           # decideMode() pure rules
    decisionEngine.test.ts      # 7 base + extended tests
    adaptive/rules.ts           # MAX_RTT_MS + re-exported thresholds
    adaptive/detector.ts        # readConnection / probeSpeed / detectNetwork
    networkProbe.ts / deviceSignals.ts / vitalsLogger.ts
  data/
    products.json / categories.json / recommendations.json
  types/
    index.ts                    # Product / AdaptiveMode / DeliveryMode alias / NetworkInfo(+rtt) / ...
```

## 3. Mode casing

Canonical: `AdaptiveMode = "FULL" | "CONSTRAINED"`. Lowercase
`DeliveryMode = Lowercase<AdaptiveMode>` is an alias via
`toDeliveryMode()`. `?forceMode=` accepts UPPERCASE only.

## 4. Thresholds (spec §7)

`SLOW_NETWORK_TYPES = ["slow-2g","2g","3g"]`, `MIN_DOWNLINK_MBPS = 1.5`,
`MIN_CORES = 2`, `MIN_DEVICE_MEMORY_GB = 2`, `MAX_RTT_MS = 400`.
Unknown source → CONSTRAINED.

## 5. Routes

Canonical: `/products`, `/products/[id]`, `/order-success`, `/performance`.
Legacy compat: `/browse`, `/product/[id]`, `/lab` (thin re-export).

## 6. Performance Lab

`/performance` sections: (a) current delivery mode + strategies, (b) live
web-vitals + resource stats, (c) Baseline vs Adaptive table. Baseline cells
read `N/A — run Lighthouse §11` until real numbers are pasted.

## 7.–10. (Reserved for Builder-1/2 areas: detector tuning, checkout, types.)

## 11. Lighthouse comparison protocol

1. DevTools → Network → **Slow 3G**; Performance → CPU **4x slowdown**.
2. Baseline: load `/products` + a detail page with `?forceMode=FULL`;
   run Lighthouse (mobile, throttled); record Performance score, LCP, CLS,
   TBT, plus Requests/Transfer.
3. Adaptive: same throttle, no `forceMode` (natural detection → expected
   CONSTRAINED); same pages; record the same metrics.
4. Paste real numbers into the lab table; never fabricate. Early metrics
   (e.g. FCP) may be tagged with the initial CONSTRAINED default if they
   fire before detection resolves — expected, not a bug.

## 12. Performance tab + report generator

- **Performance tab:** the SiteNav **"Performance Lab"** entry routes to
  canonical `/performance`; `/lab` remains as a legacy thin re-export.
- **Report file map:**
  - `src/lib/adaptive/report.ts` — pure `buildReport()` snapshot builder
    plus `toJSON()` / `toMarkdown()` serializers (unit-tested in
    `src/lib/adaptive/report.test.ts`; no storage or DOM access).
  - `src/components/ReportGenerator.tsx` — client download control on the
    lab page (snapshot baseline → download JSON/Markdown).
- **Usage:** snapshot the baseline (`?forceMode=FULL`, Slow 3G + 4x CPU),
  capture the natural adaptive run, then download JSON/Markdown per the
  Lighthouse §11 protocol above.
- **Hydration:** storage reads are mount-gated; first paint renders
  server-safe defaults (CONSTRAINED + `detecting`, `N/A` cells).

## 13. Lab accuracy pass (appendix — Builder-3)

- **Lab hierarchy A–F:** (A) mode + strategies, (B) live vitals with
  `MetricState`, (C) resource breakdown, (D) navigation timing,
  (E) Baseline vs Adaptive table, (F) report generator. `N/A` until real
  readings exist.
- **MetricState model:** `{ state, value, unit, note? }` per vital;
  `loading → measured | waiting` after mount (`usePerformanceMetrics`:
  SSR `loading`/null; latest stored reading per metric → `measured`
  with raw ms value, unit `"ms"`, CLS unitless; missing → `"waiting"`
  with note). 3s poll re-renders only on serialized-snapshot change.
- **Run protocol:** `[Record Baseline]` (`?forceMode=FULL`, Slow 3G + 4x
  CPU) → throttle/mode change → `[Record Adaptive]` (natural) →
  Difference view (`diffRuns`: both-numbers → diff string; one-side-null
  → diff `null`; null runs → all diffs null, no throw). Runs persist under
  new storage keys via `saveRun`/`loadRun`/`clearRuns` (round-tripped and
  key-isolated from `awd-baseline-v1` in
  `src/lib/adaptive/report.test.ts`); `captureRun(id, decision, vitals,
  stats)` returns `{ id, takenAt, mode, vitals: { LCP, FCP, CLS, INP },
  resources }` (array vitals: latest wins; NaN → null).
- **Transfer opacity limitation:** opaque cross-origin resources report
  `transferSize 0` — Requests/Transfer are lower bounds.
- **No-fabrication policy:** missing = `N/A`/`null`, never `0` or
  estimates; Markdown renders missing vitals/resources as `N/A`.

## 14. Print-to-PDF report + catalog tests (appendix — Builder-3)

- **`toPrintHTML(snapshot, reasons?)`** (`src/lib/adaptive/report.ts`,
  additive): self-contained printable HTML fragment (inline
  black-on-white styles; tables for vitals/resources/baseline +
  difference context; nulls as `N/A`; optional reasons list). Escapes
  HTML in values; never throws (fallback `<p>Report unavailable</p>`).
- **`ReportGenerator` PDF button** (`src/components/ReportGenerator.tsx`):
  **Generate Live Performance Report (PDF)** rebuilds the CURRENT
  snapshot via `buildReport` (same inputs as downloads), stores the
  `toPrintHTML()` fragment in state, renders
  `<div className="print-report" dangerouslySetInnerHTML>`, and prints
  after paint (`useEffect` + `requestAnimationFrame → window.print()`,
  `typeof window` guarded). Controls wrapper carries `no-print` (print
  CSS owned by B2); existing buttons/tables/logic unchanged.
- **Catalog tests** (`src/data/products.test.ts`, vitest): ids unique;
  p1–p8 ORIGINAL prices/images; every image in the p1..p8 jpg set;
  30–50 products; recommendations refs resolve; categories counts match.
- **Catalog size + image-reuse map:** 30–50 products; p1–p8 originals
  pinned; extended items reuse the 8 subject photos within the same
  category with product-specific alt text.
- **Animation policy:** FULL-only motion (`animationsReduced` in
  CONSTRAINED) + `prefers-reduced-motion: reduce` always wins.

## 15. Run protocol — Baseline vs Adaptive (appendix — Builder-3)

7-step sequence (guidance text lives in `src/app/performance/page.tsx`):

1. Throttle Slow 3G + fixed viewport (identical for both runs).
2. Run Baseline — fresh document, forced `?forceMode=FULL` probe.
3. Auto-return to the unforced lab (pending run consumed).
4. Run Adaptive — fresh document, engine decides (no `forceMode`).
5. Compare the difference table (`diffRuns`: both-numbers → diff string;
   one-side-null → diff `null` / `N/A`).
6. Fresh-document rule — one navigation per run; resource timing and
   vitals are per-document, so two snapshots from the same document are
   never a valid comparison.
7. Decoded comparison is cache-immune — compare decoded bytes; transfer
   is a lower bound only (cache / opaque cross-origin reads `0` or
   `unavailable`).

- **Probe URLs:** `/probe/probe-50kb.bin` with `cache: no-store`
  (`PROBE_URL` in `src/lib/adaptive/rules.ts`, fetched in
  `src/lib/networkProbe.ts`).
- **Pending-run key:** transient `localStorage` entry
  (`awd-run-pending-v1`) written before the forced-FULL navigation,
  consumed + cleared on auto-return. Isolated from persisted runs
  (`awd-run-baseline-v1` / `awd-run-adaptive-v1`) and legacy
  (`awd-baseline-v1`) — clearing runs never touches the legacy key.
- **Auto-return behavior:** the forced-FULL document captures the
  baseline run, saves it under the baseline run key, then navigates back
  to unforced `/performance`. A mid-flight reload drops the pending
  entry without recording a partial run.
- **Decoded vs transfer + cache note:** repeat/cached loads drive
  `transferSize` toward `0` while decoded bytes stay stable; opaque
  cross-origin resources (no `Timing-Allow-Origin`) also report
  `transferSize 0`. Treat Requests/Transfer as lower bounds and compare
  decoded.
