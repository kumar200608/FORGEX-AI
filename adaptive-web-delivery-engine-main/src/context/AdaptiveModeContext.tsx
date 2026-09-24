"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { getNetworkInfo } from "@/lib/networkProbe";
import { getDeviceInfo } from "@/lib/deviceSignals";
import { decideMode } from "@/lib/decisionEngine";
import { initVitalsLogging } from "@/lib/vitalsLogger";
import { confidenceFor } from "@/lib/adaptive/classifier";
import { changesFor } from "@/lib/adaptive/adaptation";
import type { AdaptationDecision, AdaptiveMode, AdaptiveStatus } from "@/types";

export const DEFAULT_DECISION: AdaptationDecision = {
  mode: "CONSTRAINED",
  network: { effectiveType: null, saveData: false, downlink: null, rtt: null, source: "unknown" },
  device: { hardwareConcurrency: null, deviceMemory: null },
  changes: { imageReduced: true, componentDeferred: true, animationsReduced: true, prefetchDisabled: true },
};

function getForcedModeFromQuery(): AdaptiveMode | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const forced = params.get("forceMode");
  if (forced) {
    const normalized = forced.toLowerCase();
    if (normalized === "full") return "FULL";
    if (normalized === "constrained") return "CONSTRAINED";
  }
  return null;
}

interface AdaptiveModeContextValue {
  decision: AdaptationDecision;
  status: AdaptiveStatus;
}

const AdaptiveModeContext = createContext<AdaptiveModeContextValue>({
  decision: DEFAULT_DECISION,
  status: "detecting",
});

export function AdaptiveModeProvider({ children }: { children: ReactNode }) {
  const [decision, setDecision] = useState<AdaptationDecision>(DEFAULT_DECISION);
  const [status, setStatus] = useState<AdaptiveStatus>("detecting");
  const decisionRef = useRef(decision);
  decisionRef.current = decision;
  const runIdRef = useRef(0);
  const vitalsInitRef = useRef(false);

  useEffect(() => {
    try {
      if (!vitalsInitRef.current) {
        vitalsInitRef.current = true;
        initVitalsLogging(() => decisionRef.current.mode);
      }
    } catch {
      // vitals logging is best-effort; never break adaptation
    }

    let cancelled = false;
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    async function run() {
      const runId = ++runIdRef.current;
      const network = await getNetworkInfo();
      if (cancelled || runId !== runIdRef.current) return;
      const device = getDeviceInfo();
      const forced = getForcedModeFromQuery();
      const mode = forced ?? decideMode(network, device);
      const next = {
        mode,
        network,
        device,
        changes: {
          ...changesFor(mode),
          prefetchDisabled: mode === "CONSTRAINED" || network.saveData,
        },
        confidence: forced ? "high" : confidenceFor(network.source),
      } as unknown as AdaptationDecision;
      setDecision(next);
      setStatus("ready");
    }

    run();

    function handleChange() {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        run();
      }, 300);
    }

    const conn = (navigator as any)?.connection;
    conn?.addEventListener?.("change", handleChange);
    return () => {
      cancelled = true;
      if (debounceTimer) clearTimeout(debounceTimer);
      conn?.removeEventListener?.("change", handleChange);
    };
  }, []);

  const value = useMemo<AdaptiveModeContextValue>(
    () => ({ decision, status }),
    [decision, status]
  );

  return <AdaptiveModeContext.Provider value={value}>{children}</AdaptiveModeContext.Provider>;
}

export function useAdaptiveMode(): AdaptiveModeContextValue {
  return useContext(AdaptiveModeContext);
}
