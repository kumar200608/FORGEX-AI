# Adaptive Web Delivery System v2 — Demo

Senses device + network conditions and serves either a **FULL** experience
(high-res images, heavy components) or a **CONSTRAINED** experience
(low-res images, deferred sections, reduced motion, no prefetch) — no route
changes, no reload flashes.

## Run locally

```bash
git clone <repo-url>
cd adaptive-web-delivery
npm install
npm run dev
# open http://localhost:3000
```

Production check:

```bash
npm run build
npm start
```

## Run unit tests

```bash
npm test
# vitest run — src/lib/decisionEngine.test.ts (7 tests, spec §7)
```

## Force a mode (for testing or demos)

Append `?forceMode=FULL` or `?forceMode=CONSTRAINED` to any URL to bypass
live detection and pin the adaptive mode, e.g.:

- `http://localhost:3000/?forceMode=FULL`
- `http://localhost:3000/?forceMode=CONSTRAINED`

The Adaptation Status Panel flags when a forced mode is active. Used for the
**Baseline vs Adaptive** Lighthouse comparison — see IMPLEMENTATION.md §11:
both runs use the same Slow 3G + 4x CPU throttle; only the mode differs
(`?forceMode=FULL` vs natural detection).

## Throttle for a live demo

1. Chrome DevTools → Network → Throttling → **Slow 3G**
2. Chrome DevTools → Performance → CPU → **4x slowdown**
3. Reload — the Adaptation Status Panel should show `Detecting…` briefly,
   then settle on **Mode: CONSTRAINED** (small images, deferred sections,
   no prefetch). Restore to No throttling and reload to see FULL return.

Tip: a ~50 KB bandwidth probe (`/probe/probe-50kb.bin`, no-store) plus the
Network Information API feed the decision engine; the panel shows which
signals fired.

## Project structure

```
src/
  app/
    layout.tsx                  # root layout + AdaptiveModeProvider wiring
    page.tsx                    # product listing (Baseline vs Adaptive target)
    product/[id]/page.tsx       # product detail page
    lab/page.tsx                # Performance Lab dashboard
    globals.css                 # Tailwind base
  components/
    AdaptationStatusPanel.tsx   # status badge: mode, signals, forced flag
    ProductCard.tsx             # small vs large image variant per mode + motion gate
    ProductCarousel.tsx         # heavy carousel, deferred in CONSTRAINED
    PromoBanner.tsx             # heavy banner, deferred in CONSTRAINED
    RecommendationWidget.tsx    # heavy recommendations widget
  context/
    AdaptiveModeContext.tsx     # probe + device signals -> mode state (single provider)
  lib/
    decisionEngine.ts           # decideMode() pure rules (spec S7)
    decisionEngine.test.ts      # 7 unit tests (spec S7)
    networkProbe.ts             # Connection API + timed fetch of /probe/probe-50kb.bin
    deviceSignals.ts            # hardwareConcurrency / deviceMemory
    vitalsLogger.ts             # web-vitals reporters (CLS/FCP/LCP/INP) -> sessionStorage
  data/
    products.json               # 8 dummy products
  types/
    index.ts                    # Product / AdaptiveMode / NetworkInfo / DeviceInfo / AdaptationDecision
public/
  probe/probe-50kb.bin          # 50 KiB bandwidth probe target (no-store)
  images/small/p1..p8.jpg       # ~400px constrained variants (square)
  images/large/p1..p8.jpg       # ~1200px full variants (square)
vitest.config.ts                # @/ alias -> ./src for tests
```

## Browser support

- Best in Chromium (Network Information API: `effectiveType`, `downlink`,
  `saveData`). Chrome / Edge / Brave / Opera.
- Firefox / Safari: no Network Information API — detection falls back to the
  bandwidth probe + hardwareConcurrency/deviceMemory, and defaults to
  CONSTRAINED when every signal is unavailable (fail-safe, never fail-flashy).
- `deviceMemory` is Chromium-only; absence is treated as unknown, not as low.

## Product images note

`public/images/small` (square 400px) and `public/images/large` (square
1200px) hold real subject-matched photos — one per product. p1–p8 are
the original photos; p9–p36 are real CC-licensed photos (see
`src/data/credits.json`) fetched via `python scripts/fetch-images.py`.
Small and large variants share the same crop so the mode flip causes no
layout shift.

## Spec compliance notes

### Routes

| Canonical (current) | Legacy (compat) | Notes |
| --- | --- | --- |
| `/products` | `/browse` | listing; legacy redirects/links updated to canonical |
| `/products/[id]` | `/product/[id]` | detail; legacy kept working |
| `/order-success` | — | post-checkout confirmation |
| `/performance` | `/lab` | Performance Lab; `/lab` is a thin re-export of `/performance` |

### Mode casing

Canonical mode is UPPERCASE: `FULL | CONSTRAINED` (`AdaptiveMode`). The
lowercase `DeliveryMode` (`"full" | "constrained"`) is an alias only —
convert with `toDeliveryMode()` from `@/types`. Never compare modes
case-insensitively; never store lowercase as canonical.

### Thresholds (spec §7)

| Signal | Threshold | Effect |
| --- | --- | --- |
| `saveData` | `true` | → CONSTRAINED |
| `effectiveType` | `slow-2g`, `2g`, `3g` | → CONSTRAINED |
| `downlink` | `< 1.5` Mbps (`MIN_DOWNLINK_MBPS`) | → CONSTRAINED |
| `hardwareConcurrency` | `<= 2` (`MIN_CORES`) | → CONSTRAINED |
| `deviceMemory` | `<= 2` GB (`MIN_DEVICE_MEMORY_GB`) | → CONSTRAINED |
| `rtt` | `> 400` ms (`MAX_RTT_MS`) | detector/classifier layer (engine ignores `rtt` today) |
| all signals unknown | `source: "unknown"` | → CONSTRAINED (fail-safe) |

### Lab instructions (Lighthouse §11)

1. Open `/performance` (or legacy `/lab`).
2. Baseline run: `?forceMode=FULL` under Slow 3G + 4x CPU throttle; record
   LCP / FCP / CLS / INP / Requests / Transfer.
3. Adaptive run: same throttle, natural detection (no `forceMode`); record
   the same metrics.
4. N/A policy: the Baseline column shows `N/A — run Lighthouse §11` until
   real measured numbers are pasted in. Never invent or estimate numbers.
   Live Adaptive cells show measured session values or `N/A` when no
   reading exists yet.

### Performance tab location

- The SiteNav entry **"Performance Lab"** points to the canonical
  `/performance` route; `/lab` is a legacy alias (thin re-export of
  `/performance`). Both render the same lab; always record Lighthouse
  numbers against `/performance` (see IMPLEMENTATION.md §11).

### Report generator usage

1. On `/performance`, snapshot the live adaptive reading as the baseline
   (`?forceMode=FULL` under Slow 3G + 4x CPU throttle), then reload
   naturally for the adaptive run.
2. Use the report generator (`ReportGenerator` on the lab page,
   `lib/adaptive/report.ts`: `buildReport` → `toJSON` / `toMarkdown`) to
   download the comparison as JSON or Markdown.
3. Follow the Lighthouse §11 protocol in IMPLEMENTATION.md §11 for both
   runs; paste only real measured numbers — never invent or estimate.

### Hydration notes

- All storage reads (`sessionStorage` vitals, `localStorage` panel flag)
  are mount-gated (`useEffect` / `typeof window` guards), so the first
  paint uses server-safe defaults (CONSTRAINED + `detecting`, `N/A`
  cells) and hydrates to live values without mismatch.

### Performance Lab accuracy pass (appendix)

- **Lab hierarchy A–F:** (A) current delivery mode + strategies, (B) live
  web-vitals (`LCP/FCP/CLS/INP` with `MetricState`), (C) resource
  breakdown (requests / transfer), (D) navigation timing, (E) Baseline vs
  Adaptive comparison table, (F) report generator (JSON/Markdown
  download). Sections render `N/A` until real readings exist.
- **MetricState model:** every vital is a
  `{ state, value, unit, note? }` cell with
  `state: "loading" | "measured" | "unavailable" | "waiting"`. SSR/first
  paint is `"loading"` (value `null`); after mount the latest stored
  reading per metric becomes `"measured"` (raw ms value, unit `"ms"`;
  CLS is unitless `""`); metrics with no reading yet stay `"waiting"`
  with an honest note (`LCP waits for largest paint`, `INP waits for an
  interaction`, …). Live values poll every 3s but re-render only when
  the serialized snapshot actually differs — no fake updates.
- **Run protocol:** `[Record Baseline]` (under `?forceMode=FULL`, Slow 3G
  + 4x CPU throttle) → change throttle/mode → `[Record Adaptive]`
  (natural detection) → the Difference view diffs the two runs. A diff
  cell shows a string only when both sides are real numbers; when either
  side is `null` the diff is `null` (`N/A` in Markdown).
- **Transfer opacity limitation:** `transferSize` is `0`/opaque for
  cross-origin resources without `Timing-Allow-Origin`, so Requests /
  Transfer are lower bounds, not exact totals — the lab reports what the
  Resource Timing API exposes, nothing more.
- **No-fabrication policy:** never invent or estimate metric numbers.
  Missing readings render `N/A` (or the `waiting` note); reports
  serialize missing values as `null`, never `0` or guesses.

### Catalog size + image-reuse map (appendix — Builder-3)

- Catalog holds 30–50 products (`src/data/products.json`); p1–p8 keep
  their ORIGINAL prices (2999, 4999, 2499, 3999, 1499, 1999, 1799, 1299)
  and ORIGINAL image paths (`/images/small/pN.jpg`,
  `/images/large/pN.jpg`).
- Extended products reuse the same 8 image files (same-category reuse:
  e.g. Audio items reuse p1/p3 shots); every `imageSmall`/`imageLarge`
  matches `^/images/(small|large)/p[1-8]\.jpg$`. Alt text stays
  product-specific (name + category), never the image filename.
- Guarded by `src/data/products.test.ts` (ids unique, p1–p8 prices/
  images, image-set regex, 30–50 count, recommendations refs resolve,
  categories counts match).

### Print-to-PDF report usage (appendix — Builder-3)

1. On `/performance`, click **Generate Live Performance Report (PDF)**.
2. The live snapshot (`buildReport` with the same inputs as the JSON/
   Markdown downloads) renders into `.print-report` via `toPrintHTML()`
   (inline black-on-white styles; vitals/resources/baseline tables;
   nulls as `N/A`), then `window.print()` fires after paint
   (`requestAnimationFrame` in a `useEffect`; `typeof window` guarded).
3. In the print dialog choose **Save as PDF**. Interactive controls carry
   `no-print` so print CSS hides them; the report fragment prints alone.

### Animation policy (appendix — Builder-3)

- Motion runs at FULL fidelity only in `FULL` mode
  (`decision.changes.animationsReduced === false`); `CONSTRAINED` sets
  `animationsReduced: true` (carousels/banners render statically, no
  autoplay/keyframes).
- `prefers-reduced-motion: reduce` (see `src/app/globals.css`) always
  wins regardless of mode — OS-level reduced motion is never overridden.

## Image credits (p9–p36)

p9–p36 are real CC-licensed photos. Full per-product attributions live
in `src/data/credits.json` — keyed by product id (`p9` … `p36`), each
entry shaped as `{ title, creator, license, licenseUrl, sourceUrl,
pageUrl, query }`. Fetched via `python scripts/fetch-images.py`.

### Product imagery (appendix — Builder-3)

- p1–p8 are real subject-matched photos (`.jpg`; small and large share
  the same crop so the mode flip causes no layout shift).
- p9–p36 are real CC-licensed photos (`.jpg`, one per product:
  `/images/small/pN.jpg` + `/images/large/pN.jpg` with matching N;
  attributions in `src/data/credits.json`).
- Fetch them with `python scripts/fetch-images.py` (downloads the
  CC-licensed sources, then derives the small/large crops).

### Run protocol — Baseline vs Adaptive (appendix — Builder-3)

7-step sequence (see `/performance` tip area):

1. DevTools → Network → Slow 3G; fix the viewport (same for both runs).
2. Run Baseline — fresh document with `?forceMode=FULL` (forced FULL probe).
3. Auto-return — the lab consumes the pending run and lands back unforced.
4. Run Adaptive — fresh document, no `forceMode`; the engine decides.
5. Compare the Baseline vs Adaptive difference table (both-numbers → diff, else `N/A`).
6. Fresh-document rule — one navigation per run; never compare two
   snapshots from the same document (resource timing + vitals are
   per-document).
7. Decoded comparison is cache-immune — compare decoded bytes; transfer
   (`transferSize`) can read `0`/Unavailable when served from cache or
   when a cross-origin response lacks `Timing-Allow-Origin`.

- Probe URLs: `/probe/probe-50kb.bin` (`cache: no-store`; see
  `src/lib/adaptive/rules.ts` `PROBE_URL` + `src/lib/networkProbe.ts`).
- Pending-run key: transient `localStorage` pending-run entry
  (`awd-run-pending-v1`) written before the forced-FULL navigation and
  consumed + cleared on auto-return. Never confused with the persisted
  runs (`awd-run-baseline-v1` / `awd-run-adaptive-v1`) or the legacy
  snapshot key (`awd-baseline-v1`).
- Auto-return behavior: after the forced-FULL probe document captures its
  run, the lab navigates back to the unforced `/performance` URL so the
  adaptive run starts clean; a reload mid-flight simply drops the pending
  entry (no partial run is recorded).
- Cache note: cached repeat loads shrink transfer toward zero while
  decoded bytes stay stable — that is why the comparison uses decoded.
