import { describe, it, expect } from 'vitest'
import { IMAGE_FORMATS, productImage, productImageSet } from './products.js'

describe('product image URLs', () => {
  it('defaults to the universal fallback format', () => {
    expect(productImage('aurora-lamp', 'mid')).toBe('/assets/products/aurora-lamp-mid.jpg')
  })

  it('takes an explicit format', () => {
    expect(productImage('aurora-lamp', 'high', 'avif')).toBe('/assets/products/aurora-lamp-high.avif')
    expect(productImage('halo-mug', 'low', 'webp')).toBe('/assets/products/halo-mug-low.webp')
  })

  it('lists the formats best-first, which is the order <picture> offers them', () => {
    expect(IMAGE_FORMATS).toEqual(['avif', 'webp', 'jpg'])
  })

  it('gives a <picture> element one URL per format for a tier', () => {
    expect(productImageSet('orbit-clock', 'mid')).toEqual({
      avif: '/assets/products/orbit-clock-mid.avif',
      webp: '/assets/products/orbit-clock-mid.webp',
      jpg: '/assets/products/orbit-clock-mid.jpg',
    })
  })

  it('builds every URL for every product and tier', () => {
    for (const id of ['aurora-lamp', 'zenith-bottle']) {
      for (const tier of ['low', 'mid', 'high']) {
        const set = productImageSet(id, tier)
        for (const format of IMAGE_FORMATS) {
          expect(set[format]).toMatch(new RegExp(`^/assets/products/${id}-${tier}\\.${format}$`))
        }
      }
    }
  })
})
