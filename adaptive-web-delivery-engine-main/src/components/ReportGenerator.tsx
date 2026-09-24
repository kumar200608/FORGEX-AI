"use client";

import { useEffect, useState } from "react";
import type { AdaptationDecision, AdaptiveStatus } from "@/types";
import { readStoredVitals } from "@/lib/vitalsLogger";
import { formatCLS, formatKB, formatMs } from "@/lib/adaptive/format";
import { getResourceBreakdown } from "@/lib/adaptive/metrics";
import {
  buildReport,
  captureRun,
  clearRuns,
  diffRuns,
  diffValue,
  loadBaseline,
  loadRun,
  saveRun,
  toJSON,
  toMarkdown,
  toPrintHTML,
  type MeasurementRun,
  type ReportSnapshot,
  type RunDiff,
} from "@/lib/adaptive/report";
import * as reportNS from "@/lib/adaptive/report";

// Requests are plain counts (no shared helper); null/NaN → "N/A".
function fmtCount(v: number | null | undefined): string {
  if (v === null || v === undefined || Number.isNaN(v)) return "N/A";
  return String(Math.round(v));
}

function toStats(b: { total: number | null; transferKB: number | null }): {
  requests: number | null;
  transferKB: number | null;
} {
  return { requests: b.total, transferKB: b.transferKB };
}

function downloadFile(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function ReportGenerator({
  decision,
  status,
}: {
  decision: AdaptationDecision;
  status: AdaptiveStatus;
}) {
  const [mounted, setMounted] = useState(false);
  const [baselineRun, setBaselineRun] = useState<MeasurementRun | null>(null);
  const [adaptiveRun, setAdaptiveRun] = useState<MeasurementRun | null>(null);
  const [copied, setCopied] = useState(false);
  const [printHTML, setPrintHTML] = useState("");

  useEffect(() => {
    setMounted(true);
    setBaselineRun(loadRun("baseline"));
    setAdaptiveRun(loadRun("adaptive"));
  }, []);

  useEffect(() => {
    if (!printHTML) return;
    if (typeof window === "undefined") return;
    const raf = window.requestAnimationFrame(() => window.print());
    return () => window.cancelAnimationFrame(raf);
  }, [printHTML]);

  if (!mounted) {
    return (
      <section
        aria-label="Performance report"
        className="rounded-md border border-slate-200 bg-white p-4 shadow-sm"
      >
        <h2 className="text-base font-semibold text-slate-900">Performance report</h2>
        <p className="mt-2 text-sm text-slate-500">Loading report tools…</p>
      </section>
    );
  }

  const report: ReportSnapshot = buildReport({
    decision,
    vitals: readStoredVitals().map((v) => ({ name: v.name, mode: v.mode, value: v.value })),
    stats: toStats(getResourceBreakdown()),
    baseline: loadBaseline(),
    url: typeof window !== "undefined" ? window.location.href : "N/A",
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "N/A",
  });

  const runs = { baseline: baselineRun, adaptive: adaptiveRun };
  const diffs = diffRuns(baselineRun, adaptiveRun);

  const snapshotVitals = () =>
    readStoredVitals().map((v) => ({ name: v.name, value: v.value }));

  const handleRecordBaseline = () => {
    try {
      const setPending = (
        reportNS as unknown as {
          setPendingRun?: (id: "baseline" | "adaptive") => void;
        }
      ).setPendingRun;
      if (typeof setPending === "function") {
        setPending("baseline");
        window.location.href = "/products?forceMode=FULL&measure=baseline&_cb=" + Date.now();
        return;
      }
    } catch {
      // guided-run helpers unavailable — fall through to local capture
    }
    const run = captureRun("baseline", decision, snapshotVitals(), toStats(getResourceBreakdown()));
    saveRun(run);
    setBaselineRun(run);
  };

  const handleRecordAdaptive = () => {
    try {
      const setPending = (
        reportNS as unknown as {
          setPendingRun?: (id: "baseline" | "adaptive") => void;
        }
      ).setPendingRun;
      if (typeof setPending === "function") {
        setPending("adaptive");
        window.location.href = "/products?measure=adaptive&_cb=" + Date.now();
        return;
      }
    } catch {
      // guided-run helpers unavailable — fall through to local capture
    }
    const run = captureRun("adaptive", decision, snapshotVitals(), toStats(getResourceBreakdown()));
    saveRun(run);
    setAdaptiveRun(run);
  };

  const handleClear = () => {
    clearRuns();
    setBaselineRun(null);
    setAdaptiveRun(null);
  };

  const reportWithRuns = () => JSON.stringify({ ...JSON.parse(toJSON(report)), runs }, null, 2);
  const markdownWithRuns = () => toMarkdown(report, runs);

  const handleDownloadJSON = () => {
    downloadFile("awd-report.json", reportWithRuns(), "application/json");
  };

  const handleDownloadMarkdown = () => {
    downloadFile("awd-report.md", markdownWithRuns(), "text/markdown");
  };

  const handlePrintReport = () => {
    const snapshot: ReportSnapshot = buildReport({
      decision,
      vitals: readStoredVitals().map((v) => ({ name: v.name, mode: v.mode, value: v.value })),
      stats: toStats(getResourceBreakdown()),
      baseline: loadBaseline(),
      url: typeof window !== "undefined" ? window.location.href : "N/A",
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "N/A",
    });
    setPrintHTML(toPrintHTML(snapshot));
  };

  const handleCopyMarkdown = async () => {
    const md = markdownWithRuns();
    try {
      await navigator.clipboard.writeText(md);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      try {
        const ta = document.createElement("textarea");
        ta.value = md;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        ta.remove();
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // clipboard unavailable
      }
    }
  };

  const pendingRun: string | null = mounted
    ? (() => {
        try {
          const g = (
            reportNS as unknown as { getPendingRun?: () => unknown }
          ).getPendingRun;
          if (typeof g === "function") {
            const v = g();
            return typeof v === "string" && v !== "" ? v : null;
          }
        } catch {
          // pending helpers land with Builder-1; absence is harmless
        }
        return null;
      })()
    : null;

  const doneId: string | null =
    mounted && typeof window !== "undefined"
      ? (() => {
          try {
            const d = new URLSearchParams(window.location.search).get("done");
            return d === "baseline" || d === "adaptive" ? d : null;
          } catch {
            return null;
          }
        })()
      : null;

  function decodedOf(run: MeasurementRun | null): number | null {
    const v = (run as unknown as { resources?: Record<string, unknown> })
      ?.resources?.decodedKB;
    return typeof v === "number" && !Number.isNaN(v) ? v : null;
  }

  const decodedDiff: RunDiff = (() => {
    try {
      const fn = (
        reportNS as unknown as {
          diffDecoded?: (b: unknown, a: unknown) => RunDiff;
        }
      ).diffDecoded;
      if (typeof fn === "function") return fn(baselineRun, adaptiveRun);
    } catch {
      // fall through to local diff below
    }
    const b = decodedOf(baselineRun);
    const a = decodedOf(adaptiveRun);
    return { baseline: b, adaptive: a, diff: diffValue(b, a, "kb") };
  })();

  const rows = [
    { metric: "LCP", unit: "s", base: diffs.LCP.baseline, adapt: diffs.LCP.adaptive, diff: diffs.LCP.diff, fmt: formatMs },
    { metric: "FCP", unit: "s", base: diffs.FCP.baseline, adapt: diffs.FCP.adaptive, diff: diffs.FCP.diff, fmt: formatMs },
    { metric: "CLS", unit: "", base: diffs.CLS.baseline, adapt: diffs.CLS.adaptive, diff: diffs.CLS.diff, fmt: formatCLS },
    { metric: "INP", unit: "s", base: diffs.INP.baseline, adapt: diffs.INP.adaptive, diff: diffs.INP.diff, fmt: formatMs },
    { metric: "Requests", unit: "", base: diffs.requests.baseline, adapt: diffs.requests.adaptive, diff: diffs.requests.diff, fmt: fmtCount },
    { metric: "Transfer", unit: "KB", base: diffs.transferKB.baseline, adapt: diffs.transferKB.adaptive, diff: diffs.transferKB.diff, fmt: formatKB },
    { metric: "Decoded", unit: "KB", base: decodedDiff.baseline, adapt: decodedDiff.adaptive, diff: decodedDiff.diff, fmt: formatKB },
  ];

  return (
    <section
      aria-label="Performance report"
      className="rounded-md border border-slate-200 bg-white p-4 shadow-sm"
    >
      <h2 className="text-base font-semibold text-slate-900">Performance report</h2>
      <p className="mt-1 text-xs text-slate-500">
        DETECT→DECIDE→ADAPT→MEASURE→COMPARE: record a guided baseline (forced FULL mode) and an
        adaptive measurement on the live storefront, then compare real measured runs here.
        Missing values show as N/A — never fabricated.
        {status === "detecting" && <span className="ml-1 italic">Detecting mode…</span>}
      </p>
      {pendingRun && (
        <p className="mt-2 text-xs font-medium text-sky-700" role="status">
          Guided capture in progress: {pendingRun} run — measuring on /products, you will return
          here automatically…
        </p>
      )}
      {!pendingRun && doneId && (
        <p className="mt-2 text-xs font-medium text-green-700" role="status">
          Saved {doneId} measurement — recorded in the table below.
        </p>
      )}

      <div className="mt-3 flex flex-wrap gap-2 no-print">
        <button
          type="button"
          onClick={handleRecordBaseline}
          className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700"
        >
          Record Baseline
        </button>
        <button
          type="button"
          onClick={handleRecordAdaptive}
          className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700"
        >
          Record Adaptive
        </button>
        <button
          type="button"
          onClick={handleClear}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Clear measurements
        </button>
        <button
          type="button"
          onClick={handleDownloadJSON}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Download JSON
        </button>
        <button
          type="button"
          onClick={handleDownloadMarkdown}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Download Markdown
        </button>
        <button
          type="button"
          onClick={handleCopyMarkdown}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          {copied ? "Copied" : "Copy Markdown"}
        </button>
        <button
          type="button"
          onClick={handlePrintReport}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Generate Live Performance Report (PDF)
        </button>
      </div>
      {!baselineRun && (
        <p className="mt-2 text-xs text-slate-500">No baseline measurement recorded yet.</p>
      )}
      {!adaptiveRun && (
        <p className="mt-2 text-xs text-slate-500">No adaptive measurement recorded yet.</p>
      )}

      <div className="mt-3 overflow-x-auto rounded-md border border-slate-200">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b bg-slate-50 text-left">
              <th className="px-3 py-2">Metric</th>
              <th className="px-3">Baseline</th>
              <th className="px-3">Adaptive</th>
              <th className="px-3">Difference</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.metric} className="border-b last:border-0">
                <td className="px-3 py-2 font-medium">
                  {r.metric}
                  {r.unit && <span className="ml-1 text-xs font-normal text-slate-500">({r.unit})</span>}
                </td>
                <td className="px-3">{r.fmt(r.base)}</td>
                <td className="px-3">{r.fmt(r.adapt)}</td>
                <td className="px-3">{r.diff === null ? "—" : r.diff}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-slate-500">
        Transfer = wire bytes (0 when cached); Decoded = real weight; Cached = cached-entry count.
      </p>
      {printHTML !== "" && (
        <div className="print-report" dangerouslySetInnerHTML={{ __html: printHTML }} />
      )}
    </section>
  );
}
