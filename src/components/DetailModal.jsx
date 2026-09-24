import { useEffect, useRef, useState } from 'react'
import { productImageSet } from '../data/products.js'
import { useAdaptive } from '../adaptive/AdaptiveProvider.jsx'
import { logEvent } from '../adaptive/log.js'
import { useDialogFocus } from '../hooks/useDialogFocus.js'

export default function DetailModal({ product, onClose, onAddToCart }) {
  const { budget } = useAdaptive()
  const [videoOn, setVideoOn] = useState(false)
  const [addedCount, setAddedCount] = useState(0)
  const videoStop = useRef(null)
  const zoomDetach = useRef(null)
  const mediaRef = useRef(null)
  const imgRef = useRef(null)
  const canvasRef = useRef(null)
  const closeRef = useRef(null)
  const imageSet = productImageSet(product.id, budget.imageTier)

  // 'clock360' rotates the clock itself; everything else gets the generic spin.
  const previewKind = product.preview === 'clock360' ? 'clock360' : 'turntable'
  const previewLabel = previewKind === 'clock360' ? '360° preview' : 'Video preview'

  // Initial focus on Close, Tab kept inside the dialog, Escape to dismiss,
  // and focus handed back to the card that opened it.
  const dialogRef = useDialogFocus({ onClose, initialRef: closeRef })

  // Dynamic imports - this is the adaptive JavaScript lever. The video module
  // and zoom module only travel over the wire when the budget allows them.
  const startVideo = async () => {
    if (videoOn) { stopVideo(); return }
    logEvent('chunk', `feature gate open: ${previewLabel} - importing heavy-video chunk…`, budget.jsLevel)
    try {
      const t0 = performance.now()
      const mod = await import('../heavy/video.js')
      logEvent('chunk', `heavy-video loaded in ${Math.round(performance.now() - t0)} ms - starting ${previewKind} preview`)
      setVideoOn(true)
      requestAnimationFrame(() => {
        if (canvasRef.current) videoStop.current = mod.startVideoPreview(canvasRef.current, { kind: previewKind })
      })
    } catch (e) {
      logEvent('chunk', `heavy-video failed to load: ${e}`)
    }
  }
  const stopVideo = () => {
    if (videoStop.current) { videoStop.current(); videoStop.current = null }
    setVideoOn(false)
  }

  useEffect(() => {
    if (!budget.zoom) return
    let cancelled = false
    logEvent('chunk', 'feature gate open: product zoom - importing heavy-zoom chunk…', budget.jsLevel)
    import('../heavy/zoom.js').then((mod) => {
      if (cancelled || !mediaRef.current) return
      // Resolved per pointer event, not captured: the media element below is
      // swapped for a canvas during the preview and replaced when it stops.
      zoomDetach.current = mod.attachZoom(mediaRef.current, () => imgRef.current)
      logEvent('chunk', 'heavy-zoom loaded - magnifier attached')
    }).catch(() => {})
    return () => { cancelled = true; if (zoomDetach.current) zoomDetach.current() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [budget.zoom])

  useEffect(() => () => { if (videoStop.current) videoStop.current() }, [])

  // Confirmation is shown in the dialog: the header badge is behind the
  // backdrop while this is open, so the add would otherwise look like nothing.
  useEffect(() => {
    if (!addedCount) return
    const id = setTimeout(() => setAddedCount(0), 2200)
    return () => clearTimeout(id)
  }, [addedCount])

  const handleAddToCart = () => {
    const count = onAddToCart(product)
    setAddedCount(typeof count === 'number' ? count : 1)
  }

  return (
    <div className="modal-backdrop" onClick={onClose} data-testid="detail-modal">
      <div
        className="modal"
        ref={dialogRef}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="detail-title"
        aria-describedby="detail-desc"
        tabIndex={-1}
      >
        <button className="modal-close" ref={closeRef} onClick={onClose} aria-label="Close">×</button>
        <div className={`modal-media ${videoOn ? 'video-on' : ''}`} ref={mediaRef}>
          {videoOn
            ? <canvas ref={canvasRef} className="preview-canvas" data-testid="video-preview" />
            : (
              <picture>
                <source type="image/avif" srcSet={imageSet.avif} />
                <source type="image/webp" srcSet={imageSet.webp} />
                <img ref={imgRef} src={imageSet.jpg} alt={product.name} width="640" height="480" decoding="async" />
              </picture>
            )}
        </div>
        <div className="modal-info">
          <p className="modal-category">{product.category}</p>
          <h2 id="detail-title">{product.name}</h2>
          <p className="price price-lg">${product.price}</p>
          <p className="desc" id="detail-desc">{product.desc}</p>

          <div className="modal-delivery">
            delivered at <b>{budget.imageTier}</b> quality
            {budget.zoom ? ' · zoom enabled' : ' · zoom off (budget)'}
            {budget.videoPreview ? ' · video preview available' : ' · video preview off (budget)'}
          </div>

          <div className="modal-actions">
            <button className="btn primary" onClick={handleAddToCart} data-testid="add-to-cart">Add to cart</button>
            {budget.videoPreview
              ? <button className="btn secondary" onClick={startVideo} data-testid="video-toggle">{videoOn ? 'Stop preview' : previewLabel}</button>
              : (
                <button className="btn disabled" disabled title="Disabled by your delivery budget (heavy feature)">
                  {previewLabel}
                  <svg className="icon" viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <rect x="3.2" y="7" width="9.6" height="6.2" rx="1.4" />
                    <path d="M5.6 7V5.2a2.4 2.4 0 0 1 4.8 0V7" />
                  </svg>
                </button>
              )}
          </div>

          {addedCount > 0 && (
            <p className="cart-note" role="status" data-testid="cart-note">
              Added to cart · <b>{addedCount}</b> {addedCount === 1 ? 'item' : 'items'} in your cart
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
