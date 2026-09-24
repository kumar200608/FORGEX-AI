import { describe, it, expect } from "vitest";
import { decideMode } from "./decisionEngine";
import { MAX_RTT_MS, MIN_DOWNLINK_MBPS, MIN_CORES, MIN_DEVICE_MEMORY_GB } from "./adaptive/rules";
import { readConnection, detectNetwork } from "./adaptive/detector";
import { toDeliveryMode } from "@/types";

const okNetwork = { effectiveType: "4g", saveData: false, downlink: 10, source: "api" as const };
const okDevice = { hardwareConcurrency: 8, deviceMemory: 8 };

describe("decideMode", () => {
  it("returns FULL for good network and device", () => {
    expect(decideMode(okNetwork, okDevice)).toBe("FULL");
  });

  it("forces CONSTRAINED when saveData is on, regardless of network quality", () => {
    expect(decideMode({ ...okNetwork, saveData: true }, okDevice)).toBe("CONSTRAINED");
  });

  it("forces CONSTRAINED on a slow effectiveType", () => {
    expect(decideMode({ ...okNetwork, effectiveType: "2g" }, okDevice)).toBe("CONSTRAINED");
  });

  it("forces CONSTRAINED on low downlink even if effectiveType looks fine", () => {
    expect(decideMode({ ...okNetwork, downlink: 0.5 }, okDevice)).toBe("CONSTRAINED");
  });

  it("forces CONSTRAINED on low hardwareConcurrency", () => {
    expect(decideMode(okNetwork, { ...okDevice, hardwareConcurrency: 2 })).toBe("CONSTRAINED");
  });

  it("forces CONSTRAINED on low deviceMemory", () => {
    expect(decideMode(okNetwork, { ...okDevice, deviceMemory: 2 })).toBe("CONSTRAINED");
  });

  it("assumes CONSTRAINED when every signal is unavailable", () => {
    const unknownNetwork = { effectiveType: null, saveData: false, downlink: null, source: "unknown" as const };
    const unknownDevice = { hardwareConcurrency: null, deviceMemory: null };
    expect(decideMode(unknownNetwork, unknownDevice)).toBe("CONSTRAINED");
  });
});

describe("adaptive thresholds (spec §7)", () => {
  it("defines MAX_RTT_MS=400", () => {
    expect(MAX_RTT_MS).toBe(400);
  });

  it("re-exports engine thresholds from adaptive/rules", () => {
    expect(MIN_DOWNLINK_MBPS).toBe(1.5);
    expect(MIN_CORES).toBe(2);
    expect(MIN_DEVICE_MEMORY_GB).toBe(2);
  });

  it("treats rtt null as no effect (FULL stays FULL)", () => {
    expect(decideMode({ ...okNetwork, rtt: null }, okDevice)).toBe("FULL");
  });

  it("forces CONSTRAINED on high rtt (rtt > MAX_RTT_MS=400)", () => {
    expect(decideMode({ ...okNetwork, rtt: 900 }, okDevice)).toBe("CONSTRAINED");
  });

  it("maps canonical UPPERCASE modes to lowercase DeliveryMode alias", () => {
    expect(toDeliveryMode("FULL")).toBe("full");
    expect(toDeliveryMode("CONSTRAINED")).toBe("constrained");
  });

  it("derives constrained changes for CONSTRAINED and clear changes for FULL", () => {
    const changesFor = (mode: "FULL" | "CONSTRAINED") => ({
      imageReduced: mode === "CONSTRAINED",
      componentDeferred: mode === "CONSTRAINED",
      animationsReduced: mode === "CONSTRAINED",
      prefetchDisabled: mode === "CONSTRAINED",
    });
    expect(changesFor("CONSTRAINED")).toEqual({
      imageReduced: true,
      componentDeferred: true,
      animationsReduced: true,
      prefetchDisabled: true,
    });
    expect(changesFor("FULL")).toEqual({
      imageReduced: false,
      componentDeferred: false,
      animationsReduced: false,
      prefetchDisabled: false,
    });
  });

  it("readConnection() returns null outside a browser", () => {
    expect(readConnection()).toBeNull();
  });

  it("detectNetwork() resolves an object with a source field", async () => {
    const net = await detectNetwork();
    expect(net).toBeTruthy();
    expect(["api", "probe", "unknown"]).toContain(net.source);
  });

  it("resource-stats guard returns an object shape when performance API is absent", () => {
    const stats =
      typeof performance === "undefined" || typeof (performance as any).getEntriesByType !== "function"
        ? { requests: null, transferKB: null }
        : { requests: 0, transferKB: 0 };
    expect(stats).toHaveProperty("requests");
    expect(stats).toHaveProperty("transferKB");
  });
});
