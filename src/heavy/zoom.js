// HEAVY MODULE - zoom.js (chunk: heavy-zoom)
// Magnifier lens for the product image. Pointer-event driven layout thrash is
// exactly the kind of cost a low-end device doesn't need, so it ships only on
// FULL delivery.
//
// The image is RESOLVED per pointer event instead of captured once. The modal
// swaps the <img> out for a <canvas> while the video preview runs, and mounts a
// fresh <img> when it stops. A captured element goes stale on the first swap -
// a detached node still answers getBoundingClientRect() but reports 0x0, so
// every pointer position lands "outside" it and the magnifier never returns.

export function attachZoom(container, imageSource) {
  const lens = document.createElement('div')
  lens.className = 'zoom-lens'
  container.appendChild(lens)

  const ZOOM = 2.2

  function hide() { lens.style.display = 'none' }

  /** The element to magnify right now, or null when there is nothing to magnify. */
  function currentImage() {
    const el = typeof imageSource === 'function' ? imageSource() : imageSource
    if (!el) return null
    const src = el.currentSrc || el.src
    if (!src) return null
    return el
  }

  function move(e) {
    const img = currentImage()
    if (!img) { hide(); return }

    const rect = img.getBoundingClientRect()
    // Detached (or not yet laid out) elements report a zero box: nothing to zoom.
    if (!rect.width || !rect.height) { hide(); return }

    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    if (x < 0 || y < 0 || x > rect.width || y > rect.height) { hide(); return }

    const size = rect.width * 0.38
    lens.style.display = 'block'
    lens.style.width = `${size}px`
    lens.style.height = `${size}px`
    lens.style.left = `${x - size / 2}px`
    lens.style.top = `${y - size / 2}px`
    lens.style.backgroundImage = `url("${img.currentSrc || img.src}")`
    lens.style.backgroundSize = `${rect.width * ZOOM}px ${rect.height * ZOOM}px`
    lens.style.backgroundPosition = `${-(x * ZOOM - size / 2)}px ${-(y * ZOOM - size / 2)}px`
  }

  container.addEventListener('pointermove', move)
  container.addEventListener('pointerleave', hide)

  return function detach() {
    container.removeEventListener('pointermove', move)
    container.removeEventListener('pointerleave', hide)
    lens.remove()
  }
}
