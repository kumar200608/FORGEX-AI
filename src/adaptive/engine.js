// Adaptive engine — turns raw signals into one performance score, maps the
// score to a delivery budget, and explains every decision it makes.

export const MODES = {
  FULL: 'FULL',
  LIGHT: 'LIGHT',
  DATA_SAVER: 'DATA SAVER',
  OFFLINE: 'OFFLINE',
}

// The delivery budget each mode buys. This is the deck's "one score maps to
// one budget": image tier, JS level, feature flags, prefetch policy.
export const BUDGETS = {
  [MODES.FULL]: {
    imageTier: 'high', jsLevel: 'full',
    animations: 'rich', videoPreview: true, zoom: true,
    prefetch: 'all', dataSaver: false, offline: false,
  },
  [MODES.LIGHT]: {
    imageTier: 'mid', jsLevel: 'core',
    animations: 'reduced', videoPreview: false, zoom: false,
    prefetch: 'hover', dataSaver: false, offline: false,
  },
  [MODES.DATA_SAVER]: {
    imageTier: 'low', jsLevel: 'minimal',
    animations: 'off', videoPreview: false, zoom: false,
    prefetch: 'none', dataSaver: true, offline: false,
  },
  [MODES.OFFLINE]: {
    imageTier: 'mid', jsLevel: 'core',
    animations: 'reduced', videoPreview: false, zoom: false,
    prefetch: 'none', dataSaver: false, offline: true,
  },
}

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v))

export function scoreLink(net, probe) {
  let s = 20
  const reasons = []
  const { effectiveType: et, downlink, rtt } = net
  if (et === '4g') { s += 10; reasons.push('effectiveType "4g" (+10)') }
  else if (et === '3g') { s -= 8; reasons.push('effectiveType "3g" (−8)') }
  else if (et === '2g' || et === 'slow-2g') { s -= 25; reasons.push(`effectiveType "${et}" (−25)`) }
  if (downlink != null) {
    if (downlink >= 10) { s += 25; reasons.push(`downlink ${downlink} Mbps (+25)`) }
    else if (downlink >= 5) { s += 20; reasons.push(`downlink ${downlink} Mbps (+20)`) }
    else if (downlink >= 2) { s += 12; reasons.push(`downlink ${downlink} Mbps (+12)`) }
    else if (downlink >= 1) { s += 6; reasons.push(`downlink ${downlink} Mbps (+6)`) }
    else { s -= 5; reasons.push(`downlink ${downlink} Mbps (−5)`) }
  }
  if (rtt != null) {
    if (rtt <= 100) { s += 10; reasons.push(`rtt ${rtt} ms (+10)`) }
    else if (rtt <= 300) { s += 6; reasons.push(`rtt ${rtt} ms (+6)`) }
    else if (rtt <= 600) { s += 2; reasons.push(`rtt ${rtt} ms (+2)`) }
    else { s -= 6; reasons.push(`rtt ${rtt} ms (−6)`) }
  }
  if (probe && probe.ok) {
    const m = probe.mbps
    if (m >= 5) { s = Math.max(s, 40) + 5; reasons.push(`probe ${m.toFixed(1)} Mbps — fast link confirmed (+5)`) }
    else if (m >= 1.2) { s = Math.max(s, 30); reasons.push(`probe ${m.toFixed(1)} Mbps — usable link (floor 30)`) }
    else if (m >= 0.5) { s = Math.min(s, 28); reasons.push(`probe ${m.toFixed(1)} Mbps — weak link (cap 28)`) }
    else { s = Math.min(s, 15); reasons.push(`probe ${m.toFixed(1)} Mbps — very slow link (cap 15)`) }
  }
  return { score: clamp(s, 0, 60), reasons }
}

export function scoreDevice(dev) {
  let s = 0
  const reasons = []
  const m = dev.memoryGB
  if (m != null) {
    if (m >= 8) { s += 25; reasons.push(`memory ≥8 GB (+25)`) }
    else if (m >= 6) { s += 20; reasons.push(`memory ${m} GB (+20)`) }
    else if (m >= 4) { s += 14; reasons.push(`memory ${m} GB (+14)`) }
    else if (m >= 2) { s += 7; reasons.push(`memory ${m} GB (+7)`) }
    else { s += 2; reasons.push(`memory ${m} GB (+2)`) }
  } else {
    s += 14; reasons.push('memory unknown (+14 neutral)')
  }
  const c = dev.cores
  if (c != null) {
    if (c >= 8) { s += 12; reasons.push(`${c} CPU cores (+12)`) }
    else if (c >= 4) { s += 8; reasons.push(`${c} CPU cores (+8)`) }
    else if (c >= 2) { s += 4; reasons.push(`${c} CPU cores (+4)`) }
    else { s += 1; reasons.push(`${c} CPU cores (+1)`) }
  } else {
    s += 8; reasons.push('cores unknown (+8 neutral)')
  }
  if (dev.reducedMotion) { s -= 2; reasons.push('prefers-reduced-motion (−2)') }
  return { score: clamp(s, 0, 45), reasons }
}

// Simulated signals for stage demos, so every deck scenario is reproducible
// without DevTools. Marked as overrides everywhere they appear.
const OVERRIDE_NETWORKS = {
  fast:   { effectiveType: '4g', downlink: 12, rtt: 60, saveData: false, probe: { ok: true, mbps: 12.5 } },
  slow3g: { effectiveType: '3g', downlink: 0.4, rtt: 900, saveData: false, probe: { ok: true, mbps: 0.35 } },
}
const OVERRIDE_DEVICES = {
  high: { memoryGB: 8, cores: 8 },
  low:  { memoryGB: 2, cores: 2 },
}

export function decide(input) {
  const { online, network, device, probe, overrides, previousBudget } = input
  const reasons = []

  if (!online) {
    reasons.push('browser reports no connection — serving from cache')
    return {
      mode: MODES.OFFLINE,
      budget: { ...(previousBudget || BUDGETS[MODES.OFFLINE]), offline: true },
      linkScore: null, deviceScore: null, totalScore: null,
      reasons, signals: { network, device, probe },
    }
  }

  let net = { ...network }
  let prb = probe
  let dev = { ...device }
  let overridden = false

  if (overrides.network && overrides.network !== 'auto') {
    const o = OVERRIDE_NETWORKS[overrides.network]
    net = { effectiveType: o.effectiveType, downlink: o.downlink, rtt: o.rtt, saveData: net.saveData }
    prb = o.probe
    overridden = true
    reasons.push(`network override "${overrides.network}" active (demo)`)
  }
  if (overrides.device && overrides.device !== 'auto') {
    const o = OVERRIDE_DEVICES[overrides.device]
    dev = { ...dev, memoryGB: o.memoryGB, cores: o.cores }
    overridden = true
    reasons.push(`device override "${overrides.device}" active (demo)`)
  }
  if (overrides.saveData) {
    net.saveData = true
    overridden = true
  }

  const link = scoreLink(net, prb)
  const devScore = scoreDevice(dev)
  const total = link.score + devScore.score

  reasons.push(...link.reasons)
  reasons.push(...devScore.reasons)

  let mode
  if (net.saveData) {
    mode = MODES.DATA_SAVER
    reasons.push('Save-Data is on → user asked for less data')
  } else if (link.score < 22) {
    mode = MODES.DATA_SAVER
    reasons.push(`link score ${link.score}/60 < 22 → DATA SAVER`)
  } else if (devScore.score < 20 || link.score < 35) {
    mode = MODES.LIGHT
    reasons.push(devScore.score < 20
      ? `device score ${devScore.score}/45 < 20 → LIGHT`
      : `link score ${link.score}/60 < 35 → LIGHT`)
  } else {
    mode = MODES.FULL
    reasons.push(`total score ${total}/105 → FULL`)
  }

  return {
    mode,
    budget: { ...BUDGETS[mode] },
    linkScore: link.score,
    deviceScore: devScore.score,
    totalScore: total,
    reasons,
    signals: { network: net, device: dev, probe: prb },
    overridden,
  }
}
