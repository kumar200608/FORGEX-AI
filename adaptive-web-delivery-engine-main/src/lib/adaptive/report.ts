export interface ReportVital {
  name: string;
  mode: string;
  value: number | null;
}

export interface ReportNetwork {
  effectiveType: string | null;
  saveData: boolean;
  downlink: number | null;
  rtt: number | null;
  source: string;
}

export interface ReportDevice {
  cores: number | null;
  memory: number | null;
}

export interface ReportResources {
  requests: number | null;
  transferKB: number | null;
  decodedKB?: number | null;
  cachedRequests?: number | null;
}

export type BaselineSnapshot = Omit<ReportSnapshot, "baseline" | "takenAt"> & {
  takenAt: string;
};

export interface ReportSnapshot {
  takenAt: string;
  url: string;
  userAgent: string;
  mode: string;
  confidence: string;
  network: ReportNetwork;
  device: ReportDevice;
  vitals: ReportVital[];
  resources: ReportResources;
  baseline: BaselineSnapshot | null;
}

export interface BuildReportInput {
  decision: {
    mode: string;
    confidence?: string;
    network: {
      effectiveType?: string | null;
      saveData?: boolean;
      downlink?: number | null;
      rtt?: number | null;
      source?: string;
    };
    device: {
      hardwareConcurrency?: number | null;
      deviceMemory?: number | null;
    };
  };
  vitals: { name: string; mode: string; value: number | null }[];
  stats: { requests?: number | null; transferKB?: number | null };
  baseline: BaselineSnapshot | null;
  url?: string;
  userAgent?: string;
  takenAt?: string;
}

const BASELINE_KEY = "awd-baseline-v1";

function str(v: unknown): string {
  if (v === null || v === undefined) return "N/A";
  const s = String(v);
  return s.trim() === "" ? "N/A" : s;
}

export function buildReport(input: BuildReportInput): ReportSnapshot {
  const d = input.decision;
  return {
    takenAt: input.takenAt ?? new Date().toISOString(),
    url: str(input.url ?? null) === "N/A" ? "N/A" : String(input.url),
    userAgent: str(input.userAgent ?? null) === "N/A" ? "N/A" : String(input.userAgent),
    mode: str(d.mode),
    confidence: str(d.confidence ?? null),
    network: {
      effectiveType: d.network.effectiveType ?? null,
      saveData: d.network.saveData ?? false,
      downlink: d.network.downlink ?? null,
      rtt: d.network.rtt ?? null,
      source: d.network.source ?? "unknown",
    },
    device: {
      cores: d.device.hardwareConcurrency ?? null,
      memory: d.device.deviceMemory ?? null,
    },
    vitals: input.vitals.map((v) => ({
      name: v.name,
      mode: v.mode,
      value:
        typeof v.value === "number" && !Number.isNaN(v.value) ? v.value : null,
    })),
    resources: {
      requests: input.stats.requests ?? null,
      transferKB: input.stats.transferKB ?? null,
    },
    baseline: input.baseline,
  };
}

function mdVal(v: number | string | null | undefined): string {
  if (v === null || v === undefined) return "N/A";
  if (typeof v === "number") {
    if (Number.isNaN(v)) return "N/A";
    return String(Math.round(v * 100) / 100);
  }
  const s = String(v).trim();
  return s === "" ? "N/A" : s;
}

function mdValOrNull(v: number | null | undefined): string {
  if (v === null || v === undefined || Number.isNaN(v)) return "N/A";
  return String(Math.round(v * 100) / 100);
}

export function toMarkdown(
  r: ReportSnapshot,
  runs?: { baseline: MeasurementRun | null; adaptive: MeasurementRun | null } | null
): string {
  const lines: string[] = [];
  lines.push("# Adaptive Web Delivery — Performance Report");
  lines.push("");
  lines.push(`- Taken at: ${mdVal(r.takenAt)}`);
  lines.push(`- URL: ${mdVal(r.url)}`);
  lines.push(`- User agent: ${mdVal(r.userAgent)}`);
  lines.push(`- Mode: ${mdVal(r.mode)}`);
  lines.push(`- Confidence: ${mdVal(r.confidence)}`);
  lines.push("");
  lines.push("## Network");
  lines.push("");
  lines.push(`- Effective type: ${mdVal(r.network.effectiveType)}`);
  lines.push(`- Save-Data: ${r.network.saveData ? "ON" : "OFF"}`);
  lines.push(`- Downlink: ${mdValOrNull(r.network.downlink)}`);
  lines.push(`- RTT: ${mdValOrNull(r.network.rtt)}`);
  lines.push(`- Source: ${mdVal(r.network.source)}`);
  lines.push("");
  lines.push("## Device");
  lines.push("");
  lines.push(`- Cores: ${mdValOrNull(r.device.cores)}`);
  lines.push(`- Memory (GB): ${mdValOrNull(r.device.memory)}`);
  lines.push("");
  lines.push("## Web vitals");
  lines.push("");
  lines.push("| Metric | Mode | Value |");
  lines.push("| --- | --- | --- |");
  if (r.vitals.length === 0) {
    lines.push("| N/A | N/A | N/A |");
  } else {
    for (const v of r.vitals) {
      lines.push(`| ${mdVal(v.name)} | ${mdVal(v.mode)} | ${mdValOrNull(v.value)} |`);
    }
  }
  lines.push("");
  lines.push("## Resources");
  lines.push("");
  lines.push(
    `- Requests: ${r.resources.requests === null || r.resources.requests === undefined ? "N/A" : String(r.resources.requests)}`
  );
  lines.push(
    `- Transfer: ${r.resources.transferKB === null || r.resources.transferKB === undefined ? "N/A" : `${mdValOrNull(r.resources.transferKB)} KB`}`
  );
  lines.push("");
  if (r.baseline) {
    lines.push("## Baseline (saved snapshot)");
    lines.push("");
    lines.push(`- Taken at: ${mdVal(r.baseline.takenAt)}`);
    lines.push(`- Mode: ${mdVal(r.baseline.mode)}`);
    lines.push(`- URL: ${mdVal(r.baseline.url)}`);
  } else {
    lines.push("## Baseline");
    lines.push("");
    lines.push("N/A — no baseline saved yet.");
  }
  lines.push("");
  if (runs) {
    lines.push(runsToMarkdown(runs.baseline, runs.adaptive));
  }
  return lines.join("\n");
}

export function toJSON(r: ReportSnapshot): string {
  return JSON.stringify(r, null, 2);
}

export function loadBaseline(): BaselineSnapshot | null {
  try {
    if (typeof window === "undefined") return null;
    const raw = window.localStorage.getItem(BASELINE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as BaselineSnapshot;
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveBaseline(b: BaselineSnapshot): void {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(BASELINE_KEY, JSON.stringify(b));
  } catch {
    // storage unavailable — ignore
  }
}

export function clearBaseline(): void {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(BASELINE_KEY);
  } catch {
    // ignore
  }
}

// ---------------------------------------------------------------------------
// Baseline vs Adaptive measured runs (additive; legacy baseline above untouched)
// Types defined locally (not imported from ./metrics) to avoid import cycles.
// ---------------------------------------------------------------------------

export type MetricState = "loading" | "measured" | "unavailable" | "waiting";

export interface MeasurementRun {
  id: "baseline" | "adaptive";
  takenAt: string;
  mode: string;
  vitals: { LCP: number | null; FCP: number | null; CLS: number | null; INP: number | null };
  resources: { requests: number | null; transferKB: number | null; decodedKB?: number | null; cachedRequests?: number | null };
}

export interface RunDiff {
  baseline: number | null;
  adaptive: number | null;
  diff: string | null;
}

export interface RunDiffs {
  LCP: RunDiff;
  FCP: RunDiff;
  CLS: RunDiff;
  INP: RunDiff;
  requests: RunDiff;
  transferKB: RunDiff;
}

const RUN_BASELINE_KEY = "awd-run-baseline-v1";
const RUN_ADAPTIVE_KEY = "awd-run-adaptive-v1";

function cleanNum(v: unknown): number | null {
  if (typeof v !== "number" || Number.isNaN(v)) return null;
  return v;
}

function round2(v: number): number {
  return Math.round(v * 100) / 100;
}

function fmtSigned(v: number, digits: number, unit: string): string {
  if (Object.is(v, -0) || v === 0) return `±0${unit === "" ? "" : ` ${unit}`}`;
  const sign = v > 0 ? "+" : "-";
  const body = Math.abs(v).toFixed(digits);
  return unit === "" ? `${sign}${body}` : `${sign}${body} ${unit}`;
}

/** Difference string for a single metric; null unless both numbers exist. */
export function diffValue(
  baseline: number | null | undefined,
  adaptive: number | null | undefined,
  kind: "ms" | "cls" | "count" | "kb" = "ms"
): string | null {
  const b = cleanNum(baseline);
  const a = cleanNum(adaptive);
  if (b === null || a === null) return null;
  if (kind === "kb") return `${round2(b)} KB → ${round2(a)} KB`;
  if (kind === "cls") return fmtSigned(round2(a - b), 3, "");
  if (kind === "count") {
    const d = a - b;
    if (d === 0) return "±0";
    return `${d > 0 ? "+" : "-"}${Math.abs(Math.round(d))}`;
  }
  return fmtSigned(round2(a - b), 0, "ms");
}

function pair(
  baseline: number | null | undefined,
  adaptive: number | null | undefined,
  kind: "ms" | "cls" | "count" | "kb"
): RunDiff {
  const b = cleanNum(baseline);
  const a = cleanNum(adaptive);
  return { baseline: b, adaptive: a, diff: diffValue(b, a, kind) };
}

/** All-null diffs (used when no runs exist yet). */
export function emptyDiffs(): RunDiffs {
  const e = (): RunDiff => ({ baseline: null, adaptive: null, diff: null });
  return { LCP: e(), FCP: e(), CLS: e(), INP: e(), requests: e(), transferKB: e() };
}

type RunLike = {
  vitals?: unknown;
  resources?: unknown;
  stats?: unknown;
} | null | undefined;

function vitalOf(run: RunLike, name: "LCP" | "FCP" | "CLS" | "INP" | "Requests" | "Transfer"): number | null {
  if (!run || typeof run !== "object") return null;
  const v = (run as { vitals?: unknown }).vitals;
  if (Array.isArray(v)) {
    const matches = (v as Array<{ name?: unknown; value?: unknown }>).filter(
      (item) => item && typeof item === "object" && item.name === name
    );
    if (matches.length === 0) return null;
    return cleanNum(matches[matches.length - 1].value);
  }
  if (v && typeof v === "object") {
    return cleanNum((v as Record<string, unknown>)[name]);
  }
  return null;
}

function resourceOf(run: RunLike, key: "requests" | "transferKB" | "decodedKB" | "cachedRequests"): number | null {
  if (!run || typeof run !== "object") return null;
  const r = (run as { resources?: unknown; stats?: unknown }).resources;
  const s = (run as { resources?: unknown; stats?: unknown }).stats;
  const fromRes =
    r && typeof r === "object" ? cleanNum((r as Record<string, unknown>)[key]) : null;
  if (fromRes !== null) return fromRes;
  if (key === "requests") {
    const total =
      r && typeof r === "object" ? cleanNum((r as Record<string, unknown>).total) : null;
    if (total !== null) return total;
  }
  if (s && typeof s === "object") {
    const fromStats = cleanNum((s as Record<string, unknown>)[key]);
    if (fromStats !== null) return fromStats;
  }
  return null;
}

/**
 * Pure: per-metric diffs between two runs; diff is null unless both exist.
 * Accepts MeasurementRun-shaped ({ vitals: { LCP… }, resources }) and
 * snapshot-shaped ({ vitals: [{ name, value }], resources }) inputs.
 * Missing runs yield all-null diffs (never throws, never fabricated).
 */
export function diffRuns(
  baseline: RunLike,
  adaptive: RunLike
): RunDiffs {
  if (baseline == null && adaptive == null) return emptyDiffs();
  return {
    LCP: pair(vitalOf(baseline, "LCP"), vitalOf(adaptive, "LCP"), "ms"),
    FCP: pair(vitalOf(baseline, "FCP"), vitalOf(adaptive, "FCP"), "ms"),
    CLS: pair(vitalOf(baseline, "CLS"), vitalOf(adaptive, "CLS"), "cls"),
    INP: pair(vitalOf(baseline, "INP"), vitalOf(adaptive, "INP"), "ms"),
    requests: pair(resourceOf(baseline, "requests"), resourceOf(adaptive, "requests"), "count"),
    transferKB: pair(
      resourceOf(baseline, "transferKB"),
      resourceOf(adaptive, "transferKB"),
      "kb"
    ),
  };
}

/**
 * Pure: decoded-payload diff between two runs (kb kind).
 * Null unless both sides carry real numbers; never throws, never fabricated.
 */
export function diffDecoded(baseline: RunLike, adaptive: RunLike): RunDiff {
  return pair(resourceOf(baseline, "decodedKB"), resourceOf(adaptive, "decodedKB"), "kb");
}

type VitalsLike =
  | Array<{ name: string; value: number | null }>
  | Record<string, number | null | undefined>
  | { LCP?: number | null; FCP?: number | null; CLS?: number | null; INP?: number | null };

function pickVital(vitals: VitalsLike, name: "LCP" | "FCP" | "CLS" | "INP"): number | null {
  if (Array.isArray(vitals)) {
    const matches = vitals.filter((v) => v && v.name === name);
    if (matches.length === 0) return null;
    return cleanNum(matches[matches.length - 1].value);
  }
  if (vitals && typeof vitals === "object") {
    return cleanNum((vitals as Record<string, unknown>)[name]);
  }
  return null;
}

/**
 * Pure: build a MeasurementRun snapshot. takenAt is always a fresh timestamp.
 * decision accepts { mode } or a plain mode string; vitals accepts an array of
 * { name, value } or a { LCP, FCP, CLS, INP } record. All args optional.
 */
export function captureRun(
  id: "baseline" | "adaptive" = "baseline",
  decision: { mode: string } | string | null | undefined = "N/A",
  vitals?: VitalsLike | null,
  stats?: { requests?: number | null; transferKB?: number | null; decodedKB?: number | null; cachedRequests?: number | null } | null
): MeasurementRun {
  const mode =
    typeof decision === "string"
      ? decision
      : typeof decision?.mode === "string" && decision.mode.trim() !== ""
        ? decision.mode
        : "N/A";
  const v: VitalsLike = vitals ?? {};
  const resources: MeasurementRun["resources"] = {
    requests: cleanNum(stats?.requests),
    transferKB: cleanNum(stats?.transferKB),
  };
  // Optional decoded/cached fields: present only when the caller supplied
  // them (null preserved, absent stays absent so old-shape toEqual holds).
  if (stats && "decodedKB" in stats) resources.decodedKB = cleanNum(stats.decodedKB);
  if (stats && "cachedRequests" in stats) resources.cachedRequests = cleanNum(stats.cachedRequests);
  return {
    id,
    takenAt: new Date().toISOString(),
    mode,
    vitals: {
      LCP: pickVital(v, "LCP"),
      FCP: pickVital(v, "FCP"),
      CLS: pickVital(v, "CLS"),
      INP: pickVital(v, "INP"),
    },
    resources,
  };
}

function isValidRun(parsed: unknown): parsed is MeasurementRun {
  if (!parsed || typeof parsed !== "object") return false;
  const r = parsed as Record<string, unknown>;
  if (typeof r.id !== "string" || r.id.trim() === "") return false;
  if (typeof r.takenAt !== "string" || typeof r.mode !== "string") return false;
  const v = r.vitals as Record<string, unknown> | undefined;
  const res = r.resources as Record<string, unknown> | undefined;
  if (!v || !res) return false;
  for (const k of ["LCP", "FCP", "CLS", "INP"]) {
    const n = v[k];
    if (n !== null && n !== undefined && (typeof n !== "number" || Number.isNaN(n))) return false;
  }
  for (const k of ["requests", "transferKB", "decodedKB", "cachedRequests"]) {
    const n = res[k];
    if (n !== null && n !== undefined && (typeof n !== "number" || Number.isNaN(n))) return false;
  }
  return true;
}

function keyFor(id: string): string {
  if (id === "baseline") return RUN_BASELINE_KEY;
  if (id === "adaptive") return RUN_ADAPTIVE_KEY;
  return `awd-run-${id}-v1`;
}

// Ids saved under generic (non-baseline/adaptive) keys, so clearRuns can
// remove them without ever touching the legacy "awd-baseline-v1" key.
const savedRunIds = new Set<string>();

export function saveRun(run: MeasurementRun): void {
  try {
    if (typeof window === "undefined") return;
    const id = String((run as { id?: unknown })?.id ?? "");
    if (id.trim() === "") return;
    window.localStorage.setItem(keyFor(id), JSON.stringify(run));
    savedRunIds.add(id);
  } catch {
    // storage unavailable — ignore
  }
}

export function loadRun(id: "baseline" | "adaptive" | string): MeasurementRun | null {
  try {
    if (typeof window === "undefined") return null;
    const raw = window.localStorage.getItem(keyFor(String(id)));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    return isValidRun(parsed) ? (parsed as MeasurementRun) : null;
  } catch {
    return null;
  }
}

export function clearRuns(): void {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(RUN_BASELINE_KEY);
    window.localStorage.removeItem(RUN_ADAPTIVE_KEY);
    savedRunIds.forEach((id) => {
      try {
        window.localStorage.removeItem(keyFor(id));
      } catch {
        // ignore per-key errors
      }
    });
    savedRunIds.clear();
  } catch {
    // ignore
  }
}

const RUN_PENDING_KEY = "awd-run-pending-v1";

/** Persist the id of the in-progress run; window-guarded, never throws. */
export function setPendingRun(id: string): void {
  try {
    if (typeof window === "undefined") return;
    const v = String((id as unknown) ?? "");
    if (v.trim() === "") return;
    window.localStorage.setItem(RUN_PENDING_KEY, v);
  } catch {
    // storage unavailable — ignore
  }
}

/** Read the pending run id, or null when absent/invalid/SSR; never throws. */
export function getPendingRun(): string | null {
  try {
    if (typeof window === "undefined") return null;
    const raw = window.localStorage.getItem(RUN_PENDING_KEY);
    if (typeof raw !== "string" || raw.trim() === "") return null;
    return raw;
  } catch {
    return null;
  }
}

/** Clear the pending run id; window-guarded, never throws. */
export function clearPendingRun(): void {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(RUN_PENDING_KEY);
  } catch {
    // ignore
  }
}

function runCell(v: number | null | undefined, unit: string): string {
  if (v === null || v === undefined) return "N/A";
  const body = String(round2(v));
  return unit === "" ? body : `${body} ${unit}`;
}

/** Runs + difference section appended to the markdown report (N/A-aware). */
export function runsToMarkdown(
  baseline: MeasurementRun | null | undefined,
  adaptive: MeasurementRun | null | undefined
): string {
  const lines: string[] = [];
  lines.push("## Baseline vs Adaptive (measured runs)");
  lines.push("");
  if (!baseline && !adaptive) {
    lines.push("N/A — no measurements recorded yet.");
    lines.push("");
    return lines.join("\n");
  }
  lines.push(`- Baseline run: ${baseline ? `${mdVal(baseline.mode)} @ ${mdVal(baseline.takenAt)}` : "N/A"}`);
  lines.push(`- Adaptive run: ${adaptive ? `${mdVal(adaptive.mode)} @ ${mdVal(adaptive.takenAt)}` : "N/A"}`);
  lines.push("");
  lines.push("| Metric | Baseline | Adaptive | Difference |");
  lines.push("| --- | --- | --- | --- |");
  const d = diffRuns(baseline, adaptive);
  const rows: Array<[string, RunDiff, string]> = [
    ["LCP", d.LCP, "ms"],
    ["FCP", d.FCP, "ms"],
    ["CLS", d.CLS, ""],
    ["INP", d.INP, "ms"],
    ["Requests", d.requests, ""],
    ["Transfer", d.transferKB, "KB"],
  ];
  for (const [label, r, unit] of rows) {
    const diff = r.diff === null ? "N/A" : r.diff;
    lines.push(`| ${label} | ${runCell(r.baseline, unit)} | ${runCell(r.adaptive, unit)} | ${diff} |`);
  }
  lines.push("");
  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Builder-3: printable HTML fragment for window.print() → Save as PDF.
// Additive only; every existing export above is untouched.
// ---------------------------------------------------------------------------

function escHtml(v: unknown): string {
  return String(v ?? "N/A")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function printNum(v: number | null | undefined, unit = ""): string {
  if (v === null || v === undefined || Number.isNaN(v)) return "N/A";
  const body = String(Math.round(v * 100) / 100);
  return unit === "" ? body : `${body} ${unit}`;
}

function printCell(v: string): string {
  const s = v.trim();
  return escHtml(s === "" ? "N/A" : v);
}

/**
 * Self-contained printable HTML fragment (inline styles, black-on-white)
 * with tables for vitals / resources / baseline-vs-current difference.
 * Null/missing values render as N/A; reasons (not in the snapshot) render
 * as a list when provided. Never throws — falls back to a short paragraph.
 */
export function toPrintHTML(r: ReportSnapshot, reasons?: string[]): string {
  try {
    const snap = r as ReportSnapshot;
    const vitalsRows =
      snap.vitals.length === 0
        ? `<tr><td style="border:1px solid #000;padding:4px 8px;">N/A</td><td style="border:1px solid #000;padding:4px 8px;">N/A</td><td style="border:1px solid #000;padding:4px 8px;">N/A</td></tr>`
        : snap.vitals
            .map(
              (v) =>
                `<tr><td style="border:1px solid #000;padding:4px 8px;">${printCell(v.name)}</td>` +
                `<td style="border:1px solid #000;padding:4px 8px;">${printCell(v.mode)}</td>` +
                `<td style="border:1px solid #000;padding:4px 8px;">${escHtml(printNum(v.value))}</td></tr>`
            )
            .join("");
    const baselineBlock = snap.baseline
      ? `<h2 style="font-size:14px;margin:16px 0 4px;">Baseline (saved snapshot)</h2>` +
        `<p>Taken at: ${printCell(snap.baseline.takenAt)} | Mode: ${printCell(snap.baseline.mode)} | URL: ${printCell(snap.baseline.url)}</p>`
      : `<h2 style="font-size:14px;margin:16px 0 4px;">Baseline</h2><p>N/A — no baseline saved yet.</p>`;
    const reasonsBlock =
      reasons && reasons.length > 0
        ? `<h2 style="font-size:14px;margin:16px 0 4px;">Reasons</h2><ul>` +
          reasons.map((x) => `<li>${printCell(x)}</li>`).join("") +
          `</ul>`
        : "";
    const th = `border:1px solid #000;padding:4px 8px;background:#eee;text-align:left;`;
    const td = `border:1px solid #000;padding:4px 8px;`;
    return (
      `<div style="color:#000;background:#fff;font-family:Arial,sans-serif;font-size:12px;">` +
      `<h1 style="font-size:18px;margin:0 0 8px;">Adaptive Web Delivery — Performance Report</h1>` +
      `<p>Taken at: ${printCell(snap.takenAt)} | URL: ${printCell(snap.url)} | Mode: ${printCell(snap.mode)} | Confidence: ${printCell(snap.confidence)}</p>` +
      `<h2 style="font-size:14px;margin:16px 0 4px;">Network</h2>` +
      `<table style="border-collapse:collapse;width:100%;"><thead><tr>` +
      `<th style="${th}">Effective type</th><th style="${th}">Save-Data</th><th style="${th}">Downlink</th><th style="${th}">RTT</th><th style="${th}">Source</th>` +
      `</tr></thead><tbody><tr>` +
      `<td style="${td}">${printCell(snap.network.effectiveType ?? "N/A")}</td>` +
      `<td style="${td}">${snap.network.saveData ? "ON" : "OFF"}</td>` +
      `<td style="${td}">${escHtml(printNum(snap.network.downlink))}</td>` +
      `<td style="${td}">${escHtml(printNum(snap.network.rtt))}</td>` +
      `<td style="${td}">${printCell(snap.network.source)}</td>` +
      `</tr></tbody></table>` +
      `<h2 style="font-size:14px;margin:16px 0 4px;">Device</h2>` +
      `<table style="border-collapse:collapse;width:100%;"><thead><tr>` +
      `<th style="${th}">Cores</th><th style="${th}">Memory (GB)</th>` +
      `</tr></thead><tbody><tr>` +
      `<td style="${td}">${escHtml(printNum(snap.device.cores))}</td>` +
      `<td style="${td}">${escHtml(printNum(snap.device.memory))}</td>` +
      `</tr></tbody></table>` +
      `<h2 style="font-size:14px;margin:16px 0 4px;">Web vitals</h2>` +
      `<table style="border-collapse:collapse;width:100%;"><thead><tr>` +
      `<th style="${th}">Metric</th><th style="${th}">Mode</th><th style="${th}">Value</th>` +
      `</tr></thead><tbody>${vitalsRows}</tbody></table>` +
      `<h2 style="font-size:14px;margin:16px 0 4px;">Resources</h2>` +
      `<table style="border-collapse:collapse;width:100%;"><thead><tr>` +
      `<th style="${th}">Requests</th><th style="${th}">Transfer</th>` +
      `</tr></thead><tbody><tr>` +
      `<td style="${td}">${snap.resources.requests === null || snap.resources.requests === undefined ? "N/A" : escHtml(String(snap.resources.requests))}</td>` +
      `<td style="${td}">${snap.resources.transferKB === null || snap.resources.transferKB === undefined ? "N/A" : escHtml(printNum(snap.resources.transferKB, "KB"))}</td>` +
      `</tr></tbody></table>` +
      baselineBlock +
      reasonsBlock +
      `</div>`
    );
  } catch {
    return "<p>Report unavailable</p>";
  }
}
