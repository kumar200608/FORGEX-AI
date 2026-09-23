// Optional backend client.
//
// This is deliberately tiny and deliberately fail-silent. The demo must work
// offline and as a static build, so *nothing* here is allowed to break boot:
// no env var, a dead server, a slow server, or a nonsense payload all resolve to
// `null` and the caller keeps working against local state.
//
// Enable it by setting VITE_API_URL at build/dev time (see README -> Backend):
//   VITE_API_URL=http://localhost:4000 npm run dev

const DEFAULT_TIMEOUT_MS = 2500

/** Configured API base, normalised to no trailing slash. `null` when unset. */
export function apiBaseUrl(env = import.meta.env) {
  const raw = env?.VITE_API_URL
  if (typeof raw !== 'string') return null
  const trimmed = raw.trim().replace(/\/+$/, '')
  return trimmed === '' ? null : trimmed
}

/**
 * Minimal shape check - enough to know we can render these cards.
 * A payload that fails this is treated exactly like a network failure.
 */
function isUsableProduct(value) {
  return (
    value !== null &&
    typeof value === 'object' &&
    typeof value.id === 'string' &&
    value.id !== '' &&
    typeof value.name === 'string' &&
    typeof value.price === 'number' &&
    Number.isFinite(value.price)
  )
}

function resolveFetch(fetchImpl) {
  return fetchImpl || (typeof fetch === 'function' ? fetch : null)
}

/**
 * GET `${VITE_API_URL}/api/products`.
 *
 * Resolves to an array of products, or `null` for every failure mode:
 * no VITE_API_URL, network error, non-2xx, timeout, or a payload that does not
 * look like the catalogue. `null` means "use what you already have".
 */
export async function fetchProducts({ timeoutMs = DEFAULT_TIMEOUT_MS, fetchImpl } = {}) {
  const base = apiBaseUrl()
  if (!base) return null

  const doFetch = resolveFetch(fetchImpl)
  if (!doFetch) return null

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const res = await doFetch(`${base}/api/products`, {
      headers: { accept: 'application/json' },
      signal: controller.signal,
    })
    if (!res.ok) return null

    const body = await res.json()
    // Accept either `{ products: [...] }` or a bare array, so the client is not
    // coupled to one response envelope.
    const list = Array.isArray(body) ? body : body?.products
    if (!Array.isArray(list) || list.length === 0) return null

    const usable = list.filter(isUsableProduct)
    return usable.length === list.length ? usable : null
  } catch {
    // Aborts, DNS failures, CORS rejections, malformed JSON - all the same here.
    return null
  } finally {
    clearTimeout(timer)
  }
}

/**
 * POST JSON to the API. Same contract as `fetchProducts`: resolves to the parsed
 * body, or `null` for every failure mode. It never rejects, so callers can treat
 * it as fire-and-forget.
 */
async function postJson(path, body, { timeoutMs = DEFAULT_TIMEOUT_MS, fetchImpl } = {}) {
  const base = apiBaseUrl()
  if (!base) return null

  const doFetch = resolveFetch(fetchImpl)
  if (!doFetch) return null

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const res = await doFetch(`${base}${path}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

/** POST /api/cart - add `qty` of a product to the session's cart. */
export function postCartItem({ sessionId, productId, qty = 1 }, options) {
  return postJson('/api/cart', { sessionId, productId, qty }, options)
}

/** POST /api/orders - turn the session's stored cart into an order. */
export function postOrder({ sessionId }, options) {
  return postJson('/api/orders', { sessionId }, options)
}
