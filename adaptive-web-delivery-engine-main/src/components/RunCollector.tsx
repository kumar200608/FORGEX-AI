"use client";

import { useEffect, useRef, useState } from "react";
import { useAdaptiveMode } from "@/context/AdaptiveModeContext";
import { readStoredVitals } from "@/lib/vitalsLogger";
import { getNavigationTiming } from "@/lib/adaptive/metrics";
import * as R from "@/lib/adaptive/report";

type MeasureId = "baseline" | "adaptive";

function cleanNum(v: unknown): number | null {
  if (typeof v !== "number" || Number.isNaN(v)) return null;
  return v;
}

function roundKB(bytes: number): number {
  return Math.round((bytes / 1024) * 100) / 100;
}

function latestFor(
  vitals: { name: string; value: number }[],
  name: string
): number | null {
  const matches = vitals.filter((v) => v.name === name);
  if (matches.length === 0) return null;
  return cleanNum(matches[matches.length - 1].value);
}

/**
 * Guided-run collector mounted on /products. Dormant unless ?measure=baseline
 * or ?measure=adaptive is present. Waits for the page to settle, snapshots
 * vitals + resource weights via captureRun/saveRun, clears the pending flag,
 * then auto-returns to /performance?done=<id>. Never throws, never fabricates.
 */
export default function RunCollector() {
  const [mounted, setMounted] = useState(false);
  const [measure, setMeasure] = useState<MeasureId | null>(null);
  const [forceMode, setForceMode] = useState<string | null>(null);
  const { decision, status } = useAdaptiveMode();
  const decisionRef = useRef(decision);
  decisionRef.current = decision;
  const statusRef = useRef(status);
  statusRef.current = status;
  const doneRef = useRef(false);

  useEffect(() => {
    setMounted(true);
    try {
      const params = new URLSearchParams(window.location.search);
      const m = params.get("measure");
      setMeasure(m === "baseline" || m === "adaptive" ? m : null);
      setForceMode(params.get("forceMode"));
    } catch {
      setMeasure(null);
    }
  }, []);

  useEffect(() => {
    if (!mounted || !measure) return;
    const id = measure;
    let cancelled = false;
    let polls = 0;
    let settled = false;

    const collect = () => {
      if (cancelled || settled) return;
      settled = true;
      try {
        const t0 =
          typeof performance !== "undefined" &&
          typeof performance.timeOrigin === "number"
            ? performance.timeOrigin
            : 0;
        const stored = readStoredVitals().filter(
          (v) => typeof v.ts === "number" && v.ts >= t0
        );
        let lcpVal = latestFor(stored, "LCP");
        if (lcpVal === null && typeof performance !== "undefined" && typeof performance.getEntriesByType === "function") {
          try {
            const lcpEntries = performance.getEntriesByType("largest-contentful-paint");
            if (lcpEntries.length > 0) {
              const last = lcpEntries[lcpEntries.length - 1];
              const val = last.startTime || (last as any).renderTime || (last as any).loadTime;
              if (typeof val === "number" && val > 0) {
                lcpVal = Math.round(val * 100) / 100;
              }
            }
          } catch {}
        }
        const vitalsArray = [
          { name: "LCP", value: lcpVal },
          { name: "FCP", value: latestFor(stored, "FCP") },
          { name: "CLS", value: latestFor(stored, "CLS") },
          { name: "INP", value: latestFor(stored, "INP") },
        ];
        let requests: number | null = null;
        let transferKB: number | null = null;
        let decodedKB: number | null = null;
        let cachedRequests: number | null = null;
        try {
          if (typeof performance !== "undefined") {
            const entries = performance.getEntriesByType(
              "resource"
            ) as PerformanceResourceTiming[];
            requests = entries.length;
            let wire = 0;
            let hasWire = false;
            let decoded = 0;
            let hasDecoded = false;
            let cached = 0;
            for (const e of entries) {
              const t = (e as unknown as Record<string, unknown>).transferSize;
              const d = (e as unknown as Record<string, unknown>)
                .decodedBodySize;
              if (typeof t === "number" && t > 0) {
                wire += t;
                hasWire = true;
              }
              if (typeof d === "number" && d > 0) {
                decoded += d;
                hasDecoded = true;
              }
              if (t === 0 && typeof d === "number" && d > 0) cached += 1;
            }
            transferKB = hasWire ? roundKB(wire) : null;
            decodedKB = hasDecoded ? roundKB(decoded) : null;
            cachedRequests = cached;
          }
        } catch {
          // resource entries unavailable — nulls stand (never fabricated)
        }
        try {
          // Consulted for display timing context; result intentionally unused.
          void getNavigationTiming();
        } catch {
          // ignore
        }
        const mode = decisionRef.current.mode;
        const stats: {
          requests: number | null;
          transferKB: number | null;
          decodedKB?: number | null;
          cachedRequests?: number | null;
        } = {
          requests,
          transferKB,
          decodedKB,
          cachedRequests,
        };
        const run = R.captureRun(id, { mode }, vitalsArray, stats);
        R.saveRun(run);
        try {
          (
            R as unknown as { clearPendingRun?: () => void }
          ).clearPendingRun?.();
        } catch {
          // pending helpers land with Builder-1; absence is harmless
        }
      } catch {
        // collection is best-effort; auto-return still fires below
      }
    };

    const timer = setInterval(() => {
      if (cancelled || settled) return;
      polls += 1;
      let complete = false;
      try {
        complete =
          typeof document === "undefined" ||
          document.readyState === "complete";
      } catch {
        complete = true;
      }
      if ((complete && statusRef.current === "ready") || polls >= 10) {
        clearInterval(timer);
        collect();
      }
    }, 1000);

    const back = setTimeout(() => {
      if (cancelled || doneRef.current) return;
      doneRef.current = true;
      try {
        window.location.href = "/performance?done=" + id;
      } catch {
        // navigation unavailable (SSR/test) — ignore
      }
    }, 12000);

    return () => {
      cancelled = true;
      clearInterval(timer);
      clearTimeout(back);
    };
  }, [mounted, measure]);

  if (!mounted || !measure) return null;

  const mode = decision.mode;
  const forced = forceMode ? ` (forced ${forceMode})` : "";
  return (
    <p
      role="status"
      className="mx-auto max-w-6xl px-4 pt-3 text-xs text-slate-500"
    >
      Capturing {measure} run — mode {mode}
      {forced} — returning to Performance Lab…
    </p>
  );
}
