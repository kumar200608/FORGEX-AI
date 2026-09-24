import { describe, it, expect } from "vitest";
import { reasonFor } from "./reason";

const baseNetwork = {
  effectiveType: "4g",
  saveData: false,
  downlink: 10,
  rtt: 50,
  source: "api",
};
const baseDevice = { hardwareConcurrency: 8, deviceMemory: 8 };

describe("reasonFor", () => {
  it("returns full-experience note when FULL with no constraints", () => {
    expect(
      reasonFor({ mode: "FULL", network: { ...baseNetwork }, device: { ...baseDevice } })
    ).toEqual(["No constraints detected \u2014 full experience"]);
  });

  it("orders forced pin first, then saveData, network, downlink, rtt, cpu, memory", () => {
    const reasons = reasonFor({
      mode: "CONSTRAINED",
      forced: "CONSTRAINED",
      network: { effectiveType: "2g", saveData: true, downlink: 0.8, rtt: 600, source: "api" },
      device: { hardwareConcurrency: 2, deviceMemory: 2 },
    });
    expect(reasons).toEqual([
      "Pinned via ?forceMode=CONSTRAINED",
      "Save-Data enabled",
      "Network: 2g",
      "Downlink 0.8 Mb/s (< 1.5)",
      "RTT 600 ms (> 400)",
      "CPU \u2264 2 cores",
      "Memory \u2264 2 GB",
    ]);
  });

  it("fires slow-2g network reason", () => {
    const reasons = reasonFor({
      mode: "CONSTRAINED",
      network: { ...baseNetwork, effectiveType: "slow-2g" },
      device: { ...baseDevice },
    });
    expect(reasons).toContain("Network: slow-2g");
  });

  it("adds fail-safe reason when source is unknown", () => {
    const reasons = reasonFor({
      mode: "CONSTRAINED",
      network: { effectiveType: null, saveData: false, downlink: null, rtt: null, source: "unknown" },
      device: { hardwareConcurrency: null, deviceMemory: null },
    });
    expect(reasons).toContain("No network signal \u2014 fail-safe CONSTRAINED");
  });

  it("never throws on garbage input", () => {
    expect(reasonFor(null)).toEqual([]);
    expect(reasonFor(undefined)).toEqual([]);
    expect(reasonFor({})).toEqual([]);
  });
});
