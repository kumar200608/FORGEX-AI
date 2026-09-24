import { onCLS, onFCP, onLCP, onINP, Metric } from "web-vitals";
const STORAGE_KEY = "adaptive-web-vitals";
export interface StoredVital { mode: string; name: string; value: number; id: string; ts: number; transferKB?: number | null; requests?: number; }
let initialized = false;
export function initVitalsLogging(getMode: () => string) {
  if (initialized) return; initialized = true;
  const record = (metric: Metric) => {
    const entry: StoredVital = { mode: getMode(), name: metric.name, value: metric.value, id: metric.id, ts: Date.now() };
    try {
      const resources = performance.getEntriesByType("resource") as PerformanceResourceTiming[];
      let bytes = 0;
      let hasBytes = false;
      for (const r of resources) {
        const size = (r as any).transferSize;
        if (typeof size === "number" && size > 0) {
          bytes += size;
          hasBytes = true;
        }
      }
      entry.requests = resources.length;
      entry.transferKB = hasBytes ? Math.round((bytes / 1024) * 100) / 100 : null;
    } catch {}
    try {
      const existing: StoredVital[] = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "[]");
      existing.push(entry);
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
    } catch {}
    console.log(`[${entry.mode}] ${entry.name}:`, entry.value);
  };
  onCLS(record);
  onFCP(record);
  onLCP(record, { reportAllChanges: true });
  onINP(record);
}
export function readStoredVitals(): StoredVital[] {
  if (typeof window === "undefined") return [];
  let list: StoredVital[] = [];
  try {
    list = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    list = [];
  }
  const hasLCP = list.some((v) => v.name === "LCP");
  if (!hasLCP && typeof performance !== "undefined" && typeof performance.getEntriesByType === "function") {
    try {
      const lcpEntries = performance.getEntriesByType("largest-contentful-paint");
      if (lcpEntries.length > 0) {
        const last = lcpEntries[lcpEntries.length - 1];
        const val = last.startTime || (last as any).renderTime || (last as any).loadTime;
        if (typeof val === "number" && val > 0) {
          list.push({
            mode: list.length > 0 ? list[0].mode : "FULL",
            name: "LCP",
            value: val,
            id: "lcp-fallback-" + Date.now(),
            ts: Date.now(),
          });
        }
      }
    } catch {}
  }
  return list;
}
