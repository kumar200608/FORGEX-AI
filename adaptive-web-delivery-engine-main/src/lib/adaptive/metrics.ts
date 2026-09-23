export type MetricState = "loading" | "measured" | "unavailable" | "waiting";
export interface MeasuredValue<T> { state: MetricState; value: T | null; unit: string; note?: string }
export type ResourceCategory = "images" | "scripts" | "styles" | "others";
export interface ResourceBreakdown { total: number | null; images: number | null; scripts: number | null; styles: number | null; others: number | null; transferKB: number | null; transferState: MetricState; note?: string }

export interface ResourceStats {
  requests: number | null;
  transferKB: number | null;
}

export interface NavigationStats {
  domContentLoaded: number;
  load: number;
}

function roundKB(bytes: number): number {
  return Math.round((bytes / 1024) * 100) / 100;
}

export function getResourceStats(): ResourceStats {
  try {
    if (typeof window === "undefined" || typeof performance === "undefined") {
      return { requests: null, transferKB: null };
    }
    const entries = performance.getEntriesByType("resource") as PerformanceResourceTiming[];
    if (!entries) return { requests: null, transferKB: null };
    let bytes = 0;
    let hasBytes = false;
    for (const e of entries) {
      const size = (e as any).transferSize;
      if (typeof size === "number" && size > 0) {
        bytes += size;
        hasBytes = true;
      }
    }
    return { requests: entries.length, transferKB: hasBytes ? roundKB(bytes) : null };
  } catch {
    return { requests: null, transferKB: null };
  }
}

export interface InjectableResourceEntry {
  initiatorType?: unknown;
  transferSize?: unknown;
}

function categoryFor(initiatorType: unknown): ResourceCategory {
  if (initiatorType === "img") return "images";
  if (initiatorType === "script") return "scripts";
  if (initiatorType === "css") return "styles";
  return "others";
}

/** Pure categorizer over injected entries — testable without a browser. */
export function categorizeResourceEntries(
  entries: readonly InjectableResourceEntry[] | null | undefined
): ResourceBreakdown {
  if (!entries) {
    return {
      total: null,
      images: null,
      scripts: null,
      styles: null,
      others: null,
      transferKB: null,
      transferState: "unavailable",
      note: "transferSize hidden for cross-origin/cached entries",
    };
  }
  let images = 0;
  let scripts = 0;
  let styles = 0;
  let others = 0;
  let bytes = 0;
  let hasBytes = false;
  for (const e of entries) {
    const cat = categoryFor((e as any)?.initiatorType);
    if (cat === "images") images += 1;
    else if (cat === "scripts") scripts += 1;
    else if (cat === "styles") styles += 1;
    else others += 1;
    const size = (e as any)?.transferSize;
    if (typeof size === "number" && size > 0) {
      bytes += size;
      hasBytes = true;
    }
  }
  if (!hasBytes) {
    return {
      total: entries.length,
      images,
      scripts,
      styles,
      others,
      transferKB: null,
      transferState: "unavailable",
      note: "transferSize hidden for cross-origin/cached entries",
    };
  }
  return {
    total: entries.length,
    images,
    scripts,
    styles,
    others,
    transferKB: roundKB(bytes),
    transferState: "measured",
  };
}

export function getResourceBreakdown(): ResourceBreakdown {
  try {
    if (typeof window === "undefined" || typeof performance === "undefined") {
      return categorizeResourceEntries(null);
    }
    const entries = performance.getEntriesByType("resource") as PerformanceResourceTiming[];
    if (!entries) return categorizeResourceEntries(null);
    return categorizeResourceEntries(entries as unknown as InjectableResourceEntry[]);
  } catch {
    return categorizeResourceEntries(null);
  }
}

export function getNavigationTiming(): NavigationStats | null {
  try {
    if (typeof window === "undefined" || typeof performance === "undefined") return null;
    const entries = performance.getEntriesByType("navigation") as PerformanceNavigationTiming[];
    const nav = entries[0];
    if (!nav) return null;
    return {
      domContentLoaded: (nav as any).domContentLoadedEventEnd ?? 0,
      load: (nav as any).loadEventEnd ?? 0,
    };
  } catch {
    return null;
  }
}
