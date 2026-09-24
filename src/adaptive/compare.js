// Normal vs Adaptive, from measured numbers only.
//
// Nothing here is estimated or extrapolated from a claim. The adaptive side is
// what this session actually transferred (Resource Timing). The normal side is
// the same session with the adaptive parts swapped out for what a non-adaptive
// delivery would have sent: the high-tier images and the full chunk set, whose
// sizes are measured at build time and published in the two manifests.
//
// Everything that does not adapt - the document, CSS, fonts, the app shell - is
// identical on both sides, so it is carried across unchanged rather than guessed.

const num = (value) => (Number.isFinite(value) && value > 0 ? value : 0)

/**
 * @param {object} m a metrics snapshot
 * @returns {{adaptive:{kb:number,requests:number}, normal:{kb:number,requests:number},
 *            savedKB:number, savedPct:number|null, savedPer1000VisitorsGB:number}}
 */
export function compareDeliveries(m = {}) {
  const transferKB = num(m.transferKB)
  const requests = num(m.requests)

  const imageKB = num(m.imageKB)
  const jsKB = num(m.jsKB)
  const imageBaselineKB = num(m.imageBaselineKB)
  const jsBaselineKB = num(m.jsBaselineKB)

  // Everything the adaptation does not touch.
  const fixedKB = Math.max(transferKB - (imageKB + jsKB), 0)
  const normalKB = fixedKB + imageBaselineKB + jsBaselineKB

  // A non-adaptive delivery sends the same images, just heavier ones, so the
  // request count only differs by the chunks that were skipped.
  const skippedChunks = Math.max(num(m.jsChunksBaseline) - num(m.jsChunks), 0)
  const normalRequests = requests + skippedChunks

  const savedKB = Math.max(normalKB - transferKB, 0)
  const savedPct = normalKB > 0 ? savedKB / normalKB : null

  return {
    adaptive: { kb: transferKB, requests },
    normal: { kb: normalKB, requests: normalRequests },
    savedKB,
    savedPct,
    // "1,000 visitors" is arithmetic on a measured per-session saving, not a
    // projection: GB = kB * 1000 / (1024 * 1024).
    savedPer1000VisitorsGB: (savedKB * 1000) / (1024 * 1024),
    breakdown: {
      imageKB,
      imageBaselineKB,
      jsKB,
      jsBaselineKB,
      fixedKB,
    },
  }
}

/** Human-readable size from kilobytes. Kept here so the formatting is testable. */
export function formatSize(kb) {
  const value = num(kb)
  if (value >= 1024) return `${(value / 1024).toFixed(2)} MB`
  return `${Math.round(value)} KB`
}
