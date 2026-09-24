// The preview renderer, driven directly with a recording 2D context so the
// geometry can be asserted without a browser.

import { describe, it, expect, beforeEach } from 'vitest'
import { drawClock360, drawTurntable, startVideoPreview, VIDEO_KINDS } from './video.js'

function makeCtx() {
  const calls = []
  const record = (name) => (...args) => { calls.push({ name, args }) }
  const gradient = { addColorStop: () => {} }

  const ctx = {
    calls,
    createLinearGradient: () => gradient,
    createRadialGradient: () => gradient,
    fillRect: record('fillRect'),
    clearRect: record('clearRect'),
    beginPath: record('beginPath'),
    moveTo: record('moveTo'),
    lineTo: record('lineTo'),
    arc: record('arc'),
    ellipse: record('ellipse'),
    fill: record('fill'),
    stroke: record('stroke'),
    fillText: record('fillText'),
  }
  for (const prop of ['fillStyle', 'strokeStyle', 'lineWidth', 'font', 'textAlign', 'lineCap']) {
    Object.defineProperty(ctx, prop, {
      set: (value) => calls.push({ name: prop, args: [value] }),
      get: () => undefined,
    })
  }
  return ctx
}

const count = (ctx, name) => ctx.calls.filter((c) => c.name === name).length

describe('clock360 renderer', () => {
  it('registers the clock preview as a known kind', () => {
    expect(VIDEO_KINDS).toContain('clock360')
  })

  it('labels every frame', () => {
    const ctx = makeCtx()
    drawClock360(ctx, 400, 300, 0, { dpr: 1 })
    const label = ctx.calls.find((c) => c.name === 'fillText')
    expect(label.args[0]).toBe('PREVIEW 360°')
  })

  it('draws a dial face plus 12 hour ticks and 2 hands while the dial faces us', () => {
    const ctx = makeCtx()
    drawClock360(ctx, 400, 300, 0, { dpr: 1 })   // rotation 0 -> facing
    // shadow, case, face, centre pin
    expect(count(ctx, 'ellipse')).toBe(4)
    // 12 ticks + 2 hands, each a single stroked segment
    expect(count(ctx, 'stroke')).toBe(14)
  })

  it('draws only the case back once the rotation passes edge-on', () => {
    const ctx = makeCtx()
    // rotation = 0.9 * 2.5 = 2.25 rad (~129 deg): cos is negative, so the
    // opaque back of the clock faces the viewer.
    drawClock360(ctx, 400, 300, 2.5, { dpr: 1 })
    expect(count(ctx, 'stroke')).toBe(1)          // rim highlight only
    expect(count(ctx, 'ellipse')).toBe(3)         // shadow + case + rim
  })

  it('rotates: the projected dial moves between frames', () => {
    const facing = makeCtx()
    const rotated = makeCtx()
    drawClock360(facing, 400, 300, 0, { dpr: 1 })
    drawClock360(rotated, 400, 300, 0.2, { dpr: 1 })

    const ticks = (ctx) => ctx.calls.filter((c) => c.name === 'moveTo').map((c) => c.args[0])
    expect(ticks(facing)).not.toEqual(ticks(rotated))
  })

  it('keeps the silhouette visible when the dial is exactly edge-on', () => {
    const ctx = makeCtx()
    // rotation = pi/2 -> the disc is edge-on; the case must not vanish.
    drawClock360(ctx, 400, 300, Math.PI / 2 / 0.9, { dpr: 1 })
    const caseEllipse = ctx.calls.filter((c) => c.name === 'ellipse')[1]
    expect(caseEllipse.args[2]).toBeGreaterThan(0)   // radiusX
  })

  it('scales the tick weight with the device pixel ratio', () => {
    const one = makeCtx()
    const two = makeCtx()
    drawClock360(one, 400, 300, 0, { dpr: 1 })
    drawClock360(two, 400, 300, 0, { dpr: 2 })
    const widths = (ctx) => ctx.calls.filter((c) => c.name === 'lineWidth').map((c) => c.args[0])
    expect(Math.max(...widths(two))).toBe(Math.max(...widths(one)) * 2)
  })
})

describe('turntable renderer', () => {
  it('stays the generic spin: arcs, no dial ellipses', () => {
    const ctx = makeCtx()
    drawTurntable(ctx, 400, 300, 0.4, { dpr: 1 })
    expect(count(ctx, 'arc')).toBeGreaterThan(0)
    expect(count(ctx, 'ellipse')).toBe(0)
  })
})

describe('startVideoPreview', () => {
  let frames

  beforeEach(() => {
    frames = []
    globalThis.window = { devicePixelRatio: 2 }
    globalThis.requestAnimationFrame = (fn) => { frames.push(fn); return frames.length }
    globalThis.cancelAnimationFrame = () => {}
  })

  function makeCanvas(ctx) {
    return { clientWidth: 300, clientHeight: 200, width: 0, height: 0, getContext: () => ctx }
  }

  it('backs the canvas at the device pixel ratio', () => {
    const ctx = makeCtx()
    const canvas = makeCanvas(ctx)
    const stop = startVideoPreview(canvas, { kind: 'clock360' })
    expect(canvas.width).toBe(600)
    expect(canvas.height).toBe(400)
    expect(typeof stop).toBe('function')
    stop()
  })

  it('draws each frame and schedules the next', () => {
    const ctx = makeCtx()
    const canvas = makeCanvas(ctx)
    startVideoPreview(canvas, { kind: 'clock360' })
    expect(frames).toHaveLength(1)

    frames[0](16)
    expect(ctx.calls.length).toBeGreaterThan(10)
    expect(frames).toHaveLength(2)
  })

  it('draws nothing more after stop, even for an already-scheduled frame', () => {
    const ctx = makeCtx()
    const stop = startVideoPreview(makeCanvas(ctx), { kind: 'clock360' })
    const scheduled = frames[frames.length - 1]
    stop()
    const before = ctx.calls.length
    scheduled(32)
    expect(ctx.calls.length).toBe(before)
  })

  it('defaults to the turntable when no kind is given', () => {
    const ctx = makeCtx()
    startVideoPreview(makeCanvas(ctx), {})
    frames[0](16)
    expect(count(ctx, 'arc')).toBeGreaterThan(0)
    expect(count(ctx, 'ellipse')).toBe(0)
  })
})
