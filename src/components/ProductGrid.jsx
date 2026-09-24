import { memo, useEffect, useRef, useState } from 'react'
import { PRODUCTS, productImage, productImageSet, bestImageFormat } from '../data/products.js'
import { useAdaptive } from '../adaptive/AdaptiveProvider.jsx'
import { prefetchImage } from '../adaptive/prefetch.js'
import { logEvent } from '../adaptive/log.js'
import { fetchProducts } from '../adaptive/api.js'

// How many cards are above the fold on a typical desktop viewport. These are
// the only ones a FULL delivery loads eagerly; the rest stay lazy so "prefetch
// everything" does not turn into "block the LCP image on eight photographs".
const EAGER_CARDS = 4

function Card({ product, onOpen, onAdd, index }) {
  const { budget, mode } = useAdaptive()

  // Hover = intent. LIGHT prefetches on intent only; DATA SAVER never.
  const onHover = () => {
    if (budget.prefetch === 'hover') {
      const url = productImage(product.id, budget.imageTier, bestImageFormat())
      prefetchImage(url, budget, logEvent)
    }
  }

  const tier = budget.imageTier
  const set = productImageSet(product.id, tier)
  const open = () => onOpen(product)

  return (
    <article
      className={`product-card anim-${budget.animations}`}
      onMouseEnter={onHover}
      data-testid={`card-${product.id}`}
    >
      <div className="card-media">
        {/* The browser picks the first format it understands, so nothing
            downloads twice and no JavaScript has to decide. */}
        <picture>
          <source type="image/avif" srcSet={set.avif} />
          <source type="image/webp" srcSet={set.webp} />
          <img
            key={tier}
            src={set.jpg}
            alt={product.name}
            width="320"
            height="240"
            loading={budget.prefetch === 'all' && index < EAGER_CARDS ? 'eager' : 'lazy'}
            decoding="async"
            onError={(e) => { e.currentTarget.closest('.card-media').classList.add('media-missing') }}
          />
        </picture>
        {tier !== 'high' && (
          <span className={`tier-tag tier-${tier}`}>
            <span className="tier-dot" aria-hidden="true" />
            {tier}
          </span>
        )}
        <button
          type="button"
          className="card-open"
          onClick={open}
          aria-label={`View ${product.name}`}
        />
      </div>
      <div className="card-body">
        <div className="card-title-row">
          <h3>
            <button type="button" className="card-title-btn" onClick={open}>{product.name}</button>
          </h3>
          <span className="price">${product.price}</span>
        </div>
        <p className="tagline">{product.tagline}</p>
        <div className="card-actions">
          <button
            type="button"
            className="card-add"
            onClick={() => onAdd(product)}
            data-testid={`add-${product.id}`}
          >
            Add to cart
          </button>
        </div>
      </div>
    </article>
  )
}

const MemoCard = memo(Card)

export default function ProductGrid({ onOpen, onAdd }) {
  const { budget, mode } = useAdaptive()
  const gridRef = useRef(null)

  // The bundled catalogue renders immediately and is the permanent fallback.
  // The API is strictly optional: if VITE_API_URL is unset, the server is down,
  // or the payload is unusable, `fetchProducts` resolves to null, this never
  // re-renders, and the static list stays. No spinner, no error UI, no flash —
  // and nothing about the adaptive engine changes either way.
  const [products, setProducts] = useState(PRODUCTS)
  useEffect(() => {
    let cancelled = false
    fetchProducts().then((remote) => {
      if (!cancelled && remote) setProducts(remote)
    })
    return () => { cancelled = true }
  }, [])

  // Adaptive JavaScript in action: the entrance animation is powered by the
  // heavy-motion chunk, which the engine only ships on FULL delivery.
  useEffect(() => {
    if (budget.animations !== 'rich' || !gridRef.current) return
    let cancelled = false
    import('../heavy/motion.js').then((mod) => {
      if (!cancelled && gridRef.current) mod.staggerIn(gridRef.current.children)
    }).catch(() => {})
    return () => { cancelled = true }
  }, [budget.animations])

  return (
    <section className="catalog" aria-label="Catalogue">
      <div className="catalog-head">
        <h2>Catalogue</h2>
        <p>Same shop, every user — only the payload changes.</p>
      </div>
      <div className={`product-grid grid-${mode.replace(/\s+/g, '-').toLowerCase()}`} data-testid="product-grid" ref={gridRef}>
        {products.map((p, i) => (
          <MemoCard key={p.id} product={p} index={i} onOpen={onOpen} onAdd={onAdd} />
        ))}
      </div>
    </section>
  )
}
