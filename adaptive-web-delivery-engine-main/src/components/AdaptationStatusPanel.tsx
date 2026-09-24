"use client";

import { useEffect, useState } from "react";
import type { AdaptationDecision, AdaptiveStatus } from "@/types";

const HIDDEN_KEY = "awd-panel-hidden";

function isInitiallyHidden(): boolean {
  try {
    if (typeof window === "undefined" || typeof localStorage === "undefined") return false;
    return localStorage.getItem(HIDDEN_KEY) === "1";
  } catch {
    return false;
  }
}

export default function AdaptationStatusPanel({
  decision,
  status,
}: {
  decision: AdaptationDecision;
  status: AdaptiveStatus;
}) {
  const [hidden, setHidden] = useState<boolean>(false);

  // Read persisted visibility after mount so server and client first render match.
  useEffect(() => {
    setHidden(isInitiallyHidden());
  }, []);
  const { mode, network, device, changes } = decision;
  const forced =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("forceMode")
      : null;

  function hide() {
    setHidden(true);
    try {
      localStorage.setItem(HIDDEN_KEY, "1");
    } catch {
      // storage is best-effort
    }
  }

  function show() {
    setHidden(false);
    try {
      localStorage.removeItem(HIDDEN_KEY);
    } catch {
      // storage is best-effort
    }
  }

  if (hidden) {
    return (
      <div className="mb-6">
        <button
          type="button"
          onClick={show}
          className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 shadow-sm hover:border-slate-400"
        >
          Show adaptation status
        </button>
      </div>
    );
  }

  return (
    <div className="mb-6 rounded-md border border-slate-200 bg-white p-4 text-sm shadow-sm">
      <div className="flex items-center justify-between">
        <div className="font-semibold text-slate-800">Adaptation Status</div>
        <button
          type="button"
          onClick={hide}
          aria-label="Hide adaptation status"
          className="rounded px-2 py-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
        >
          ×
        </button>
      </div>
      {status === "detecting" ? (
        <div className="mt-2 space-y-2" aria-label="Detecting network and device">
          <div className="h-3 w-2/3 rounded bg-slate-200" />
          <div className="h-3 w-1/2 rounded bg-slate-200" />
          <div className="text-xs italic text-slate-500">Detecting network and device…</div>
        </div>
      ) : (
        <div className="mt-2 space-y-2">
          <div>
            Network: {network.effectiveType ?? "unknown"} ({network.source})
          </div>
          <div>Save Data: {network.saveData ? "ON" : "OFF"}</div>
          <div>
            Device capability: {device.hardwareConcurrency ?? "?"} cores /{" "}
            {device.deviceMemory ?? "?"}GB
          </div>
          <div className="flex items-center gap-2 font-semibold">
            <span
              aria-hidden
              className={`inline-block h-2 w-2 rounded-full ${
                mode === "FULL" ? "bg-green-500" : "bg-amber-500"
              }`}
            />
            Mode:{" "}
            <span className={mode === "FULL" ? "text-green-600" : "text-amber-600"}>{mode}</span>
            {forced && (
              <span className="ml-2 text-xs font-normal text-slate-500">
                (forced via ?forceMode={forced})
              </span>
            )}
          </div>
          <ul className="mt-2 space-y-1">
            {changes.imageReduced && <li>✓ Image quality reduced</li>}
            {changes.componentDeferred && <li>✓ Heavy component deferred</li>}
            {changes.animationsReduced && <li>✓ Animations reduced</li>}
            {changes.prefetchDisabled && <li>✓ Prefetch disabled</li>}
            {mode === "FULL" && <li>Full experience active — no reductions applied</li>}
          </ul>
        </div>
      )}
    </div>
  );
}
