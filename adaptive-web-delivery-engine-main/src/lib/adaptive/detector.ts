import { PROBE_URL } from "@/lib/adaptive/rules";

export interface ConnectionReading {
  effectiveType: string | null;
  saveData: boolean;
  downlink: number | null;
  rtt: number | null;
}

export function readConnection(): ConnectionReading | null {
  try {
    if (typeof navigator === "undefined") return null;
    const conn =
      (navigator as any).connection ||
      (navigator as any).mozConnection ||
      (navigator as any).webkitConnection;
    if (!conn) return null;
    return {
      effectiveType: conn.effectiveType ?? null,
      saveData: !!conn.saveData,
      downlink: typeof conn.downlink === "number" ? conn.downlink : null,
      rtt: typeof conn.rtt === "number" ? conn.rtt : null,
    };
  } catch {
    return null;
  }
}

export async function probeSpeed(): Promise<{ effectiveType: string | null; rtt: number | null }> {
  try {
    const start = performance.now();
    await fetch(PROBE_URL, { cache: "no-store" });
    const duration = performance.now() - start;
    let effectiveType: string;
    if (duration < 200) effectiveType = "4g";
    else if (duration < 600) effectiveType = "3g";
    else effectiveType = "2g";
    return { effectiveType, rtt: duration };
  } catch {
    return { effectiveType: null, rtt: null };
  }
}

// NetworkInfo-like return: always includes `source`; extra `rtt` attached
// defensively so we compile before Builder-1 lands the type update.
export async function detectNetwork(): Promise<any> {
  try {
    const conn = readConnection();
    if (conn && (conn.effectiveType !== null || conn.downlink !== null || conn.rtt !== null)) {
      return { ...conn, source: "api" };
    }
    if (conn && conn.effectiveType !== null) {
      return { ...conn, source: "api" };
    }
    try {
      const probed = await probeSpeed();
      if (probed.effectiveType !== null) {
        return {
          effectiveType: probed.effectiveType,
          saveData: false,
          downlink: null,
          rtt: probed.rtt,
          source: "probe",
        };
      }
    } catch {
      // fall through to unknown
    }
    return {
      effectiveType: conn?.effectiveType ?? null,
      saveData: conn?.saveData ?? false,
      downlink: conn?.downlink ?? null,
      rtt: conn?.rtt ?? null,
      source: "unknown",
    };
  } catch {
    return { effectiveType: null, saveData: false, downlink: null, rtt: null, source: "unknown" };
  }
}
