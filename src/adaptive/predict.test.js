import { describe, it, expect } from 'vitest'
import { createPredictor, PREDICTED_STATES } from './predict.js'

const feed = (predictor, readings) => readings.reduce((last, r) => predictor.push(r) ?? last, null)

describe('createPredictor', () => {
  it('refuses to guess before it has evidence', () => {
    const p = createPredictor()
    expect(p.predict()).toMatchObject({ ready: false, state: null, confidence: 0 })
    p.push({ mbps: 12, rtt: 60 })
    expect(p.predict().ready).toBe(false)          // one sample is not a trend
    p.push({ mbps: 12, rtt: 60 })
    expect(p.predict().ready).toBe(false)
    p.push({ mbps: 12, rtt: 60 })
    expect(p.predict().ready).toBe(true)
  })

  it('predicts a fast link from sustained fast readings', () => {
    const p = createPredictor()
    const result = feed(p, Array.from({ length: 6 }, () => ({ mbps: 14, rtt: 55 })))
    expect(result.state).toBe('fast')
    expect(result.confidence).toBeGreaterThan(0.6)
  })

  it('predicts a slow link from sustained slow readings', () => {
    const p = createPredictor()
    const result = feed(p, Array.from({ length: 6 }, () => ({ mbps: 0.35, rtt: 900 })))
    expect(result.state).toBe('slow')
    expect(result.confidence).toBeGreaterThan(0.6)
  })

  it('predicts a degrading link sooner when the trend is falling than when it is flat', () => {
    const flat = createPredictor()
    feed(flat, Array.from({ length: 6 }, () => ({ mbps: 3, rtt: 300 })))

    const falling = createPredictor()
    feed(falling, [
      { mbps: 12, rtt: 80 },
      { mbps: 8, rtt: 120 },
      { mbps: 4, rtt: 260 },
      { mbps: 1.5, rtt: 500 },
    ])

    const flatSlowness = flat.predict().probabilities.slow
    const fallingSlowness = falling.predict().probabilities.slow
    expect(fallingSlowness).toBeGreaterThan(flatSlowness)
    expect(falling.predict().basis.join(' ')).toMatch(/falling/)
  })

  it('always returns a normalised distribution over the three states', () => {
    const p = createPredictor()
    const result = feed(p, [{ mbps: 2, rtt: 400 }, { mbps: 2.4, rtt: 380 }, { mbps: 1.9, rtt: 420 }])
    const total = PREDICTED_STATES.reduce((sum, s) => sum + result.probabilities[s], 0)
    expect(total).toBeCloseTo(1, 9)
    expect(PREDICTED_STATES).toContain(result.state)
  })

  it('reports the evidence behind the prediction', () => {
    const p = createPredictor()
    const result = feed(p, [{ mbps: 6, rtt: 200 }, { mbps: 6, rtt: 200 }, { mbps: 6, rtt: 200 }])
    const basis = result.basis.join(' | ')
    expect(basis).toMatch(/smoothed throughput/)
    expect(basis).toMatch(/smoothed RTT/)
    expect(basis).toMatch(/3 samples/)
  })

  it('survives partial and nonsense readings', () => {
    const p = createPredictor()
    expect(p.push({})).toMatchObject({ ready: false })
    expect(p.push({ mbps: 'fast' })).toMatchObject({ ready: false })
    expect(p.push({ rtt: -5 })).toMatchObject({ ready: false })
    const result = p.push({ mbps: 5 })
    expect(result.samples).toBe(1)
  })

  it('bounds the window and can be reset', () => {
    const p = createPredictor({ maxSamples: 4 })
    feed(p, Array.from({ length: 9 }, () => ({ mbps: 5, rtt: 200 })))
    expect(p.sampleCount).toBe(4)
    p.reset()
    expect(p.sampleCount).toBe(0)
    expect(p.predict().ready).toBe(false)
  })

  it('lets latency pull a prediction down when throughput is unremarkable', () => {
    const lowLatency = createPredictor()
    const highLatency = createPredictor()
    feed(lowLatency, Array.from({ length: 5 }, () => ({ mbps: 3, rtt: 90 })))
    feed(highLatency, Array.from({ length: 5 }, () => ({ mbps: 3, rtt: 950 })))
    expect(highLatency.predict().probabilities.slow).toBeGreaterThan(lowLatency.predict().probabilities.slow)
  })
})
