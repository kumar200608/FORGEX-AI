import { describe, it, expect } from "vitest";
import {
  getResourceStats,
  getResourceBreakdown,
  categorizeResourceEntries,
} from "./metrics";
import { formatMs, formatCLS, formatKB, stateLabel } from "./format";

describe("getResourceStats (SSR / node — no window)", () => {
  it("returns null requests and null transferKB when performance is unavailable", () => {
    expect(getResourceStats()).toEqual({ requests: null, transferKB: null });
  });
});

describe("getResourceBreakdown (SSR / node — no window)", () => {
  it("returns null counts with unavailable transferState", () => {
    const b = getResourceBreakdown();
    expect(b.total).toBeNull();
    expect(b.images).toBeNull();
    expect(b.transferKB).toBeNull();
    expect(b.transferState).toBe("unavailable");
    expect(b.note).toContain("transferSize hidden");
  });
});

describe("categorizeResourceEntries", () => {
  it("maps initiatorTypes img/script/css/else to images/scripts/styles/others", () => {
    const b = categorizeResourceEntries([
      { initiatorType: "img", transferSize: 1024 },
      { initiatorType: "img", transferSize: 1024 },
      { initiatorType: "script", transferSize: 2048 },
      { initiatorType: "css", transferSize: 512 },
      { initiatorType: "fetch", transferSize: 256 },
      { initiatorType: "link", transferSize: 128 },
    ]);
    expect(b.total).toBe(6);
    expect(b.images).toBe(2);
    expect(b.scripts).toBe(1);
    expect(b.styles).toBe(1);
    expect(b.others).toBe(2);
    expect(b.transferState).toBe("measured");
    expect(b.transferKB).toBe(4.88);
  });

  it("reports unavailable + null transferKB when no positive transferSize observed", () => {
    const b = categorizeResourceEntries([
      { initiatorType: "img", transferSize: 0 },
      { initiatorType: "script" },
    ]);
    expect(b.total).toBe(2);
    expect(b.transferKB).toBeNull();
    expect(b.transferState).toBe("unavailable");
    expect(b.note).toContain("transferSize hidden");
  });
});

describe("format helpers (empty / null inputs)", () => {
  it("renders N/A for null, undefined, and NaN", () => {
    expect(formatMs(null)).toBe("N/A");
    expect(formatMs(undefined)).toBe("N/A");
    expect(formatMs(NaN)).toBe("N/A");
    expect(formatCLS(null)).toBe("N/A");
    expect(formatKB(null)).toBe("N/A");
    expect(formatKB(NaN)).toBe("N/A");
  });

  it("formats real values with units", () => {
    expect(formatMs(2500)).toBe("2.50 s");
    expect(formatCLS(0.0504)).toBe("0.050");
    expect(formatKB(512.789)).toBe("512.79 KB");
    expect(stateLabel("loading")).toBe("Loading\u2026");
    expect(stateLabel("measured")).toBe("Measured");
    expect(stateLabel("unavailable")).toBe("Unavailable");
    expect(stateLabel("waiting")).toBe("Waiting for measurement");
  });
});
