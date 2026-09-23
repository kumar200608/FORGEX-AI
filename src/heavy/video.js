// HEAVY MODULE - video.js (chunk: heavy-video)
// Canvas-rendered preview of the product. Costs a render loop per second of CPU
// plus its own network chunk, so the engine only ships it on FULL delivery.
// (Simulated footage keeps the demo self-contained and offline-safe - no media
// files to download.)
//
// Two previews, chosen per product by `product.preview`:
//   'turntable' - the abstract generic spin (the default)
//   'clock360'  - a real 360-degree rotation of the clock: the dial face sweeps
//                 through edge-on to the case back and the hands show the time

export const VIDEO_KINDS = ['turntable', 'clock360']

export function startVideoPreview(canvas, options = {}) {
  const { kind = 'turntable', hueA = 205, hueB = 165 } = options

  const ctx = canvas.getContext('2d')
  const dpr = window.devicePixelRatio || 1
  const W = (canvas.width = Math.max(1, Math.round(canvas.clientWidth * dpr)))
  const H = (canvas.height = Math.max(1, Math.round(canvas.clientHeight * dpr)))
  let running = true
  let raf = null
  const t0 = performance.now()
  const draw = kind === 'clock360' ? drawClock360 : drawTurntable

  function frame(now) {
    if (!running) return
    const t = (now - t0) / 1000
    draw(ctx, W, H, t, { dpr, hueA, hueB })
    raf = requestAnimationFrame(frame)
  }
  raf = requestAnimationFrame(frame)

  return function stop() {
    running = false
    if (raf) cancelAnimationFrame(raf)
  }
}

/**
 * One frame of the 360-degree clock.
 *
 * The dial is treated as a flat disc rotated about the vertical axis, so every
 * point is projected with a single horizontal factor `k = cos(rotation)`:
 *   screen = (cx + u * r * k, cy - v * r)
 * At k = 1 the dial faces the viewer, at k = 0 it is edge-on, and past that we
 * are looking at the back of the case - which is opaque, so the dial (and its
 * hands) are simply not drawn rather than shown mirrored.
 *
 * Exported so it can be driven directly by a test with a recording 2D context.
 */
export function drawClock360(ctx, W, H, t, { dpr = 1 } = {}) {
  const bg = ctx.createLinearGradient(0, 0, 0, H)
  bg.addColorStop(0, 'hsl(214 24% 16%)')
  bg.addColorStop(1, 'hsl(220 28% 8%)')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)

  const cx = W / 2
  const cy = H / 2
  const R = Math.min(W, H) * 0.36
  const rot = t * 0.9                 // one full turn every ~7 seconds
  const k = Math.cos(rot)             // horizontal projection factor
  const facing = k >= 0

  // contact shadow, so the disc reads as standing rather than floating
  ctx.beginPath()
  ctx.ellipse(cx, cy + R * 0.94, R * 0.78, R * 0.13, 0, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(0,0,0,0.35)'
  ctx.fill()

  // case. Never narrower than a hairline, so the silhouette survives edge-on.
  const rxCase = Math.max(Math.abs(k) * R, 0.75)
  ctx.beginPath()
  ctx.ellipse(cx, cy, rxCase, R, 0, 0, Math.PI * 2)
  ctx.fillStyle = '#232c40'
  ctx.fill()

  if (!facing) {
    // Back of the case: rim highlight only.
    ctx.beginPath()
    ctx.ellipse(cx, cy, rxCase, R, 0, 0, Math.PI * 2)
    ctx.strokeStyle = 'rgba(255,255,255,0.16)'
    ctx.lineWidth = 2 * dpr
    ctx.stroke()
  } else {
    const rxFace = Math.max(Math.abs(k) * R * 0.86, 0.6)
    const ryFace = R * 0.86

    const face = ctx.createLinearGradient(cx - rxFace, cy - ryFace, cx + rxFace, cy + ryFace)
    face.addColorStop(0, '#f4f6f3')
    face.addColorStop(1, '#d5dad3')
    ctx.beginPath()
    ctx.ellipse(cx, cy, rxFace, ryFace, 0, 0, Math.PI * 2)
    ctx.fillStyle = face
    ctx.fill()

    // Twelve hour ticks, each projected through the current rotation.
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2
      const u = Math.sin(a)
      const v = Math.cos(a)
      const major = i % 3 === 0
      const r1 = ryFace * (major ? 0.66 : 0.75)
      const r2 = ryFace * 0.86
      ctx.beginPath()
      ctx.moveTo(cx + u * r1 * k, cy - v * r1)
      ctx.lineTo(cx + u * r2 * k, cy - v * r2)
      ctx.strokeStyle = major ? '#1d2330' : '#6b7486'
      ctx.lineWidth = (major ? 3 : 1.6) * dpr
      ctx.stroke()
    }

    // Hands show the real time, so the spin is unmistakably a clock.
    const now = new Date()
    const hours = (now.getHours() % 12) + now.getMinutes() / 60
    const minutes = now.getMinutes() + now.getSeconds() / 60
    strokeHand(ctx, cx, cy, k, hours * 30, ryFace * 0.48, 4 * dpr, '#1d2330')
    strokeHand(ctx, cx, cy, k, minutes * 6, ryFace * 0.72, 2.6 * dpr, '#1d2330')

    ctx.beginPath()
    ctx.ellipse(cx, cy, Math.max(2.4 * dpr * Math.abs(k), 1.2 * dpr), 1.8 * dpr, 0, 0, Math.PI * 2)
    ctx.fillStyle = '#0f1420'
    ctx.fill()
  }

  label(ctx, W, H, 'PREVIEW 360°')
}

/** A single hand, drawn through the same projection as the dial. */
function strokeHand(ctx, cx, cy, k, degrees, length, width, color) {
  const a = (degrees / 180) * Math.PI
  const u = Math.sin(a)
  const v = Math.cos(a)
  ctx.beginPath()
  ctx.moveTo(cx, cy)
  ctx.lineTo(cx + u * length * k, cy - v * length)
  ctx.strokeStyle = color
  ctx.lineWidth = width
  ctx.lineCap = 'round'
  ctx.stroke()
}

/** The generic abstract turntable, used by every product without its own preview. */
export function drawTurntable(ctx, W, H, t, { dpr = 1, hueA = 205, hueB = 165 } = {}) {
  ctx.clearRect(0, 0, W, H)

  const bg = ctx.createLinearGradient(0, 0, 0, H)
  bg.addColorStop(0, `hsl(${hueA} 30% 16%)`)
  bg.addColorStop(1, `hsl(${hueB} 35% 9%)`)
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)

  const cx = W / 2, cy = H / 2, R = Math.min(W, H) * 0.28

  // rotating "product" sphere
  const wob = Math.sin(t * 1.6) * 0.12
  for (let i = 8; i >= 0; i--) {
    const f = i / 8
    const x = cx + Math.sin(t * 1.3 + f * 2.4) * R * 0.18
    const y = cy + Math.cos(t * 1.1 + f * 2.0) * R * 0.12
    const r = R * (0.55 + 0.5 * f) * (1 + wob * 0.3)
    const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.4, r * 0.1, x, y, r)
    g.addColorStop(0, `hsl(${hueA + f * 40} 70% ${62 - f * 22}%)`)
    g.addColorStop(1, `hsl(${hueB + f * 30} 55% ${26 - f * 10}%)`)
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fillStyle = g
    ctx.fill()
  }

  // orbiting highlights
  for (let i = 0; i < 3; i++) {
    const a = t * (0.9 + i * 0.35) + i * 2.1
    const x = cx + Math.cos(a) * R * 1.35
    const y = cy + Math.sin(a) * R * 0.5
    ctx.beginPath()
    ctx.arc(x, y, 4 * dpr, 0, Math.PI * 2)
    ctx.fillStyle = `hsla(${hueB} 80% 70% / ${0.5 + 0.5 * Math.sin(a * 2)})`
    ctx.fill()
  }

  label(ctx, W, H, 'PREVIEW 360°')
}

function label(ctx, W, H, text) {
  ctx.font = `${Math.round(W * 0.045)}px system-ui, sans-serif`
  ctx.fillStyle = 'rgba(255,255,255,0.55)'
  ctx.textAlign = 'left'
  ctx.fillText(text, W * 0.05, H * 0.92)
}
