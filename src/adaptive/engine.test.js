// Behavioural tests for the pure scoring engine (`engine.js`).
//
// These assert what the engine actually does with real signal shapes —
// including the values either side of every threshold in the code, the
// "unknown signal" branches, and which single rule was responsible for a mode.
// No DOM: scoreLink / scoreDevice / decide are pure functions.

import { describe, it, expect } from 'vitest'
import { scoreLink, scoreDevice, decide, MODES, BUDGETS } from './engine.js'

// A complete, all-signals-present input: fast link + capable device -> FULL.
const input = (over = {}) => ({
  online: true,
  network: { effectiveType: '4g', downlink: 12, rtt: 50, saveData: false },
  device: { memoryGB: 8, cores: 8 },
  probe: { ok: true, mbps: 12.5 },
  overrides: {},
  previousBudget: null,
  ...over,
})

const why = (decision) => decision.reasons.join(' | ')

describe('scoreLink — passive network signals', () => {
  const passive = (network) => scoreLink(network, null).score

  it('scores an all-unknown network as the neutral baseline of 20 with no reasons', () => {
    expect(scoreLink({}, null)).toEqual({ score: 20, reasons: [] })
    expect(scoreLink({ effectiveType: null, downlink: null, rtt: null }, null).score).toBe(20)
    expect(scoreLink({ effectiveType: undefined, downlink: undefined, rtt: undefined }, null).score).toBe(20)
  })

  it('treats the connection classes differently and an unrecognised class as neutral', () => {
    expect(passive({ effectiveType: '4g' })).toBe(30)
    expect(passive({ effectiveType: '3g' })).toBe(12)
    expect(passive({ effectiveType: '2g' })).toBe(0)      // 20 - 25, clamped at 0
    expect(passive({ effectiveType: 'slow-2g' })).toBe(0)
    expect(passive({ effectiveType: 'unknown' })).toBe(20)
  })

  it('steps downlink at 10, 5, 2 and 1 Mbps', () => {
    expect(passive({ downlink: 100 })).toBe(45)
    expect(passive({ downlink: 10 })).toBe(45)
    expect(passive({ downlink: 9.9 })).toBe(40)
    expect(passive({ downlink: 5 })).toBe(40)
    expect(passive({ downlink: 4.9 })).toBe(32)
    expect(passive({ downlink: 2 })).toBe(32)
    expect(passive({ downlink: 1.9 })).toBe(26)
    expect(passive({ downlink: 1 })).toBe(26)
    expect(passive({ downlink: 0.9 })).toBe(15)
  })

  it('treats a reported downlink of 0 as a real (poor) reading, not as "unknown"', () => {
    const zero = scoreLink({ downlink: 0 }, null)
    expect(zero.score).toBe(15)
    expect(zero.reasons.join(' | ')).toContain('downlink 0 Mbps')
  })

  it('steps rtt at 100, 300 and 600 ms', () => {
    expect(passive({ rtt: 0 })).toBe(30)
    expect(passive({ rtt: 100 })).toBe(30)
    expect(passive({ rtt: 101 })).toBe(26)
    expect(passive({ rtt: 300 })).toBe(26)
    expect(passive({ rtt: 301 })).toBe(22)
    expect(passive({ rtt: 600 })).toBe(22)
    expect(passive({ rtt: 601 })).toBe(14)
  })

  it('clamps the worst possible passive reading to 0 rather than going negative', () => {
    const worst = scoreLink({ effectiveType: '2g', downlink: 0.4, rtt: 900 }, null)
    expect(worst.score).toBe(0)
    expect(worst.reasons.join(' | ')).toContain('effectiveType "2g"')
  })

  it('explains every passive rule that fired', () => {
    const r = scoreLink({ effectiveType: '3g', downlink: 5, rtt: 250 }, null)
    expect(r.score).toBe(38)                                  // 20 - 8 + 20 + 6
    expect(r.reasons).toHaveLength(3)
    expect(r.reasons.join(' | ')).toContain('effectiveType "3g"')
    expect(r.reasons.join(' | ')).toContain('downlink 5 Mbps')
    expect(r.reasons.join(' | ')).toContain('rtt 250 ms')
  })
})

describe('scoreLink — active probe', () => {
  const probed = (mbps, network = {}) => scoreLink(network, { ok: true, mbps }).score

  it('ignores the probe entirely when it did not succeed', () => {
    expect(scoreLink({}, { ok: false, error: 'unexpected probe response' })).toEqual({ score: 20, reasons: [] })
    expect(scoreLink({}, { ok: false, mbps: 99 }).score).toBe(20)   // a failed probe says nothing about the link
    expect(scoreLink({}, { mbps: 99 }).score).toBe(20)              // no ok flag at all -> not a measurement
  })

  it('steps the probe measurement at 5, 1.2 and 0.5 Mbps', () => {
    expect(probed(50)).toBe(45)     // max(20, 40) + 5
    expect(probed(5)).toBe(45)
    expect(probed(4.9)).toBe(30)    // max(20, 30)
    expect(probed(1.2)).toBe(30)
    expect(probed(1.19)).toBe(20)   // min(20, 28)
    expect(probed(0.5)).toBe(20)
    expect(probed(0.49)).toBe(15)   // min(20, 15)
  })

  it('lets the probe rescue a link the passive signals called unusable', () => {
    const terrible = { effectiveType: '2g', downlink: 0.4, rtt: 900 }
    expect(scoreLink(terrible, null).score).toBe(0)
    expect(scoreLink(terrible, { ok: true, mbps: 6 }).score).toBe(45)
  })

  it('lets the probe cap a link the passive signals called fast', () => {
    const fast = { effectiveType: '4g', downlink: 12, rtt: 50 }
    expect(scoreLink(fast, { ok: true, mbps: 12.5 }).score).toBe(60)
    expect(scoreLink(fast, { ok: true, mbps: 0.3 }).score).toBe(15)
  })

  it('does not push a good score down when the probe is merely mid-range', () => {
    expect(probed(2, { effectiveType: '4g', downlink: 12 })).toBe(55)  // max(55, 30)
  })

  it('reports the measured throughput in the reason it adds', () => {
    const r = scoreLink({}, { ok: true, mbps: 12.5 })
    expect(r.reasons.join(' | ')).toContain('probe 12.5 Mbps')
    expect(r.reasons.join(' | ')).toContain('fast link confirmed')
  })
})

describe('scoreDevice', () => {
  it('scores both missing signals as the documented neutral constant', () => {
    const r = scoreDevice({})
    expect(r.score).toBe(22)                       // +14 memory unknown, +8 cores unknown
    expect(r.reasons.join(' | ')).toContain('memory unknown (+14 neutral)')
    expect(r.reasons.join(' | ')).toContain('cores unknown (+8 neutral)')
    expect(scoreDevice({ memoryGB: null, cores: null }).score).toBe(22)
  })

  it('steps memory at 8, 6, 4 and 2 GB (cores held unknown)', () => {
    expect(scoreDevice({ memoryGB: 8 }).score).toBe(33)     // +25
    expect(scoreDevice({ memoryGB: 7 }).score).toBe(28)     // +20
    expect(scoreDevice({ memoryGB: 6 }).score).toBe(28)
    expect(scoreDevice({ memoryGB: 5 }).score).toBe(22)     // +14
    expect(scoreDevice({ memoryGB: 4 }).score).toBe(22)
    expect(scoreDevice({ memoryGB: 3 }).score).toBe(15)     // +7
    expect(scoreDevice({ memoryGB: 2 }).score).toBe(15)
    expect(scoreDevice({ memoryGB: 1 }).score).toBe(10)     // +2
    expect(scoreDevice({ memoryGB: 0.25 }).score).toBe(10)
  })

  it('steps cores at 8, 4 and 2 (memory held unknown)', () => {
    expect(scoreDevice({ cores: 16 }).score).toBe(26)       // +12
    expect(scoreDevice({ cores: 8 }).score).toBe(26)
    expect(scoreDevice({ cores: 7 }).score).toBe(22)        // +8
    expect(scoreDevice({ cores: 4 }).score).toBe(22)
    expect(scoreDevice({ cores: 3 }).score).toBe(18)        // +4
    expect(scoreDevice({ cores: 2 }).score).toBe(18)
    expect(scoreDevice({ cores: 1 }).score).toBe(15)        // +1
  })

  it('subtracts 2 for prefers-reduced-motion', () => {
    expect(scoreDevice({ memoryGB: 8, cores: 8 }).score).toBe(37)                                  // 25 + 12
    const r = scoreDevice({ memoryGB: 8, cores: 8, reducedMotion: true })
    expect(r.score).toBe(35)
    expect(r.reasons.join(' | ')).toContain('prefers-reduced-motion')
  })

  it('separates a low-end device from a high-end one by 26 points', () => {
    const low = scoreDevice({ memoryGB: 2, cores: 2 }).score
    const high = scoreDevice({ memoryGB: 8, cores: 8 }).score
    expect(low).toBe(11)
    expect(high).toBe(37)
    expect(high - low).toBe(26)
  })
})

describe('decide — mode selection', () => {
  it('picks FULL when both the link and the device are strong', () => {
    const d = decide(input())
    expect(d.mode).toBe(MODES.FULL)
    expect(d.linkScore).toBe(60)
    expect(d.deviceScore).toBe(37)
    expect(d.totalScore).toBe(97)
    expect(d.budget).toEqual(BUDGETS[MODES.FULL])
    expect(d.overridden).toBe(false)
  })

  it('maps each mode to its delivery budget', () => {
    expect(decide(input()).budget.imageTier).toBe('high')
    expect(decide(input()).budget.jsLevel).toBe('full')

    const light = decide(input({ network: { effectiveType: '3g', downlink: 2.5, rtt: 250 }, probe: null }))
    expect(light.mode).toBe(MODES.LIGHT)
    expect(light.budget).toEqual(BUDGETS[MODES.LIGHT])

    const saver = decide(input({ network: { effectiveType: '3g', downlink: 1.5, rtt: 700 }, probe: null }))
    expect(saver.mode).toBe(MODES.DATA_SAVER)
    expect(saver.budget).toEqual(BUDGETS[MODES.DATA_SAVER])
  })

  it('downgrades a fast link to LIGHT when the device alone is weak', () => {
    const d = decide(input({ device: { memoryGB: 1, cores: 1 } }))
    expect(d.linkScore).toBe(60)          // the link never changed
    expect(d.deviceScore).toBe(3)
    expect(d.mode).toBe(MODES.LIGHT)
    expect(why(d)).toContain('device score 3/45 < 20')
  })

  it('downgrades a fast link to DATA SAVER when the link alone is weak', () => {
    const d = decide(input({ network: { effectiveType: '3g', downlink: 1.5, rtt: 700, saveData: false }, probe: null }))
    expect(d.deviceScore).toBe(37)        // the device is capable
    expect(d.linkScore).toBe(12)
    expect(d.mode).toBe(MODES.DATA_SAVER)
    expect(why(d)).toContain('link score 12/60')
  })

  it('flips DATA SAVER to LIGHT exactly at link score 22', () => {
    const at = decide(input({ network: { rtt: 400 }, probe: null }))    // 20 + 2
    const below = decide(input({ network: {}, probe: null }))           // 20
    expect(at.linkScore).toBe(22)
    expect(at.deviceScore).toBe(37)
    expect(at.mode).toBe(MODES.LIGHT)
    expect(below.linkScore).toBe(20)
    expect(below.mode).toBe(MODES.DATA_SAVER)
  })

  it('flips LIGHT to FULL exactly at link score 35', () => {
    const under = decide(input({ network: { downlink: 5, rtt: 700 }, probe: null }))            // 34
    const over = decide(input({ network: { effectiveType: '4g', downlink: 1 }, probe: null }))  // 36
    expect(under.linkScore).toBe(34)
    expect(under.deviceScore).toBe(37)
    expect(under.mode).toBe(MODES.LIGHT)
    expect(over.linkScore).toBe(36)
    expect(over.mode).toBe(MODES.FULL)
  })

  it('flips LIGHT to FULL exactly at device score 20, with the link left strong', () => {
    const at = decide(input({ device: { memoryGB: null, cores: null, reducedMotion: true } }))  // 22 - 2
    const under = decide(input({ device: { memoryGB: 2, cores: 8 } }))                          // 7 + 12
    expect(at.linkScore).toBe(60)
    expect(at.deviceScore).toBe(20)
    expect(at.mode).toBe(MODES.FULL)
    expect(under.linkScore).toBe(60)
    expect(under.deviceScore).toBe(19)
    expect(under.mode).toBe(MODES.LIGHT)
    expect(why(under)).toContain('device score 19/45 < 20')
  })

  it('lets a sub-1 Mbps probe alone push a 4g reading into DATA SAVER', () => {
    const d = decide(input({ probe: { ok: true, mbps: 0.3 } }))
    expect(d.linkScore).toBe(15)          // the passive signals said 60
    expect(d.deviceScore).toBe(37)
    expect(d.mode).toBe(MODES.DATA_SAVER)
  })

  it.each([
    ['fast link + capable device', {}, MODES.FULL],
    ['fast link + weak device', { device: { memoryGB: 1, cores: 1 } }, MODES.LIGHT],
    ['mid link + capable device', { network: { effectiveType: '3g', downlink: 2.5, rtt: 250 }, probe: null }, MODES.LIGHT],
    ['weak link + capable device', { network: { effectiveType: '3g', downlink: 1.5, rtt: 700 }, probe: null }, MODES.DATA_SAVER],
    ['unknown signals everywhere', { network: {}, device: {}, probe: null }, MODES.DATA_SAVER],
    ['Save-Data on', { overrides: { saveData: true } }, MODES.DATA_SAVER],
    ['offline', { online: false }, MODES.OFFLINE],
  ])('%s', (_label, over, expected) => {
    expect(decide(input(over)).mode).toBe(expected)
  })
})

describe('decide — Save-Data', () => {
  it('lets the user request override strong signals from any source', () => {
    const d = decide(input({ overrides: { saveData: true } }))
    expect(d.mode).toBe(MODES.DATA_SAVER)
    expect(d.linkScore).toBe(60)          // the signals were fine: this is an explicit request
    expect(d.deviceScore).toBe(37)
    expect(d.overridden).toBe(true)
    expect(why(d)).toContain('Save-Data is on')
  })

  it('honours Save-Data reported by the browser itself, without calling it an override', () => {
    const d = decide(input({ network: { effectiveType: '4g', downlink: 12, rtt: 50, saveData: true } }))
    expect(d.mode).toBe(MODES.DATA_SAVER)
    expect(d.overridden).toBe(false)
    expect(d.linkScore).toBe(60)
  })

  it('outranks the device rule it would otherwise fall into', () => {
    const d = decide(input({ device: { memoryGB: 2, cores: 2 }, overrides: { saveData: true } }))
    expect(d.deviceScore).toBe(11)        // weak device alone would have been LIGHT
    expect(d.mode).toBe(MODES.DATA_SAVER)
  })

  it('does not mutate the network reading it was handed', () => {
    const network = { effectiveType: '4g', downlink: 12, rtt: 50, saveData: false }
    decide(input({ network, overrides: { saveData: true } }))
    expect(network.saveData).toBe(false)
  })
})

describe('decide — demo overrides', () => {
  it('replaces the network signals and the probe together', () => {
    const d = decide(input({ overrides: { network: 'slow3g' } }))
    expect(d.overridden).toBe(true)
    expect(d.signals.network.effectiveType).toBe('3g')
    expect(d.signals.network.downlink).toBe(0.4)
    expect(d.signals.probe.mbps).toBe(0.35)
    expect(d.linkScore).toBe(1)           // 20 - 8 - 5 - 6
    expect(d.mode).toBe(MODES.DATA_SAVER)
    expect(why(d)).toContain('network override "slow3g"')
  })

  it('keeps the real Save-Data flag when a network override is active', () => {
    const d = decide(input({
      network: { effectiveType: '4g', downlink: 0.5, rtt: 900, saveData: true },
      overrides: { network: 'fast' },
    }))
    expect(d.signals.network.effectiveType).toBe('4g')   // the override won
    expect(d.signals.network.saveData).toBe(true)        // the user's request survived
    expect(d.mode).toBe(MODES.DATA_SAVER)
  })

  it('overrides only memory and cores, leaving the rest of the reading intact', () => {
    const d = decide(input({
      device: { memoryGB: 8, cores: 8, reducedMotion: true },
      overrides: { device: 'low' },
    }))
    expect(d.overridden).toBe(true)
    expect(d.signals.device.memoryGB).toBe(2)
    expect(d.signals.device.cores).toBe(2)
    expect(d.signals.device.reducedMotion).toBe(true)    // a real preference, not a demo knob
    expect(d.deviceScore).toBe(9)                        // 7 + 4 - 2
    expect(d.mode).toBe(MODES.LIGHT)
    expect(why(d)).toContain('device override "low"')
  })

  it('treats "auto" as no override at all', () => {
    const d = decide(input({ overrides: { network: 'auto', device: 'auto' } }))
    expect(d.overridden).toBe(false)
    expect(d.linkScore).toBe(60)
    expect(d.mode).toBe(MODES.FULL)
  })
})

describe('decide — OFFLINE', () => {
  it('wins over every other signal, overrides and Save-Data included', () => {
    const d = decide(input({ online: false, overrides: { network: 'fast', saveData: true } }))
    expect(d.mode).toBe(MODES.OFFLINE)
    expect(d.linkScore).toBeNull()
    expect(d.deviceScore).toBeNull()
    expect(d.totalScore).toBeNull()
    expect(d.budget).toEqual(BUDGETS[MODES.OFFLINE])
    expect(d.reasons).toHaveLength(1)
    expect(d.reasons[0]).toContain('browser reports no connection')
  })

  it('keeps the previous budget, flagged offline, so cached rendering is unchanged', () => {
    const d = decide(input({ online: false, previousBudget: BUDGETS[MODES.FULL] }))
    expect(d.budget).toEqual({ ...BUDGETS[MODES.FULL], offline: true })
    expect(d.budget.imageTier).toBe('high')
    expect(d.budget.offline).toBe(true)
  })

  it('falls back to the OFFLINE budget when there is no previous delivery to keep', () => {
    const d = decide(input({ online: false, previousBudget: null }))
    expect(d.budget).toEqual(BUDGETS[MODES.OFFLINE])
  })
})
