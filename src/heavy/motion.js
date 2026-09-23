// HEAVY MODULE - motion.js (chunk: heavy-motion)
// The staggered entrance for card grids, and the dashboard's metric tiles.
//
// It is its own chunk because it is only worth its bytes on a FULL delivery:
// on LIGHT and DATA SAVER the UI renders without it and the cards simply appear.
// (This module used to also carry a spring-physics engine and a count-up helper
// that nothing called, so both were removed rather than shipped to every visitor
// who never triggered them.)

export function staggerIn(elements, { step = 45, y = 14 } = {}) {
  const els = Array.from(elements || [])
  els.forEach((el, i) => {
    el.style.opacity = '0'
    el.style.transform = `translateY(${y}px)`
    setTimeout(() => {
      el.style.transition = 'opacity 420ms ease, transform 420ms cubic-bezier(.22,1,.36,1)'
      el.style.opacity = '1'
      el.style.transform = 'translateY(0)'
    }, 60 + i * step)
  })
}
