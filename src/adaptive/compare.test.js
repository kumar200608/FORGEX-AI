import { describe, it, expect } from 'vitest'
import { compareDeliveries, formatSize } from './compare.js'

const snapshot = (over = {}) => ({
  transferKB: 1400,
  requests: 31,
  imageKB: 600,
  jsKB: 180,
  imageBaselineKB: 1200,
  jsBaselineKB: 190,
  jsChunks: 4,
  jsChunksBaseline: 7,
  ...over,
})

describe('compareDeliveries', () => {
  it('swaps only the adaptive bytes, carrying the fixed cost across', () => {
    const c = compareDeliveries(snapshot())
    // Everything that does not adapt: 1400 - (600 + 180) = 620 KB
    expect(c.breakdown.fixedKB).toBe(620)
    expect(c.normal.kb).toBe(620 + 1200 + 190)
    expect(c.adaptive.kb).toBe(1400)
    expect(c.savedKB).toBe(2010 - 1400)
    expect(c.savedPct).toBeCloseTo(610 / 2010, 6)
  })

  it('counts the chunks a non-adaptive delivery would also have fetched', () => {
    const c = compareDeliveries(snapshot())
    expect(c.normal.requests).toBe(31 + 3)          // 7 baseline chunks - 4 loaded
    expect(c.adaptive.requests).toBe(31)
  })

  it('reports no saving when the two sides are identical', () => {
    const c = compareDeliveries(snapshot({
      imageKB: 1200, imageBaselineKB: 1200, jsKB: 190, jsBaselineKB: 190,
      jsChunks: 7, jsChunksBaseline: 7,
    }))
    expect(c.savedKB).toBe(0)
    expect(c.savedPct).toBe(0)
  })

  it('never reports a negative saving if the adaptive side is somehow heavier', () => {
    // Adaptive loaded *more* image bytes than the high-tier baseline would have
    // (e.g. the shopper browsed several products), so the saving would be negative.
    const c = compareDeliveries(snapshot({
      transferKB: 1800, imageKB: 1500, imageBaselineKB: 1200, jsKB: 300, jsBaselineKB: 190,
    }))
    expect(c.normal.kb).toBe(1390)
    expect(c.adaptive.kb).toBe(1800)
    expect(c.savedKB).toBe(0)
    expect(c.savedPct).toBe(0)
  })

  it('scales the measured per-session saving to 1,000 visitors', () => {
    const c = compareDeliveries(snapshot())
    expect(c.savedPer1000VisitorsGB).toBeCloseTo((610 * 1000) / (1024 * 1024), 6)
  })

  it('treats missing or nonsense fields as zero rather than NaN', () => {
    const c = compareDeliveries({ transferKB: 100 })
    expect(c.normal.kb).toBe(100)
    expect(Number.isNaN(c.savedPct)).toBe(false)
    expect(c.savedPct).toBe(0)

    const empty = compareDeliveries()
    expect(empty.normal.kb).toBe(0)
    expect(empty.savedPct).toBeNull()

    const junk = compareDeliveries({ transferKB: 'lots', imageKB: NaN, jsChunks: undefined })
    expect(Number.isNaN(junk.normal.kb)).toBe(false)
  })
})

describe('formatSize', () => {
  it('shows kilobytes below a megabyte and megabytes above', () => {
    expect(formatSize(0)).toBe('0 KB')
    expect(formatSize(610)).toBe('610 KB')
    expect(formatSize(1024)).toBe('1.00 MB')
    expect(formatSize(2048)).toBe('2.00 MB')
  })
})
