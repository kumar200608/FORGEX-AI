// Regression tests for the magnifier.
//
// The reported bug: after starting the video preview, the zoom stopped working.
// Cause: attachZoom captured the <img> element once. The modal swaps that image
// for a <canvas> while the preview runs and mounts a NEW <img> when it stops, so
// the captured element was detached - and a detached node still answers
// getBoundingClientRect(), reporting 0x0. Every pointer position then landed
// "outside" it and the lens never came back, not even after stopping the video.

import { describe, it, expect } from 'vitest'
import { attachZoom } from './zoom.js'

class FakeEl {
  constructor() {
    this.style = {}
    this.className = ''
    this.removed = false
  }
  remove() { this.removed = true }
}

globalThis.document = { createElement: () => new FakeEl() }

function makeContainer() {
  const listeners = {}
  return {
    children: [],
    appendChild(el) { this.children.push(el) },
    addEventListener(type, fn) { (listeners[type] = listeners[type] || []).push(fn) },
    removeEventListener(type, fn) {
      listeners[type] = (listeners[type] || []).filter((f) => f !== fn)
    },
    fire(type, event) { (listeners[type] || []).forEach((fn) => fn(event)) },
    listenerCount(type) { return (listeners[type] || []).length },
  }
}

/** An image laid out at 100,50 400x300. */
function makeLaidOutImage(src = '/assets/products/aurora-lamp-high.jpg') {
  return {
    src,
    currentSrc: src,
    getBoundingClientRect: () => ({ left: 100, top: 50, width: 400, height: 300 }),
  }
}

/** An element that is no longer in the document: it reports a zero-size box. */
function makeDetachedImage() {
  return {
    src: '/assets/products/aurora-lamp-high.jpg',
    currentSrc: '/assets/products/aurora-lamp-high.jpg',
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 0, height: 0 }),
  }
}

const inside = { clientX: 300, clientY: 200 }   // well inside the 400x300 box
const outside = { clientX: 900, clientY: 200 }  // to the right of it

function setup(initial) {
  const container = makeContainer()
  let current = initial
  const detach = attachZoom(container, () => current)
  const lens = container.children[0]
  return { container, lens, detach, setImage: (img) => { current = img } }
}

describe('magnifier lens', () => {
  it('shows the magnified image while the pointer is over it', () => {
    const { container, lens } = setup(makeLaidOutImage())
    container.fire('pointermove', inside)
    expect(lens.style.display).toBe('block')
    expect(lens.style.backgroundImage).toContain('aurora-lamp-high.jpg')
    // 2.2x of a 400x300 image.
    const [w, h] = lens.style.backgroundSize.split(' ')
    expect(Number.parseFloat(w)).toBeCloseTo(880)
    expect(Number.parseFloat(h)).toBeCloseTo(660)
  })

  it('hides when the pointer leaves the image', () => {
    const { container, lens } = setup(makeLaidOutImage())
    container.fire('pointermove', inside)
    container.fire('pointermove', outside)
    expect(lens.style.display).toBe('none')
  })

  it('hides on pointerleave', () => {
    const { container, lens } = setup(makeLaidOutImage())
    container.fire('pointermove', inside)
    container.fire('pointerleave', {})
    expect(lens.style.display).toBe('none')
  })

  // The reported bug, first half.
  it('hides while the video preview is running, because the image is unmounted', () => {
    const { container, lens, setImage } = setup(makeLaidOutImage())
    container.fire('pointermove', inside)
    expect(lens.style.display).toBe('block')

    setImage(null)                       // <img> replaced by the preview <canvas>
    container.fire('pointermove', inside)
    expect(lens.style.display).toBe('none')
  })

  // The reported bug, second half.
  it('hides when the element is detached and reports a zero-size box', () => {
    const { container, lens, setImage } = setup(makeLaidOutImage())
    setImage(makeDetachedImage())
    container.fire('pointermove', inside)
    expect(lens.style.display).toBe('none')
  })

  it('magnifies a replacement image after the preview stops', () => {
    const { container, lens, setImage } = setup(makeLaidOutImage())
    setImage(null)
    container.fire('pointermove', inside)
    expect(lens.style.display).toBe('none')

    // Stopping the preview mounts a fresh <img>; the resolver picks it up.
    setImage(makeLaidOutImage('/assets/products/aurora-lamp-low.jpg'))
    container.fire('pointermove', inside)
    expect(lens.style.display).toBe('block')
    expect(lens.style.backgroundImage).toContain('aurora-lamp-low.jpg')
  })

  it('hides when the element has no resolvable source yet', () => {
    const { container, lens } = setup({ currentSrc: '', src: '', getBoundingClientRect: () => ({ left: 0, top: 0, width: 400, height: 300 }) })
    container.fire('pointermove', inside)
    expect(lens.style.display).toBe('none')
  })

  it('removes the lens and its listeners on detach', () => {
    const { container, lens, detach } = setup(makeLaidOutImage())
    expect(container.listenerCount('pointermove')).toBe(1)
    detach()
    expect(lens.removed).toBe(true)
    expect(container.listenerCount('pointermove')).toBe(0)
    expect(container.listenerCount('pointerleave')).toBe(0)
  })
})
