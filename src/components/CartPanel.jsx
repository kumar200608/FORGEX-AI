import { useEffect, useRef, useState } from 'react'
import { clear, getItems, getTotal, placeOrder, removeItem, subscribe } from '../cart.js'
import { useDialogFocus } from '../hooks/useDialogFocus.js'

const money = (n) => `$${n.toFixed(2)}`

// Checkout lives here rather than on a separate page: the cart is a popover off
// the header badge, which is where the count already is.
export default function CartPanel({ onClose }) {
  const [items, setItems] = useState(getItems)
  const [result, setResult] = useState(null)
  const [busy, setBusy] = useState(false)
  const closeRef = useRef(null)

  useEffect(() => subscribe(() => setItems(getItems())), [])

  // Same focus contract as the product modal: initial focus, Tab contained,
  // Escape closes, focus handed back to the button that opened it.
  const panelRef = useDialogFocus({ onClose, initialRef: closeRef })

  const lines = [...items]
  const total = getTotal()

  const checkout = async () => {
    setBusy(true)
    const outcome = await placeOrder()
    setBusy(false)
    setResult(outcome)
  }

  return (
    <div className="cart-backdrop" onClick={onClose}>
      <aside
        className="cart-panel"
        ref={panelRef}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-title"
        tabIndex={-1}
        data-testid="cart-panel"
      >
        <header className="cart-head">
          <h2 id="cart-title">Your cart</h2>
          <button className="btn ghost" ref={closeRef} onClick={onClose} data-testid="cart-close">
            Close
          </button>
        </header>

        {lines.length === 0 ? (
          <p className="cart-empty">Nothing here yet. Open a product and add it to the cart.</p>
        ) : (
          <ul className="cart-lines" data-testid="cart-lines">
            {lines.map((item) => (
              <li className="cart-line" key={item.id}>
                <span className="cart-line-name">{item.name}</span>
                <span className="cart-line-qty">×{item.qty}</span>
                <span className="cart-line-price">{money(item.price * item.qty)}</span>
                <button
                  type="button"
                  className="cart-line-remove"
                  onClick={() => removeItem(item.id)}
                  aria-label={`Remove ${item.name}`}
                  data-testid={`remove-${item.id}`}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}

        <footer className="cart-foot">
          <p className="cart-total">
            Total <b data-testid="cart-total">{money(total)}</b>
          </p>
          <div className="cart-actions">
            <button
              type="button"
              className="btn primary"
              onClick={checkout}
              disabled={!lines.length || busy}
              data-testid="place-order"
            >
              {busy ? 'Placing order…' : 'Place order'}
            </button>
            <button
              type="button"
              className="btn ghost"
              onClick={() => { clear(); setResult(null) }}
              disabled={!lines.length}
            >
              Clear
            </button>
          </div>

          {result?.ok && result.remote && (
            <p className="cart-note is-ok" role="status" data-testid="cart-result-remote">
              Order <b>{result.orderId}</b> recorded by the API - {money(result.total)}.
            </p>
          )}
          {result?.ok && !result.remote && (
            <p className="cart-note" role="status" data-testid="cart-result-local">
              No API configured, so nothing was recorded. Set <code>VITE_API_URL</code> and run the
              backend to place real orders. The cart is kept.
            </p>
          )}
          {result && !result.ok && (
            <p className="cart-note" role="status" data-testid="cart-result-empty">
              There is nothing to order.
            </p>
          )}
        </footer>
      </aside>
    </div>
  )
}
