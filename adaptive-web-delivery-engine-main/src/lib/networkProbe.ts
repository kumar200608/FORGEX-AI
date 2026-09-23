import type { NetworkInfo } from "@/types";
export function readConnectionAPI(): NetworkInfo | null {
  if (typeof navigator === "undefined") return null;
  const conn = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
  if (!conn) return null;
  return { effectiveType: conn.effectiveType ?? null, saveData: !!conn.saveData, downlink: typeof conn.downlink === "number" ? conn.downlink : null, rtt: typeof conn.rtt === "number" ? conn.rtt : null, source: "api" } as unknown as NetworkInfo;
}
export async function probeNetworkSpeed(): Promise<NetworkInfo> {
  const testFileUrl = "/probe/probe-50kb.bin";
  const startTime = performance.now();
  try {
    await fetch(testFileUrl, { cache: "no-store" });
    const durationMs = performance.now() - startTime;
    let effectiveType: string;
    if (durationMs < 200) effectiveType = "4g";
    else if (durationMs < 600) effectiveType = "3g";
    else effectiveType = "2g";
    return { effectiveType, saveData: false, downlink: Math.round((50 * 8 / (durationMs / 1000) / 1024) * 100) / 100, rtt: durationMs, source: "probe" } as unknown as NetworkInfo;
  } catch {
    return { effectiveType: null, saveData: false, downlink: null, rtt: null, source: "unknown" } as unknown as NetworkInfo;
  }
}
export async function getNetworkInfo(): Promise<NetworkInfo> {
  const apiResult = readConnectionAPI();
  if (apiResult) return apiResult;
  return probeNetworkSpeed();
}
