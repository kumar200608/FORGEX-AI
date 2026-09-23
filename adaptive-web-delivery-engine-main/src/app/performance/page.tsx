"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAdaptiveMode } from "@/context/AdaptiveModeContext";
import { readStoredVitals, type StoredVital } from "@/lib/vitalsLogger";
import { formatCLS, formatKB, formatMs, stateLabel } from "@/lib/adaptive/format";
import {
  getResourceBreakdown,
  type ResourceBreakdown,
} from "@/lib/adaptive/metrics";
import { reasonFor } from "@/lib/adaptive/reason";
import type { MetricState } from "@/lib/adaptive/report";
import ReportGenerator from "@/components/ReportGenerator";

const EMPTY_BREAKDOWN: ResourceBreakdown = {
  total: null,
  images: null,
  scripts: null,
  styles: null,
  others: null,
  transferKB: null,
  transferState: "unavailable",
};

function latestValue(vitals: StoredVital[], name: string): number | null {
  const found = vitals.filter((v) => v.name === name);
  if (found.length === 0) return null;
  const last = found[found.length - 1].value;
  return typeof last === "number" && !Number.isNaN(last) ? last : null;
}

function countReadings(vitals: StoredVital[], name: string): number {
  return vitals.filter((v) => v.name === name).length;
}

function sameVitals(a: StoredVital[], b: StoredVital[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i].id !== b[i].id || a[i].value !== b[i].value) return false;
  }
  return true;
}

function sameBreakdown(a: ResourceBreakdown, b: ResourceBreakdown): boolean {
  return (
    a.total === b.total &&
    a.images === b.images &&
    a.scripts === b.scripts &&
    a.styles === b.styles &&
    a.others === b.others &&
    a.transferKB === b.transferKB
  );
}

function StatePill({ state }: { state: MetricState }) {
  const label = stateLabel(state);
  const live = state === "measured";
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
        live ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"
      }`}
    >
      {label}
    </span>
  );
}

export default function PerformancePage() {
  const { decision, status } = useAdaptiveMode();
  const [mounted, setMounted] = useState(false);
  const [vitals, setVitals] = useState<StoredVital[]>([]);
  const [res, setRes] = useState<ResourceBreakdown>({ ...EMPTY_BREAKDOWN });

  useEffect(() => {
    setMounted(true);
    setVitals(readStoredVitals());
    setRes(getResourceBreakdown());
    const id = setInterval(() => {
      const nextVitals = readStoredVitals();
      const nextRes = getResourceBreakdown();
      setVitals((prev) => (sameVitals(prev, nextVitals) ? prev : nextVitals));
      setRes((prev) => (sameBreakdown(prev, nextRes) ? prev : nextRes));
    }, 5000);
    return () => clearInterval(id);
  }, []);

  const { mode, network, device } = decision;
  const confidence = decision.confidence ?? "N/A";
  const forced =
    mounted && typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("forceMode")
      : null;

  const reasons = reasonFor({ ...decision, forced });
  const rtt = (network as { rtt?: number | null }).rtt ?? null;

  const detection: Array<{ label: string; value: string; available: boolean }> = [
    {
      label: "Effective type",
      value: network.effectiveType ?? "Not available",
      available: network.effectiveType !== null,
    },
    {
      label: "RTT",
      value: rtt === null ? "Not available" : `${rtt} ms`,
      available: rtt !== null,
    },
    {
      label: "Downlink",
      value: network.downlink === null ? "Not available" : `${network.downlink} Mbps`,
      available: network.downlink !== null,
    },
    {
      label: "Save-Data",
      value: network.saveData ? "ON" : "OFF",
      available: true,
    },
    {
      label: "CPU cores",
      value: device.hardwareConcurrency === null ? "Not available" : String(device.hardwareConcurrency),
      available: device.hardwareConcurrency !== null,
    },
    {
      label: "Device memory",
      value: device.deviceMemory === null ? "Not available" : `${device.deviceMemory} GB`,
      available: device.deviceMemory !== null,
    },
  ];

  const lcp = latestValue(vitals, "LCP");
  const fcp = latestValue(vitals, "FCP");
  const cls = latestValue(vitals, "CLS");
  const inp = latestValue(vitals, "INP");
  const clsCount = countReadings(vitals, "CLS");

  const vitalState = (v: number | null): MetricState =>
    !mounted ? "loading" : v !== null ? "measured" : "waiting";
  const transferState: MetricState =
    !mounted ? "loading" : res.transferKB !== null ? "measured" : "unavailable";

  const vitalCards = [
    { name: "LCP", value: formatMs(lcp), unit: "s", state: vitalState(lcp), note: null as string | null },
    { name: "FCP", value: formatMs(fcp), unit: "s", state: vitalState(fcp), note: null as string | null },
    {
      name: "CLS",
      value: formatCLS(cls),
      unit: "unitless",
      state: vitalState(cls),
      note: `(${clsCount} readings)`,
    },
    { name: "INP", value: formatMs(inp), unit: "s", state: vitalState(inp), note: null as string | null },
  ];

  const adaptations = [
    {
      label: "Images",
      detail: decision.changes.imageReduced ? "small variants (~400px)" : "large variants (~1200px)",
      on: decision.changes.imageReduced,
    },
    {
      label: "Recommendations",
      detail: decision.changes.componentDeferred ? "deferred" : "rendered inline",
      on: decision.changes.componentDeferred,
    },
    {
      label: "Animations",
      detail: decision.changes.animationsReduced ? "reduced" : "full",
      on: decision.changes.animationsReduced,
    },
    {
      label: "Prefetch",
      detail: decision.changes.prefetchDisabled ? "off" : "on",
      on: !decision.changes.prefetchDisabled,
    },
  ];

  return (
    <main className="mx-auto max-w-6xl space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Performance Lab</h1>
        <p className="mt-1 text-sm text-slate-600">
          Live delivery-mode readings from this session. Every number is measured or N/A — never
          fabricated.{" "}
          <Link href="/lab" className="text-sky-700 hover:underline">
            Open legacy /lab
          </Link>
        </p>
        <div className="mt-1 text-xs text-slate-500">
          <p className="font-medium text-slate-600">
            Run protocol (7 steps): throttle + viewport → Baseline → auto-return → Adaptive →
            compare.
          </p>
          <ol className="mt-1 list-decimal space-y-0.5 pl-5">
            <li>DevTools → Network → Slow 3G; fix the viewport — keep both identical for the two runs.</li>
            <li>Click Run Baseline — opens a fresh document with <code>?forceMode=FULL</code> (forced FULL probe).</li>
            <li>Baseline captures, then auto-returns to the lab (the pending run is consumed).</li>
            <li>Click Run Adaptive — fresh document, no <code>forceMode</code>; the engine decides the mode.</li>
            <li>Compare the Baseline vs Adaptive difference table.</li>
            <li>Fresh document per run — never compare two snapshots taken from the same document.</li>
            <li>Compare decoded bytes (cache-immune); transfer can read 0/Unavailable when cached or cross-origin-opaque.</li>
          </ol>
          {forced && (
            <span className="mt-1 inline-block font-medium text-slate-700">(forced via ?forceMode={forced})</span>
          )}
        </div>
      </div>

      {/* (A) Current delivery mode */}
      <section
        aria-label="Current delivery mode"
        className="rounded-md border border-slate-200 bg-white p-4 shadow-sm"
      >
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-base font-semibold text-slate-900">Current delivery mode</h2>
          {status === "ready" ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-600" />
              </span>
              LIVE MEASUREMENT
            </span>
          ) : (
            <span className="inline-block rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500">
              WAITING
            </span>
          )}
        </div>
        <div className="mt-3">
          <span
            className={`inline-block rounded-md px-3 py-1.5 text-lg font-bold ${
              mode === "FULL" ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"
            }`}
          >
            {mode === "FULL" ? "FULL MODE — Rich delivery" : "CONSTRAINED MODE — Lightweight delivery"}
          </span>
        </div>
        {status === "detecting" ? (
          <p className="mt-2 text-sm italic text-slate-500">Detecting network and device…</p>
        ) : (
          <div className="mt-3 text-sm">
            <p className="font-medium text-slate-900">
              Confidence: <span className="font-normal">{confidence}</span>
            </p>
            <ul className="mt-1 list-disc space-y-0.5 pl-5 text-slate-600">
              {reasons.length === 0 ? (
                <li>See detection signals below.</li>
              ) : (
                reasons.map((r) => <li key={r}>{r}</li>)
              )}
            </ul>
          </div>
        )}
      </section>

      {/* (B) Detection grid */}
      <section
        aria-label="Detection signals"
        className="rounded-md border border-slate-200 bg-white p-4 shadow-sm"
      >
        <h2 className="text-base font-semibold text-slate-900">Detection signals</h2>
        <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
          {detection.map((d) => (
            <div key={d.label} className="rounded-md border border-slate-200 p-3">
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{d.label}</dt>
              <dd className={`mt-1 font-medium ${d.available ? "text-slate-900" : "text-slate-400"}`}>
                {d.value}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {/* (C) Delivery impact */}
      <section
        aria-label="Delivery impact"
        className="rounded-md border border-slate-200 bg-white p-4 shadow-sm"
      >
        <h2 className="text-base font-semibold text-slate-900">Delivery impact</h2>
        <div
          className="mt-1 text-xs text-slate-500"
          title="Counts come from performance resource entries; cached or cross-origin-opaque responses may hide transfer sizes, so transfer can read Unavailable."
        >
          Resource requests (performance entries) — hover for how caching affects these numbers.
        </div>
        <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-md border border-slate-200 p-3">
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Total requests</dt>
            <dd className="mt-1 font-medium text-slate-900">{res.total === null ? "N/A" : res.total}</dd>
          </div>
          <div className="rounded-md border border-slate-200 p-3">
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Images</dt>
            <dd className="mt-1 font-medium text-slate-900">{res.images === null ? "N/A" : res.images}</dd>
          </div>
          <div className="rounded-md border border-slate-200 p-3">
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Scripts</dt>
            <dd className="mt-1 font-medium text-slate-900">{res.scripts === null ? "N/A" : res.scripts}</dd>
          </div>
          <div className="rounded-md border border-slate-200 p-3">
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Styles</dt>
            <dd className="mt-1 font-medium text-slate-900">{res.styles === null ? "N/A" : res.styles}</dd>
          </div>
          <div className="rounded-md border border-slate-200 p-3">
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Others</dt>
            <dd className="mt-1 font-medium text-slate-900">{res.others === null ? "N/A" : res.others}</dd>
          </div>
          <div className="rounded-md border border-slate-200 p-3">
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Transfer</dt>
            <dd className="mt-1 font-medium text-slate-900">
              {res.transferKB === null ? "Unavailable" : formatKB(res.transferKB)}
            </dd>
            <div className="mt-1">
              <StatePill state={transferState} />
            </div>
          </div>
        </dl>
      </section>

      {/* (D) Web vitals */}
      <section
        aria-label="Web vitals"
        className="rounded-md border border-slate-200 bg-white p-4 shadow-sm"
      >
        <h2 className="text-base font-semibold text-slate-900">Web vitals</h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {vitalCards.map((c) => (
            <div key={c.name} className="rounded-md border border-slate-200 p-3">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                {c.name} <span className="normal-case">({c.unit})</span>
              </p>
              <p className="mt-1 text-xl font-semibold text-slate-900">{c.value}</p>
              <div className="mt-1 flex flex-wrap items-center gap-1">
                <StatePill state={c.state} />
                {c.note && <span className="text-xs text-slate-500">{c.note}</span>}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* (E) Adaptations applied */}
      <section
        aria-label="Adaptations applied"
        className="rounded-md border border-slate-200 bg-white p-4 shadow-sm"
      >
        <h2 className="text-base font-semibold text-slate-900">Adaptations applied</h2>
        <ul className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          {adaptations.map((a) => (
            <li key={a.label} className="flex items-start gap-2 rounded-md border border-slate-200 p-3">
              <span
                aria-hidden
                className={`mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold ${
                  a.on ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-400"
                }`}
              >
                {a.on ? "✓" : "—"}
              </span>
              <span>
                <span className="font-medium text-slate-900">{a.label}: </span>
                <span className="text-slate-600">{a.detail}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* (F) Baseline vs Adaptive evidence (single source: ReportGenerator) */}
      <ReportGenerator decision={decision} status={status} />
    </main>
  );
}
