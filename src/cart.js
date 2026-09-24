// One cart, one storage key, one subscription.
//
// The header badge and the product modal used to keep separate counters: the
// modal incremented a React state that nothing rendered, while the header
// counted its own clicks straight into sessionStorage under a bare-number key.
// Adding from the modal therefore changed nothing visible anywhere.
//
// Both surfaces now read and write this module, so an add is immediately
// reflected in the header badge and survives a reload.
//
// The local cart is the source of truth for the UI. When VITE_API_URL is set the
// same writes are mirrored to the backend (POST /api/cart, POST /api/orders) so
// the server-side cart and orders are actually exercised rather than dead code -
// but the mirror is fire-and-forget, so a missing or slow API can never change
// what the shopper sees, and the app still works with no backend at all.

import { postCartItem, postOrder } from './adaptive/api.js'

const KEY = 'cart'
const SESSION_KEY = 'cart.session'
const MAX_QTY = 99
const SESSION_ID_RE = /^[A-Za-z0-9_-]{6,128}$/   // must satisfy the server's rule

const listeners = new Set()
let memorySessionId = null

function storage() {
  try {
    // Absent in tests and in any non-browser context.
    return typeof sessionStorage === 'undefined' ? null : sessionStorage
  } catch {
    return null   // some browsers throw when storage is blocked
  }
}

function looksLikeItem(value) {
  return (
    value &&
    typeof value === 'object' &&
    typeof value.id === 'string' &&
    typeof value.price === 'number' &&
    Number.isInteger(value.qty) &&
    value.qty > 0
  )
}

function read() {
  const store = storage()
  if (!store) return []
  try {
    const raw = store.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    // Builds before this module stored a bare number under the same key.
    if (!Array.isArray(parsed)) return []
    return parsed.filter(looksLikeItem)
  } catch {
    return []
  }
}

let items = read()

function commit() {
  const store = storage()
  if (store) {
    try {
      store.setItem(KEY, JSON.stringify(items))
    } catch {
      /* quota or blocked storage: keep the in-memory cart usable */
    }
  }
  for (const fn of listeners) fn(items)
}

/** Stable per-session identifier the backend keys carts and orders by. */
export function getSessionId() {
  const store = storage()
  if (!store) {
    if (!memorySessionId) memorySessionId = makeSessionId()
    return memorySessionId
  }
  try {
    const existing = store.getItem(SESSION_KEY)
    if (typeof existing === 'string' && SESSION_ID_RE.test(existing)) return existing
    const fresh = makeSessionId()
    store.setItem(SESSION_KEY, fresh)
    return fresh
  } catch {
    if (!memorySessionId) memorySessionId = makeSessionId()
    return memorySessionId
  }
}

function makeSessionId() {
  return `s-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

/** The cart lines. Do not mutate the returned array. */
export function getItems() {
  return items
}

/** Total quantity, which is what the header badge shows. */
export function getCount() {
  return items.reduce((total, item) => total + item.qty, 0)
}

/** Cart value. Prices are the catalogue prices captured when the line was added. */
export function getTotal() {
  return items.reduce((total, item) => total + item.price * item.qty, 0)
}

/** Add `qty` of a product, merging into an existing line. Returns the new count. */
export function addItem(product, qty = 1) {
  if (!product || typeof product.id !== 'string') return getCount()

  const existing = items.find((item) => item.id === product.id)
  if (existing) {
    existing.qty = Math.min(existing.qty + qty, MAX_QTY)
    items = [...items]
  } else {
    items = [
      ...items,
      { id: product.id, name: product.name, price: product.price, qty: Math.min(qty, MAX_QTY) },
    ]
  }
  commit()

  // Mirror to the backend when one is configured. Deliberately not awaited: the
  // UI has already updated, and a failed mirror must not surface as an error.
  // `postCartItem` resolves to null on every failure, so nothing is left hanging.
  void postCartItem({ sessionId: getSessionId(), productId: product.id, qty })

  return getCount()
}

/** Remove a line entirely. Returns the new count. */
export function removeItem(productId) {
  const next = items.filter((item) => item.id !== productId)
  if (next.length === items.length) return getCount()
  items = next
  commit()
  return getCount()
}

/** Empty the cart (used by the demo reset). */
export function clear() {
  items = []
  commit()
  return 0
}

/**
 * Checkout.
 *
 * With a backend configured this creates a real order (`POST /api/orders`) and
 * empties the cart on success. With no backend it is a demonstration checkout:
 * it reports what it would have ordered and keeps the cart, rather than
 * pretending an order was recorded somewhere.
 */
export async function placeOrder() {
  if (!items.length) return { ok: false, reason: 'empty', remote: false, lines: 0, total: 0 }

  const lines = items.length
  const total = getTotal()
  const order = await postOrder({ sessionId: getSessionId() })

  if (order && typeof order.id === 'string') {
    items = []
    commit()
    return { ok: true, remote: true, orderId: order.id, total: order.total ?? total, lines }
  }

  return { ok: true, remote: false, total, lines }
}

/** Subscribe to changes. Returns an unsubscribe function. */
export function subscribe(fn) {
  listeners.add(fn)
  return () => { listeners.delete(fn) }
}
