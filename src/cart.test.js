import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// The stub has to exist before the module is first evaluated: it reads the
// stored cart at import time.
const store = new Map()
globalThis.sessionStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => { store.set(k, String(v)) },
  removeItem: (k) => { store.delete(k) },
  clear: () => store.clear(),
}

const cart = await import('./cart.js')

const lamp = { id: 'aurora-lamp', name: 'Aurora Lamp', price: 89 }
const mug = { id: 'halo-mug', name: 'Halo Mug', price: 24 }

beforeEach(() => {
  store.clear()
  cart.clear()
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe('cart store', () => {
  it('starts empty', () => {
    expect(cart.getCount()).toBe(0)
    expect(cart.getItems()).toEqual([])
    expect(cart.getTotal()).toBe(0)
  })

  it('adds a product and reports the new total quantity', () => {
    expect(cart.addItem(lamp)).toBe(1)
    expect(cart.getItems()).toHaveLength(1)
    expect(cart.getItems()[0]).toMatchObject({ id: 'aurora-lamp', name: 'Aurora Lamp', price: 89, qty: 1 })
  })

  it('merges a repeat add into the same line instead of stacking duplicates', () => {
    cart.addItem(lamp)
    cart.addItem(lamp)
    cart.addItem(mug)
    expect(cart.getItems()).toHaveLength(2)
    expect(cart.getItems().find((i) => i.id === 'aurora-lamp').qty).toBe(2)
    expect(cart.getCount()).toBe(3)
    expect(cart.getTotal()).toBe(89 * 2 + 24)
  })

  it('caps a line at 99', () => {
    cart.addItem(mug, 99)
    expect(cart.addItem(mug, 5)).toBe(99)
    expect(cart.getItems()[0].qty).toBe(99)
  })

  it('removes a line and ignores an unknown id', () => {
    cart.addItem(lamp)
    cart.addItem(mug)
    expect(cart.removeItem('aurora-lamp')).toBe(1)
    expect(cart.getItems().map((i) => i.id)).toEqual(['halo-mug'])
    expect(cart.removeItem('not-in-cart')).toBe(1)
  })

  it('persists the cart so it survives a reload', () => {
    cart.addItem(lamp, 2)
    expect(JSON.parse(store.get('cart'))).toEqual([
      { id: 'aurora-lamp', name: 'Aurora Lamp', price: 89, qty: 2 },
    ])
  })

  it('notifies subscribers, and stops after unsubscribe', () => {
    const seen = []
    const off = cart.subscribe(() => seen.push(cart.getCount()))
    cart.addItem(lamp)
    cart.addItem(lamp)
    off()
    cart.addItem(mug)
    expect(seen).toEqual([1, 2])
  })

  it('notifies on clear', () => {
    let calls = 0
    cart.subscribe(() => { calls += 1 })
    cart.addItem(lamp)
    cart.clear()
    expect(cart.getCount()).toBe(0)
    expect(calls).toBe(2)
  })

  it('ignores an argument that is not a product', () => {
    expect(cart.addItem(undefined)).toBe(0)
    expect(cart.addItem({ name: 'no id' })).toBe(0)
    expect(cart.getItems()).toEqual([])
  })
})

describe('session id', () => {
  it('is stable within a session and satisfies the server rule', () => {
    const first = cart.getSessionId()
    expect(first).toMatch(/^[A-Za-z0-9_-]{6,128}$/)
    expect(cart.getSessionId()).toBe(first)
  })

  it('is replaced if the stored value is not a valid identifier', () => {
    store.set('cart.session', 'no')
    const fresh = cart.getSessionId()
    expect(fresh).toMatch(/^[A-Za-z0-9_-]{6,128}$/)
    expect(fresh).not.toBe('no')
  })
})

describe('server mirror', () => {
  it('adds nothing to the wire when no API is configured', async () => {
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)
    cart.addItem(lamp)
    await new Promise((r) => setTimeout(r, 0))
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('mirrors an add to POST /api/cart when one is configured', async () => {
    vi.stubEnv('VITE_API_URL', 'http://api.test')
    const calls = []
    vi.stubGlobal('fetch', async (url, init) => {
      calls.push({ url, body: JSON.parse(init.body) })
      return { ok: true, json: async () => ({}) }
    })

    cart.addItem(lamp, 2)
    await new Promise((r) => setTimeout(r, 0))

    expect(calls).toHaveLength(1)
    expect(calls[0].url).toBe('http://api.test/api/cart')
    expect(calls[0].body).toMatchObject({ productId: 'aurora-lamp', qty: 2 })
    expect(calls[0].body.sessionId).toBe(cart.getSessionId())
  })
})

describe('placeOrder', () => {
  it('refuses an empty cart without calling the API', async () => {
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)
    const result = await cart.placeOrder()
    expect(result).toMatchObject({ ok: false, reason: 'empty', remote: false })
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('keeps the cart and says nothing was recorded when no API is configured', async () => {
    cart.addItem(lamp, 2)
    const result = await cart.placeOrder()
    expect(result).toMatchObject({ ok: true, remote: false, lines: 1, total: 178 })
    // A demonstration checkout must not pretend an order exists.
    expect(cart.getCount()).toBe(2)
  })

  it('creates a real order and empties the cart when the API accepts it', async () => {
    vi.stubEnv('VITE_API_URL', 'http://api.test')
    const calls = []
    vi.stubGlobal('fetch', async (url, init) => {
      calls.push({ url, body: JSON.parse(init.body) })
      return { ok: true, json: async () => ({ id: 'order-42', total: 178 }) }
    })

    cart.addItem(lamp, 2)
    await new Promise((r) => setTimeout(r, 0))   // let the add mirror settle
    const result = await cart.placeOrder()

    expect(calls.at(-1).url).toBe('http://api.test/api/orders')
    expect(result).toMatchObject({ ok: true, remote: true, orderId: 'order-42', total: 178 })
    expect(cart.getCount()).toBe(0)
  })

  it('falls back to a local acknowledgement when the API rejects the order', async () => {
    vi.stubEnv('VITE_API_URL', 'http://api.test')
    vi.stubGlobal('fetch', async () => ({ ok: false, status: 400, json: async () => ({}) }))
    cart.addItem(mug)
    const result = await cart.placeOrder()
    expect(result).toMatchObject({ ok: true, remote: false })
    expect(cart.getCount()).toBe(1)
  })
})

describe('cart storage compatibility', () => {
  it('discards a legacy bare-number value instead of crashing on import', async () => {
    // Builds before this module stored a bare number under the same key.
    store.set('cart', '3')
    vi.resetModules()
    const fresh = await import('./cart.js')
    expect(fresh.getItems()).toEqual([])
    expect(fresh.getCount()).toBe(0)
  })

  it('survives unparseable stored data', async () => {
    store.set('cart', '{not json')
    vi.resetModules()
    const fresh = await import('./cart.js')
    expect(fresh.getCount()).toBe(0)
  })
})
