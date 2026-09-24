// Central adaptive thresholds — single source of truth (spec §17).
// decisionEngine.ts re-exports these for backward compatibility with existing
// imports/tests. One-way dependency: rules -> nothing; engine -> rules.
export const SLOW_NETWORK_TYPES = ["slow-2g", "2g", "3g"] as const;
export const MIN_DOWNLINK_MBPS = 1.5;
export const MIN_CORES = 2;
export const MIN_DEVICE_MEMORY_GB = 2;
export const MAX_RTT_MS = 400;
export const PROBE_URL = "/probe/probe-50kb.bin";
export const PROBE_TIMEOUT_MS = 5000;
