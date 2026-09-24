import type { DeviceInfo } from "@/types";
export function getDeviceInfo(): DeviceInfo {
  try {
    if (typeof navigator === "undefined") return { hardwareConcurrency: null, deviceMemory: null };
    return { hardwareConcurrency: navigator.hardwareConcurrency ?? null, deviceMemory: (navigator as any).deviceMemory ?? null };
  } catch {
    return { hardwareConcurrency: null, deviceMemory: null };
  }
}
