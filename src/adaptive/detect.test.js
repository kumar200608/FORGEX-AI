// Tests for the non-Chromium device-signal fallback in `detect.js`.
//
// `readDevice()` only reaches for navigator / window / matchMedia, so a
// hand-rolled global stub is enough — no DOM environment is needed.
// `classifyFallbackDevice()` is pure and is tested directly.

import { describe, it, expect, vi, afterEach } from 'vitest'
import { classifyFallbackDevice } from './detect.js'

const px = (w, h, dpr = 1) => w * h * dpr * dpr

function stubBrowser({
  deviceMemory,
  hardwareConcurrency,
  screen: screenSize = { width: 1920, height: 1080 },
  dpr = 1,
  coarse = false,
  touchPoints = 0,
  reducedMotion = false,
  innerW = 1280,
  innerH = 720,
} = {}) {
  vi.stubGlobal('navigator', { deviceMemory, hardwareConcurrency, maxTouchPoints: touchPoints, onLine: true })
  vi.stubGlobal('window', {
    innerWidth: innerW,
    innerHeight: innerH,
    devicePixelRatio: dpr,
    screen: screenSize,
    matchMedia: (q) => ({ matches: q.includes('coarse') ? coarse : q.includes('reduced-motion') ? reducedMotion : false }),
  })
}

const freshDetect = async () => {
  vi.resetModules()          // the fallback estimate is memoised per module instance
  return import('./detect.js')
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.resetModules()
})

describe('classifyFallbackDevice — the estimate ladder', () => {
  it('scales with the physical framebuffer the device is driving', () => {
    expect(classifyFallbackDevice({ physicalPixels: px(1366, 768, 1) })).toEqual({ memoryGB: 2, cores: 2 })
    expect(classifyFallbackDevice({ physicalPixels: px(1920, 1080, 1) })).toEqual({ memoryGB: 4, cores: 4 })
    expect(classifyFallbackDevice({ physicalPixels: px(2560, 1440, 1) })).toEqual({ memoryGB: 8, cores: 4 })
    expect(classifyFallbackDevice({ physicalPixels: px(3840, 2160, 1) })).toEqual({ memoryGB: 8, cores: 8 })
  })

  it('steps exactly at the pixel thresholds', () => {
    expect(classifyFallbackDevice({ physicalPixels: 6e6 }).cores).toBe(8)
    expect(classifyFallbackDevice({ physicalPixels: 6e6 - 1 }).cores).toBe(4)
    expect(classifyFallbackDevice({ physicalPixels: 3e6 }).memoryGB).toBe(8)
    expect(classifyFallbackDevice({ physicalPixels: 3e6 - 1 }).memoryGB).toBe(4)
    expect(classifyFallbackDevice({ physicalPixels: 1.5e6 }).memoryGB).toBe(4)
    expect(classifyFallbackDevice({ physicalPixels: 1.5e6 - 1 }).memoryGB).toBe(2)
  })

  it('never estimates a bigger screen below a smaller one', () => {
    const ladder = [0.4e6, 1e6, 1.5e6, 2.5e6, 3e6, 4.5e6, 6e6, 9e6].map((p) => classifyFallbackDevice({ physicalPixels: p }))
    for (let i = 1; i < ladder.length; i++) {
      expect(ladder[i].memoryGB).toBeGreaterThanOrEqual(ladder[i - 1].memoryGB)
      expect(ladder[i].cores).toBeGreaterThanOrEqual(ladder[i - 1].cores)
    }
  })

  it('moves at most one tier on the CPU sample, in either direction', () => {
    const at1080p = (opsPerMs) => classifyFallbackDevice({ physicalPixels: px(1920, 1080, 1), opsPerMs })
    expect(at1080p(0).memoryGB).toBe(4)        // no measurement -> screen tier only
    expect(at1080p(1499).memoryGB).toBe(2)     // slower than the slow band -> one tier down
    expect(at1080p(1500).memoryGB).toBe(4)     // band edge is neutral
    expect(at1080p(19999).memoryGB).toBe(4)
    expect(at1080p(20000).memoryGB).toBe(8)    // one tier up, never two (which would be 16)
  })

  it('cannot push the estimate past the ends of the ladder', () => {
    expect(classifyFallbackDevice({ physicalPixels: 0, opsPerMs: 500 })).toEqual({ memoryGB: 2, cores: 2 })
    expect(classifyFallbackDevice({ physicalPixels: px(3840, 2160, 1), opsPerMs: 90000 })).toEqual({ memoryGB: 8, cores: 8 })
  })

  it('caps a handheld however many pixels it drives', () => {
    const densePhonePanel = px(390, 844, 4)   // 5.3 M physical pixels
    expect(classifyFallbackDevice({ physicalPixels: densePhonePanel, coarsePointer: false })).toEqual({ memoryGB: 8, cores: 4 })
    expect(classifyFallbackDevice({
      physicalPixels: densePhonePanel, coarsePointer: true, touchPoints: 5, shortSide: 390,
    })).toEqual({ memoryGB: 4, cores: 4 })
  })

  it('treats a touch-capable device with a large short side as a desktop, not a handheld', () => {
    expect(classifyFallbackDevice({
      physicalPixels: px(2560, 1440, 1), coarsePointer: true, touchPoints: 10, shortSide: 1440,
    })).toEqual({ memoryGB: 8, cores: 4 })
  })
})

describe('readDevice', () => {
  it('uses the native signals, untouched, when the browser exposes them', async () => {
    stubBrowser({ deviceMemory: 8, hardwareConcurrency: 8 })
    const { readDevice } = await freshDetect()

    const d = readDevice()
    expect(d.memoryGB).toBe(8)
    expect(d.cores).toBe(8)
    expect(d.deviceFallback).toBe(false)
  })

  it('keeps the viewport, pointer and motion reads on both paths', async () => {
    stubBrowser({ deviceMemory: 8, hardwareConcurrency: 4, coarse: true, reducedMotion: true, innerW: 390, innerH: 844 })
    const { readDevice } = await freshDetect()

    expect(readDevice()).toMatchObject({
      viewportW: 390, viewportH: 844, coarsePointer: true, reducedMotion: true,
    })
  })

  it('estimates memory but keeps the real core count when only memory is missing', async () => {
    stubBrowser({ hardwareConcurrency: 4, screen: { width: 1440, height: 900 }, dpr: 2 })
    const { readDevice } = await freshDetect()

    const d = readDevice()
    expect(d.deviceFallback).toBe(true)
    expect(d.cores).toBe(4)                                  // a real reading is never replaced
    expect([2, 4, 8]).toContain(d.memoryGB)
  })

  it('estimates both fields when the browser exposes neither', async () => {
    stubBrowser({ screen: { width: 390, height: 844 }, dpr: 3, coarse: true, touchPoints: 5 })
    const { readDevice } = await freshDetect()

    const d = readDevice()
    expect(d.deviceFallback).toBe(true)
    expect([2, 4, 8]).toContain(d.memoryGB)
    expect(d.memoryGB).toBeLessThanOrEqual(4)                // handheld cap
    expect(d.cores).toBeLessThanOrEqual(4)
  })

  it('estimates a large panel as a capable device', async () => {
    stubBrowser({ screen: { width: 3840, height: 2160 }, dpr: 1 })
    const { readDevice } = await freshDetect()

    const d = readDevice()
    expect(d.deviceFallback).toBe(true)
    expect(d.memoryGB).toBe(8)
    expect(d.cores).toBeGreaterThanOrEqual(4)
  })

  it('computes the estimate once and reuses it, so re-decisions stay cheap', async () => {
    stubBrowser({ screen: { width: 3840, height: 2160 }, dpr: 1 })
    const { readDevice } = await freshDetect()

    const first = readDevice()
    stubBrowser({ screen: { width: 320, height: 480 }, dpr: 1, coarse: true, touchPoints: 5 })
    const second = readDevice()

    expect(second.memoryGB).toBe(first.memoryGB)
    expect(second.cores).toBe(first.cores)
  })
})

describe('the fallback actually restores device discrimination', () => {
  it('scores an estimated weak handheld below the LIGHT threshold the neutral constant never reached', async () => {
    const { scoreDevice, decide, MODES } = await import('./engine.js')

    const unknown = { memoryGB: null, cores: null }            // what Firefox/Safari used to send
    const weakHandheld = classifyFallbackDevice({ physicalPixels: px(320, 480), coarsePointer: true, touchPoints: 5, shortSide: 320 })

    expect(scoreDevice(unknown).score).toBe(22)
    expect(scoreDevice(weakHandheld).score).toBe(11)

    const fastLink = { effectiveType: '4g', downlink: 12, rtt: 50, saveData: false }
    const probe = { ok: true, mbps: 12.5 }
    const modeFor = (device) => decide({ online: true, network: fastLink, device, probe, overrides: {} }).mode

    expect(modeFor(unknown)).toBe(MODES.FULL)
    expect(modeFor(weakHandheld)).toBe(MODES.LIGHT)
  })
})
