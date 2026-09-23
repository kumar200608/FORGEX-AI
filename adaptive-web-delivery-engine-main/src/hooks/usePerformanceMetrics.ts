"use client";

import { useEffect, useState } from "react";
import { readStoredVitals } from "@/lib/vitalsLogger";
import * as metricsMod from "@/lib/adaptive/metrics";

import type { StoredVital } from "@/lib/vitalsLogger";
import type {
  NavigationStats,
  ResourceBreakdown,
} from "@/lib/adaptive/metrics";

// Local 4-line contract copy (no cross-import cycle risk if Builder-1 moves
// MetricState/MeasuredValue elsewhere).
export type MetricState = "loading" | "measured" | "unavailable" | "waiting";

export interface MeasuredValue<T> {
  state: MetricState;
  value: T | null;
  unit: string;
  note?: string;
}

export type VitalName = "LCP" | "FCP" | "CLS" | "INP";

export interface PerformanceMetrics {
  vitals: Record<VitalName, MeasuredValue<number>>;
  readings: StoredVital[];
  resources: ResourceBreakdown;
  navigation: NavigationStats | null;
}

const VITAL_NAMES: VitalName[] = ["LCP", "FCP", "CLS", "INP"];

// Raw stored values are kept as-is (ms for LCP/FCP/INP); CLS is unitless.
const VITAL_UNITS: Record<VitalName, string> = {
  LCP: "ms",
  FCP: "ms",
  CLS: "",
  INP: "ms",
};

const WAITING_NOTES: Record<VitalName, string> = {
  LCP: "LCP waits for largest paint",
  FCP: "FCP waits for first paint",
  CLS: "CLS waits for layout shifts",
  INP: "INP waits for an interaction",
};

function loadingVitals(): Record<VitalName, MeasuredValue<number>> {
  return {
    LCP: { state: "loading", value: null, unit: VITAL_UNITS.LCP },
    FCP: { state: "loading", value: null, unit: VITAL_UNITS.FCP },
    CLS: { state: "loading", value: null, unit: VITAL_UNITS.CLS },
    INP: { state: "loading", value: null, unit: VITAL_UNITS.INP },
  };
}

function buildVitals(
  readings: StoredVital[]
): Record<VitalName, MeasuredValue<number>> {
  const latest = new Map<string, number>();
  for (const r of readings) {
    if (!r || typeof r.name !== "string") continue;
    if (typeof r.value !== "number" || !Number.isFinite(r.value)) continue;
    latest.set(r.name.toUpperCase(), r.value);
  }
  const out = loadingVitals();
  for (const name of VITAL_NAMES) {
    const v = latest.get(name);
    if (v === undefined) {
      out[name] = {
        state: "waiting",
        value: null,
        unit: VITAL_UNITS[name],
        note: WAITING_NOTES[name],
      };
    } else {
      out[name] = { state: "measured", value: v, unit: VITAL_UNITS[name] };
    }
  }
  return out;
}

type MetricsModuleShape = {
  getResourceBreakdown?: () => unknown;
  getResourceStats?: () => unknown;
  getNavigationTiming?: () => unknown;
};

function toNullableNumber(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

function loadingResources(): ResourceBreakdown {
  return {
    total: null,
    images: null,
    scripts: null,
    styles: null,
    others: null,
    transferKB: null,
    transferState: "loading",
  };
}

function unavailableResources(note: string): ResourceBreakdown {
  return {
    total: null,
    images: null,
    scripts: null,
    styles: null,
    others: null,
    transferKB: null,
    transferState: "unavailable",
    note,
  };
}

function isBreakdown(raw: unknown): raw is ResourceBreakdown {
  if (!raw || typeof raw !== "object") return false;
  const r = raw as Record<string, unknown>;
  return (
    "total" in r &&
    "transferKB" in r &&
    "transferState" in r &&
    (r.transferState === "loading" ||
      r.transferState === "measured" ||
      r.transferState === "unavailable" ||
      r.transferState === "waiting")
  );
}

function readResources(): ResourceBreakdown {
  try {
    const mod = metricsMod as unknown as MetricsModuleShape;
    if (typeof mod.getResourceBreakdown === "function") {
      const raw: unknown = mod.getResourceBreakdown();
      // B1 may widen its return to null-inclusive — normalize defensively.
      if (isBreakdown(raw)) {
        return {
          ...raw,
          total: toNullableNumber(raw.total),
          images: toNullableNumber(raw.images),
          scripts: toNullableNumber(raw.scripts),
          styles: toNullableNumber(raw.styles),
          others: toNullableNumber(raw.others),
          transferKB: toNullableNumber(raw.transferKB),
        };
      }
      return unavailableResources("resource timing unavailable");
    }
    // Legacy fallback (pre-B1 metrics.ts): map ResourceStats into the
    // breakdown shape without fabricating per-category counts.
    if (typeof mod.getResourceStats === "function") {
      const raw = mod.getResourceStats() as Record<string, unknown>;
      const transferKB = toNullableNumber(raw?.transferKB);
      return {
        total: toNullableNumber(raw?.requests),
        images: null,
        scripts: null,
        styles: null,
        others: null,
        transferKB,
        transferState: transferKB === null ? "unavailable" : "measured",
        note: "per-category counts unavailable",
      };
    }
  } catch {
    // fall through — never fabricate
  }
  return unavailableResources("resource timing unavailable");
}

function readNavigation(): NavigationStats | null {
  try {
    const mod = metricsMod as unknown as MetricsModuleShape;
    if (typeof mod.getNavigationTiming !== "function") return null;
    const nav = mod.getNavigationTiming() as NavigationStats | null;
    if (!nav || typeof nav !== "object") return null;
    return nav;
  } catch {
    return null;
  }
}

function readReadings(): StoredVital[] {
  try {
    const rows = readStoredVitals();
    return Array.isArray(rows) ? rows : [];
  } catch {
    return [];
  }
}

function collectSnapshot(): PerformanceMetrics {
  const readings = readReadings();
  return {
    vitals: buildVitals(readings),
    readings,
    resources: readResources(),
    navigation: readNavigation(),
  };
}

export function usePerformanceMetrics(): PerformanceMetrics {
  // SSR-first: loading states with null values until the mount effect runs.
  const [snapshot, setSnapshot] = useState<PerformanceMetrics>(() => ({
    vitals: loadingVitals(),
    readings: [],
    resources: loadingResources(),
    navigation: null,
  }));

  useEffect(() => {
    let lastSerial = "";
    const tick = () => {
      const next = collectSnapshot();
      const serial = JSON.stringify(next);
      // Poll every 3s but only setState when the snapshot actually changed —
      // no fake updates / no render churn.
      if (serial !== lastSerial) {
        lastSerial = serial;
        setSnapshot(next);
      }
    };
    tick();
    const id = setInterval(tick, 3000);
    return () => clearInterval(id);
  }, []);

  return snapshot;
}
