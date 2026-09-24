import type { NetworkInfo, DeviceInfo, AdaptiveMode } from "@/types";
import { MAX_RTT_MS, SLOW_NETWORK_TYPES, MIN_DOWNLINK_MBPS, MIN_CORES, MIN_DEVICE_MEMORY_GB } from "./adaptive/rules";
// Re-exported from lib/adaptive/rules.ts (single source of truth, spec §17).
export {
  SLOW_NETWORK_TYPES,
  MIN_DOWNLINK_MBPS,
  MIN_CORES,
  MIN_DEVICE_MEMORY_GB,
  MAX_RTT_MS,
} from "./adaptive/rules";
export function decideMode(network: NetworkInfo, device: DeviceInfo): AdaptiveMode {
  if (network.source === "unknown") return "CONSTRAINED";
  if (network.saveData) return "CONSTRAINED";
  if (network.effectiveType && (SLOW_NETWORK_TYPES as readonly string[]).includes(network.effectiveType)) return "CONSTRAINED";
  if (network.downlink !== null && network.downlink < MIN_DOWNLINK_MBPS) return "CONSTRAINED";
  if ((network as any).rtt != null && (network as any).rtt > MAX_RTT_MS) return "CONSTRAINED";
  if (device.hardwareConcurrency !== null && device.hardwareConcurrency <= MIN_CORES) return "CONSTRAINED";
  if (device.deviceMemory !== null && device.deviceMemory <= MIN_DEVICE_MEMORY_GB) return "CONSTRAINED";
  return "FULL";
}
