import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  buildReport,
  toMarkdown,
  toJSON,
  diffRuns,
  diffDecoded,
  captureRun,
  saveRun,
  loadRun,
  clearRuns,
  setPendingRun,
  getPendingRun,
  clearPendingRun,
  saveBaseline,
  loadBaseline,
  type BuildReportInput,
  type MeasurementRun,
} from "./report";

const fullInput: BuildReportInput = {
  decision: {
    mode: "CONSTRAINED",
    confidence: "high",
    network: { effectiveType: "3g", saveData: false, downlink: 0.8, rtt: 600, source: "api" },
    device: { hardwareConcurrency: 4, deviceMemory: 4 },
  },
  vitals: [
    { name: "LCP", mode: "CONSTRAINED", value: 2500.456 },
    { name: "CLS", mode: "CONSTRAINED", value: 0.05 },
  ],
  stats: { requests: 42, transferKB: 512.789 },
  baseline: {
    takenAt: "2026-01-01T00:00:00.000Z",
    url: "http://localhost:3000/?forceMode=FULL",
    userAgent: "test-agent",
    mode: "FULL",
    confidence: "high",
    network: { effectiveType: "4g", saveData: false, downlink: 10, rtt: 50, source: "api" },
    device: { cores: 8, memory: 8 },
    vitals: [{ name: "LCP", mode: "FULL", value: 4000 }],
    resources: { requests: 80, transferKB: 1500 },
  },
  url: "http://localhost:3000/",
  userAgent: "test-agent",
  takenAt: "2026-02-01T00:00:00.000Z",
};

describe("buildReport", () => {
  it("maps a full input correctly (mode, network, device, vitals, resources, baseline)", () => {
    const r = buildReport(fullInput);
    expect(r.mode).toBe("CONSTRAINED");
    expect(r.confidence).toBe("high");
    expect(r.takenAt).toBe("2026-02-01T00:00:00.000Z");
    expect(r.url).toBe("http://localhost:3000/");
    expect(r.network).toEqual({
      effectiveType: "3g",
      saveData: false,
      downlink: 0.8,
      rtt: 600,
      source: "api",
    });
    expect(r.device).toEqual({ cores: 4, memory: 4 });
    expect(r.vitals).toHaveLength(2);
    expect(r.vitals[0]).toEqual({ name: "LCP", mode: "CONSTRAINED", value: 2500.456 });
    expect(r.resources).toEqual({ requests: 42, transferKB: 512.789 });
    expect(r.baseline?.mode).toBe("FULL");
    expect(r.baseline?.takenAt).toBe("2026-01-01T00:00:00.000Z");
  });

  it("coerces NaN vital values to null", () => {
    const r = buildReport({
      ...fullInput,
      vitals: [{ name: "LCP", mode: "CONSTRAINED", value: NaN }],
    });
    expect(r.vitals[0].value).toBeNull();
  });

  it("handles a null baseline (no crash; null preserved)", () => {
    const r = buildReport({ ...fullInput, baseline: null });
    expect(r.baseline).toBeNull();
    const md = toMarkdown(r);
    expect(md).toContain("N/A — no baseline saved yet.");
    const parsed = JSON.parse(toJSON(r));
    expect(parsed.baseline).toBeNull();
  });
});

describe("report serializers", () => {
  it("renders missing vitals as N/A in markdown and null in JSON", () => {
    const r = buildReport({
      ...fullInput,
      vitals: [
        { name: "LCP", mode: "CONSTRAINED", value: null },
        { name: "INP", mode: "CONSTRAINED", value: null },
      ],
      stats: { requests: null, transferKB: null },
      baseline: null,
    });
    const md = toMarkdown(r);
    expect(md).toContain("| LCP | CONSTRAINED | N/A |");
    expect(md).toContain("| INP | CONSTRAINED | N/A |");
    expect(md).toContain("- Requests: N/A");
    expect(md).toContain("- Transfer: N/A");
    const parsed = JSON.parse(toJSON(r));
    expect(parsed.vitals[0].value).toBeNull();
    expect(parsed.resources).toEqual({ requests: null, transferKB: null });
  });

  it("toJSON output parses as valid JSON and round-trips the report", () => {
    const r = buildReport(fullInput);
    const json = toJSON(r);
    expect(() => JSON.parse(json)).not.toThrow();
    expect(JSON.parse(json)).toEqual(JSON.parse(JSON.stringify(r)));
  });
});

// ---------------------------------------------------------------------------
// Builder-3: run comparison + run storage (Builder-2 API, landed).
// diffRuns(baseline, adaptive) -> RunDiffs ({baseline, adaptive, diff} per
// metric; diff is a string only when both sides are real numbers, else null).
// captureRun(id, decision, vitals, stats) -> MeasurementRun
// { id, takenAt, mode, vitals: {LCP,FCP,CLS,INP}, resources }.
// saveRun / loadRun(id) / clearRuns persist under NEW keys
// (awd-run-baseline-v1 / awd-run-adaptive-v1), never "awd-baseline-v1".
// ---------------------------------------------------------------------------

function makeRunPair(): { baseline: MeasurementRun; adaptive: MeasurementRun } {
  const baseline = captureRun(
    "baseline",
    { mode: "FULL" },
    [
      { name: "LCP", value: 4000 },
      { name: "FCP", value: 2500 },
      { name: "CLS", value: 0.12 },
      { name: "INP", value: 320 },
    ],
    { requests: 80, transferKB: 1500 }
  );
  const adaptive = captureRun(
    "adaptive",
    "CONSTRAINED",
    { LCP: 2500, FCP: 1800, CLS: 0.05, INP: 200 },
    { requests: 42, transferKB: 512 }
  );
  return { baseline, adaptive };
}

describe("diffRuns", () => {
  it("both-numbers → diff is a non-null string, sides preserved", () => {
    const { baseline, adaptive } = makeRunPair();
    const d = diffRuns(baseline, adaptive);
    expect(d.LCP).toEqual({ baseline: 4000, adaptive: 2500, diff: d.LCP.diff });
    expect(typeof d.LCP.diff).toBe("string");
    expect(typeof d.requests.diff).toBe("string");
    expect(typeof d.transferKB.diff).toBe("string");
    // CLS diff is signed with 3 decimals, unitless.
    expect(d.CLS.diff).toContain("-");
  });

  it("one-side-null → diff is null, known side preserved", () => {
    const { baseline } = makeRunPair();
    const adaptiveNull: MeasurementRun = {
      ...captureRun("adaptive", "CONSTRAINED", [], null),
      vitals: { LCP: null, FCP: 1800, CLS: null, INP: null },
    };
    const d = diffRuns(baseline, adaptiveNull);
    expect(d.LCP).toEqual({ baseline: 4000, adaptive: null, diff: null });
    expect(d.FCP.diff).not.toBeNull();
    expect(typeof d.FCP.diff).toBe("string");
  });

  it("null runs → every diff null, no throw", () => {
    let d;
    expect(() => {
      d = diffRuns(null, null);
    }).not.toThrow();
    for (const v of Object.values(d!)) {
      expect(v).toEqual({ baseline: null, adaptive: null, diff: null });
    }
  });

  it("NaN inputs are cleaned to null (never fabricated)", () => {
    const { adaptive } = makeRunPair();
    const dirty: MeasurementRun = {
      ...adaptive,
      id: "baseline",
      vitals: { LCP: NaN, FCP: 1800, CLS: 0.05, INP: 200 },
    };
    const d = diffRuns(dirty, adaptive);
    expect(d.LCP).toEqual({ baseline: null, adaptive: 2500, diff: null });
  });
});

describe("captureRun", () => {
  it("returns { id, takenAt, mode, vitals record, resources }", () => {
    const run = captureRun(
      "adaptive",
      { mode: "CONSTRAINED" },
      [{ name: "LCP", value: 2500 }],
      { requests: 42, transferKB: 512 }
    );
    expect(run.id).toBe("adaptive");
    expect(typeof run.takenAt).toBe("string");
    expect(() => new Date(run.takenAt).toISOString()).not.toThrow();
    expect(run.mode).toBe("CONSTRAINED");
    expect(run.vitals).toEqual({ LCP: 2500, FCP: null, CLS: null, INP: null });
    expect(run.resources).toEqual({ requests: 42, transferKB: 512 });
  });

  it("array vitals: latest entry wins; NaN → null", () => {
    const run = captureRun(
      "baseline",
      "FULL",
      [
        { name: "LCP", value: 4000 },
        { name: "LCP", value: NaN },
        { name: "FCP", value: 1200 },
        { name: "FCP", value: 1500 },
      ],
      undefined
    );
    // Latest LCP is NaN → cleaned to null; latest FCP wins.
    expect(run.vitals.LCP).toBeNull();
    expect(run.vitals.FCP).toBe(1500);
    expect(run.resources).toEqual({ requests: null, transferKB: null });
  });
});

describe("run storage round-trip on new keys", () => {
  const mem = new Map<string, string>();
  const hadWindow = typeof (globalThis as any).window !== "undefined";
  const prevWindow = (globalThis as any).window;
  const prevLocalStorage = (globalThis as any).localStorage;

  beforeEach(() => {
    mem.clear();
    const stub = {
      getItem: (k: string) => (mem.has(k) ? mem.get(k)! : null),
      setItem: (k: string, v: string) => void mem.set(k, String(v)),
      removeItem: (k: string) => void mem.delete(k),
      clear: () => mem.clear(),
    };
    // B2 storage mirrors saveBaseline/loadBaseline (window.localStorage), but
    // vitest runs in node — stub both lookup paths.
    (globalThis as any).localStorage = stub;
    (globalThis as any).window = hadWindow
      ? { ...prevWindow, localStorage: stub }
      : { localStorage: stub };
  });

  afterEach(() => {
    if (hadWindow) (globalThis as any).window = prevWindow;
    else delete (globalThis as any).window;
    if (prevLocalStorage === undefined) delete (globalThis as any).localStorage;
    else (globalThis as any).localStorage = prevLocalStorage;
  });

  it("saveRun/loadRun round-trips and clearRuns empties", () => {
    const { baseline, adaptive } = makeRunPair();
    saveRun(baseline);
    saveRun(adaptive);
    expect(loadRun("baseline")).toEqual(baseline);
    expect(loadRun("adaptive")).toEqual(adaptive);
    clearRuns();
    expect(loadRun("baseline")).toBeNull();
    expect(loadRun("adaptive")).toBeNull();
  });

  it("run storage uses new keys — baseline key untouched", () => {
    const seed = buildReport(fullInput);
    saveBaseline({
      takenAt: seed.takenAt,
      url: seed.url,
      userAgent: seed.userAgent,
      mode: seed.mode,
      confidence: seed.confidence,
      network: seed.network,
      device: seed.device,
      vitals: seed.vitals,
      resources: seed.resources,
    });
    const before = loadBaseline();
    expect(before).not.toBeNull();
    const { adaptive } = makeRunPair();
    saveRun(adaptive);
    expect(loadBaseline()).toEqual(before);
    clearRuns();
    // Clearing runs must not wipe the baseline saved under "awd-baseline-v1".
    expect(loadBaseline()).toEqual(before);
  });
});

// ---------------------------------------------------------------------------
// Builder-1: decoded/cached extensions (additive; existing tests above intact)
// ---------------------------------------------------------------------------

describe("captureRun decoded/cached", () => {
  it("round-trips decodedKB/cachedRequests through captureRun", () => {
    const run = captureRun(
      "adaptive",
      { mode: "CONSTRAINED" },
      [{ name: "LCP", value: 2500 }],
      { requests: 42, transferKB: 512, decodedKB: 1024.5, cachedRequests: 7 }
    );
    expect(run.resources.requests).toBe(42);
    expect(run.resources.transferKB).toBe(512);
    expect(run.resources.decodedKB).toBe(1024.5);
    expect(run.resources.cachedRequests).toBe(7);
  });

  it("preserves explicit nulls and cleans NaN to null", () => {
    const run = captureRun("baseline", "FULL", [], {
      requests: null,
      transferKB: null,
      decodedKB: null,
      cachedRequests: null,
    });
    expect(run.resources.decodedKB).toBeNull();
    expect(run.resources.cachedRequests).toBeNull();
    const dirty = captureRun("baseline", "FULL", [], {
      decodedKB: NaN,
      cachedRequests: NaN,
    });
    expect(dirty.resources.decodedKB).toBeNull();
    expect(dirty.resources.cachedRequests).toBeNull();
  });
});

describe("diffDecoded", () => {
  it("both-numbers → diff is a non-null string, sides preserved", () => {
    const b = captureRun("baseline", "FULL", [], { decodedKB: 1500 });
    const a = captureRun("adaptive", "CONSTRAINED", [], { decodedKB: 512 });
    const d = diffDecoded(b, a);
    expect(d.baseline).toBe(1500);
    expect(d.adaptive).toBe(512);
    expect(typeof d.diff).toBe("string");
  });

  it("one-side-null → diff is null, known side preserved", () => {
    const b = captureRun("baseline", "FULL", [], { decodedKB: 1500 });
    const a = captureRun("adaptive", "CONSTRAINED", [], { decodedKB: null });
    const d = diffDecoded(b, a);
    expect(d).toEqual({ baseline: 1500, adaptive: null, diff: null });
  });

  it("null runs → all-null, no throw", () => {
    let d;
    expect(() => {
      d = diffDecoded(null, null);
    }).not.toThrow();
    expect(d).toEqual({ baseline: null, adaptive: null, diff: null });
  });
});

describe("pending run helpers", () => {
  const mem = new Map<string, string>();
  const hadWindow = typeof (globalThis as any).window !== "undefined";
  const prevWindow = (globalThis as any).window;
  const prevLocalStorage = (globalThis as any).localStorage;

  beforeEach(() => {
    mem.clear();
    const stub = {
      getItem: (k: string) => (mem.has(k) ? mem.get(k)! : null),
      setItem: (k: string, v: string) => void mem.set(k, String(v)),
      removeItem: (k: string) => void mem.delete(k),
      clear: () => mem.clear(),
    };
    (globalThis as any).localStorage = stub;
    (globalThis as any).window = hadWindow
      ? { ...prevWindow, localStorage: stub }
      : { localStorage: stub };
  });

  afterEach(() => {
    if (hadWindow) (globalThis as any).window = prevWindow;
    else delete (globalThis as any).window;
    if (prevLocalStorage === undefined) delete (globalThis as any).localStorage;
    else (globalThis as any).localStorage = prevLocalStorage;
  });

  it("set/get/clear round-trips under awd-run-pending-v1", () => {
    expect(getPendingRun()).toBeNull();
    setPendingRun("adaptive");
    expect(getPendingRun()).toBe("adaptive");
    expect(mem.get("awd-run-pending-v1")).toBe("adaptive");
    clearPendingRun();
    expect(getPendingRun()).toBeNull();
    expect(mem.has("awd-run-pending-v1")).toBe(false);
  });
});

describe("pending helpers SSR-safety (no window)", () => {
  const hadWindow = typeof (globalThis as any).window !== "undefined";
  const prevWindow = (globalThis as any).window;

  beforeEach(() => {
    delete (globalThis as any).window;
  });

  afterEach(() => {
    if (hadWindow) (globalThis as any).window = prevWindow;
    else delete (globalThis as any).window;
  });

  it("getPendingRun returns null, set/clear do not throw", () => {
    expect(typeof (globalThis as any).window).toBe("undefined");
    expect(getPendingRun()).toBeNull();
    expect(() => setPendingRun("adaptive")).not.toThrow();
    expect(() => clearPendingRun()).not.toThrow();
    expect(getPendingRun()).toBeNull();
  });
});

describe("old-shape runs (no new fields)", () => {
  it("still load diffs as before; decoded diff is all-null", () => {
    const oldBaseline: MeasurementRun = {
      id: "baseline",
      takenAt: "2026-01-01T00:00:00.000Z",
      mode: "FULL",
      vitals: { LCP: 4000, FCP: 2500, CLS: 0.12, INP: 320 },
      resources: { requests: 80, transferKB: 1500 },
    };
    const oldAdaptive: MeasurementRun = {
      id: "adaptive",
      takenAt: "2026-02-01T00:00:00.000Z",
      mode: "CONSTRAINED",
      vitals: { LCP: 2500, FCP: 1800, CLS: 0.05, INP: 200 },
      resources: { requests: 42, transferKB: 512 },
    };
    const d = diffRuns(oldBaseline, oldAdaptive);
    expect(typeof d.LCP.diff).toBe("string");
    expect(typeof d.requests.diff).toBe("string");
    expect(typeof d.transferKB.diff).toBe("string");
    expect(diffDecoded(oldBaseline, oldAdaptive)).toEqual({
      baseline: null,
      adaptive: null,
      diff: null,
    });
    // isValidRun accepts runs without the new optional fields.
    const mem = new Map<string, string>();
    const stub = {
      getItem: (k: string) => (mem.has(k) ? mem.get(k)! : null),
      setItem: (k: string, v: string) => void mem.set(k, String(v)),
      removeItem: (k: string) => void mem.delete(k),
      clear: () => mem.clear(),
    };
    const hadWindow = typeof (globalThis as any).window !== "undefined";
    const prevWindow = (globalThis as any).window;
    (globalThis as any).window = { localStorage: stub };
    try {
      saveRun(oldBaseline);
      expect(loadRun("baseline")).toEqual(oldBaseline);
    } finally {
      if (hadWindow) (globalThis as any).window = prevWindow;
      else delete (globalThis as any).window;
    }
  });
});
