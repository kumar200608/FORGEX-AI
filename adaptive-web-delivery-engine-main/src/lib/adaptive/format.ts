import type { MetricState } from "./metrics";

/** Format milliseconds as trimmed "X.XX s"; null/NaN/non-finite → "N/A". Never throws. */
export function formatMs(v: number | null | undefined): string {
  try {
    if (v === null || v === undefined) return "N/A";
    if (typeof v !== "number" || Number.isNaN(v) || !Number.isFinite(v)) return "N/A";
    return `${(v / 1000).toFixed(2)} s`.trim();
  } catch {
    return "N/A";
  }
}

/** Format CLS (unitless) with 3 decimals; null/NaN/non-finite → "N/A". Never throws. */
export function formatCLS(v: number | null | undefined): string {
  try {
    if (v === null || v === undefined) return "N/A";
    if (typeof v !== "number" || Number.isNaN(v) || !Number.isFinite(v)) return "N/A";
    return v.toFixed(3);
  } catch {
    return "N/A";
  }
}

/** Format kilobytes as "X KB" (2-decimal rounding); null/NaN/non-finite → "N/A". Never throws. */
export function formatKB(v: number | null | undefined): string {
  try {
    if (v === null || v === undefined) return "N/A";
    if (typeof v !== "number" || Number.isNaN(v) || !Number.isFinite(v)) return "N/A";
    return `${Math.round(v * 100) / 100} KB`;
  } catch {
    return "N/A";
  }
}

/** Human label for a MetricState. Never throws. */
export function stateLabel(s: MetricState | unknown): string {
  try {
    switch (s) {
      case "loading":
        return "Loading\u2026";
      case "measured":
        return "Measured";
      case "unavailable":
        return "Unavailable";
      case "waiting":
        return "Waiting for measurement";
      default:
        return "Unavailable";
    }
  } catch {
    return "Unavailable";
  }
}
