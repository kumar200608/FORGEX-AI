"use client";

import { useEffect, useState } from "react";
import { useAdaptiveMode } from "@/hooks/useAdaptiveMode";

export function useNetworkStatus() {
  const { decision } = useAdaptiveMode();
  const network = decision.network as any;
  const [online, setOnline] = useState<boolean>(true);

  useEffect(() => {
    function handleOnline() {
      setOnline(true);
    }
    function handleOffline() {
      setOnline(false);
    }
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    setOnline(navigator.onLine);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return {
    effectiveType: network?.effectiveType ?? null,
    saveData: network?.saveData ?? false,
    downlink: network?.downlink ?? null,
    rtt: network?.rtt ?? null,
    source: network?.source ?? "unknown",
    online,
  };
}
