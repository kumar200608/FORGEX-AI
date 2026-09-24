// Online prediction of the next link state.
//
// Deliberately small, on-device and explainable: an exponentially-weighted mean
// of observed throughput and latency, plus the trend of that mean, mapped onto
// three states. It is an online statistical model, NOT a trained neural network,
// and it reports the evidence behind every prediction so the dashboard can
// justify it. Nothing leaves the browser and there is no model file to ship.
//
// The value is in the name: the engine reacts to the link, the predictor
// anticipates it, which is what allows a pre-emptive budget change instead of
// the user paying for one slow request before the app notices.

export const PREDICTED_STATES = ['fast', 'moderate', 'slow']

// Where each state sits on the 0..1 quality scale, and how wide its tolerance is.
const CENTRES = { fast: 0.82, moderate: 0.5, slow: 0.16 }
const SIGMA = 0.18

// Below this there is not enough evidence to call anything.
const MIN_SAMPLES = 3

const clamp01 = (v) => Math.max(0, Math.min(1, v))

/** Squash a throughput in Mbps onto 0..1 (0.4 Mbps -> 0, 6.4 Mbps -> 1). */
function speedQuality(mbps) {
  return clamp01(Math.log2((mbps + 0.05) / 0.4) / 4)
}

/** Squash an RTT in ms onto 0..1 (100 ms -> 1, 1000 ms -> 0). */
function latencyQuality(rtt) {
  return clamp01(1 - (rtt - 100) / 900)
}

function softmax(quality) {
  const raw = {}
  let total = 0
  for (const state of PREDICTED_STATES) {
    const distance = Math.abs(quality - CENTRES[state])
    const value = Math.exp(-(distance * distance) / (2 * SIGMA * SIGMA))
    raw[state] = value
    total += value
  }
  const out = {}
  for (const state of PREDICTED_STATES) out[state] = raw[state] / total
  return out
}

export function createPredictor({ alpha = 0.45, maxSamples = 14 } = {}) {
  let speed = null
  let previousSpeed = null
  let latency = null
  let samples = []

  function quality() {
    const s = speed == null ? null : speedQuality(speed)
    const l = latency == null ? null : latencyQuality(latency)
    if (s == null && l == null) return null
    if (s == null) return l
    if (l == null) return s
    // Throughput dominates; latency breaks ties.
    return 0.7 * s + 0.3 * l
  }

  function predict() {
    const q = quality()
    if (q == null || samples.length < MIN_SAMPLES) {
      return { ready: false, state: null, probabilities: null, confidence: 0, basis: [], samples: samples.length }
    }

    // A falling mean is the leading indicator of a degrading link.
    const trend = previousSpeed != null && speed != null && previousSpeed > 0
      ? (speed - previousSpeed) / previousSpeed
      : 0
    const adjusted = clamp01(q + Math.max(-0.15, Math.min(0.15, trend * 0.5)))

    const probabilities = softmax(adjusted)
    const state = PREDICTED_STATES.reduce(
      (best, candidate) => (probabilities[candidate] > probabilities[best] ? candidate : best),
      PREDICTED_STATES[0],
    )

    const basis = []
    if (speed != null) basis.push(`smoothed throughput ${speed.toFixed(2)} Mbps`)
    if (latency != null) basis.push(`smoothed RTT ${Math.round(latency)} ms`)
    if (trend !== 0) basis.push(`throughput ${trend < 0 ? 'falling' : 'rising'} ${Math.abs(trend * 100).toFixed(0)}% per sample`)
    basis.push(`${samples.length} samples`)

    return { ready: true, state, probabilities, confidence: probabilities[state], basis, samples: samples.length }
  }

  /** Feed one observation. Returns the prediction after including it. */
  function push(reading = {}) {
    const mbps = Number(reading.mbps)
    const rtt = Number(reading.rtt)
    const hasSpeed = Number.isFinite(mbps) && mbps > 0
    const hasRtt = Number.isFinite(rtt) && rtt > 0
    if (!hasSpeed && !hasRtt) return predict()

    if (hasSpeed) {
      previousSpeed = speed
      speed = speed == null ? mbps : speed + alpha * (mbps - speed)
    }
    if (hasRtt) latency = latency == null ? rtt : latency + alpha * (rtt - latency)

    samples = [...samples, { mbps: hasSpeed ? mbps : null, rtt: hasRtt ? rtt : null }].slice(-maxSamples)
    return predict()
  }

  function reset() {
    speed = null
    previousSpeed = null
    latency = null
    samples = []
  }

  return { push, predict, reset, get sampleCount() { return samples.length } }
}
