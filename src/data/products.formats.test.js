// @vitest-environment jsdom
//
// bestImageFormat is the one piece of format detection in the app, and it decides
// which file the prefetcher warms - so a wrong answer there wastes real bytes.

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

const createElement = document.createElement.bind(document)

function stubCanvas({ avif }) {
  vi.spyOn(document, 'createElement').mockImplementation((tag) => {
    if (tag === 'canvas') {
      return {
        width: 0,
        height: 0,
        toDataURL: (type) =>
          avif && type === 'image/avif' ? 'data:image/avif;base64,AAAA' : 'data:image/png;base64,AAAA',
      }
    }
    return createElement(tag)
  })
}

beforeEach(() => {
  vi.resetModules()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('bestImageFormat', () => {
  it('picks avif when the browser can encode it', async () => {
    stubCanvas({ avif: true })
    const { bestImageFormat } = await import('./products.js')
    expect(bestImageFormat()).toBe('avif')
  })

  it('falls back to webp when avif is not available', async () => {
    stubCanvas({ avif: false })
    const { bestImageFormat } = await import('./products.js')
    expect(bestImageFormat()).toBe('webp')
  })

  it('answers the same thing every time after the first probe', async () => {
    stubCanvas({ avif: true })
    const { bestImageFormat } = await import('./products.js')
    expect(bestImageFormat()).toBe('avif')
    vi.restoreAllMocks()
    // The probe must not run again, even now that the canvas would say no.
    stubCanvas({ avif: false })
    expect(bestImageFormat()).toBe('avif')
  })

  it('degrades to the universal fallback when the browser refuses the probe', async () => {
    vi.spyOn(document, 'createElement').mockImplementation((tag) => {
      if (tag === 'canvas') {
        return { width: 0, height: 0, toDataURL: () => { throw new Error('canvas is disabled') } }
      }
      return createElement(tag)
    })
    const { bestImageFormat } = await import('./products.js')
    expect(bestImageFormat()).toBe('jpg')
  })
})
