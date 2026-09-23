/**
 * Pure firing-input reasons for an adaptation decision, in display order.
 * Never throws; unknown/missing signals are skipped.
 */
export function reasonFor(decision: any): string[] {
  try {
    const reasons: string[] = [];
    const d = (decision ?? {}) as any;
    const network = (d.network ?? {}) as any;
    const device = (d.device ?? {}) as any;
    const mode = d.mode as string | undefined;

    const forced = d.forced ?? null;
    if (forced !== null && forced !== undefined && String(forced).trim() !== "") {
      reasons.push(`Pinned via ?forceMode=${String(forced)}`);
    }

    if (network.saveData === true) {
      reasons.push("Save-Data enabled");
    }

    const effectiveType = network.effectiveType;
    if (effectiveType === "slow-2g" || effectiveType === "2g") {
      reasons.push(`Network: ${String(effectiveType)}`);
    }

    const downlink = network.downlink;
    if (typeof downlink === "number" && !Number.isNaN(downlink) && downlink < 1.5) {
      reasons.push(`Downlink ${String(downlink)} Mb/s (< 1.5)`);
    }

    const rtt = network.rtt;
    if (typeof rtt === "number" && !Number.isNaN(rtt) && rtt > 400) {
      reasons.push(`RTT ${String(rtt)} ms (> 400)`);
    }

    const cores = device.hardwareConcurrency;
    if (typeof cores === "number" && !Number.isNaN(cores) && cores <= 2) {
      reasons.push("CPU \u2264 2 cores");
    }

    const memory = device.deviceMemory;
    if (typeof memory === "number" && !Number.isNaN(memory) && memory <= 2) {
      reasons.push("Memory \u2264 2 GB");
    }

    if (network.source === "unknown") {
      reasons.push("No network signal \u2014 fail-safe CONSTRAINED");
    }

    if (mode === "FULL" && reasons.length === 0) {
      return ["No constraints detected \u2014 full experience"];
    }
    return reasons;
  } catch {
    return [];
  }
}
