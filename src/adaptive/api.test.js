import { describe, it, expect, afterEach, vi } from 'vitest'
import { apiBaseUrl, postCartItem, postOrder } from './api.js'

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('apiBaseUrl', () => {
  it('is null when the variable is unset', () => {
    expect(apiBaseUrl({})).toBeNull()
    expect(apiBaseUrl(undefined)).toBeNull()
  })

  it('drops a trailing slash and treats blank as unset', () => {
    expect(apiBaseUrl({ VITE_API_URL: 'http://api.test/' })).toBe('http://api.test')
    expect(apiBaseUrl({ VITE_API_URL: '   ' })).toBeNull()
    expect(apiBaseUrl({ VITE_API_URL: 42 })).toBeNull()
  })
})

describe('cart and order writes', () => {
  it('resolve to null when no API is configured, without touching fetch', async () => {
    const fetchImpl = vi.fn()
    expect(await postCartItem({ sessionId: 's-1', productId: 'aurora-lamp' }, { fetchImpl })).toBeNull()
    expect(await postOrder({ sessionId: 's-1' }, { fetchImpl })).toBeNull()
    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it('POST the cart payload to /api/cart', async () => {
    vi.stubEnv('VITE_API_URL', 'http://api.test')
    const calls = []
    const fetchImpl = async (url, init) => {
      calls.push({ url, init })
      return { ok: true, json: async () => ({ sessionId: 's-1', items: [] }) }
    }

    const body = await postCartItem(
      { sessionId: 's-1', productId: 'aurora-lamp', qty: 2 },
      { fetchImpl },
    )

    expect(calls[0].url).toBe('http://api.test/api/cart')
    expect(calls[0].init.method).toBe('POST')
    expect(JSON.parse(calls[0].init.body)).toEqual({
      sessionId: 's-1',
      productId: 'aurora-lamp',
      qty: 2,
    })
    expect(body).toEqual({ sessionId: 's-1', items: [] })
  })

  it('POST the order payload to /api/orders', async () => {
    vi.stubEnv('VITE_API_URL', 'http://api.test')
    const calls = []
    const fetchImpl = async (url, init) => {
      calls.push({ url, init })
      return { ok: true, json: async () => ({ id: 'order-1', total: 128 }) }
    }

    const body = await postOrder({ sessionId: 's-1' }, { fetchImpl })

    expect(calls[0].url).toBe('http://api.test/api/orders')
    expect(JSON.parse(calls[0].init.body)).toEqual({ sessionId: 's-1' })
    expect(body).toEqual({ id: 'order-1', total: 128 })
  })

  it('resolve to null on a non-2xx response instead of throwing', async () => {
    vi.stubEnv('VITE_API_URL', 'http://api.test')
    const fetchImpl = async () => ({ ok: false, status: 500, json: async () => ({}) })
    expect(await postCartItem({ sessionId: 's-1', productId: 'p' }, { fetchImpl })).toBeNull()
    expect(await postOrder({ sessionId: 's-1' }, { fetchImpl })).toBeNull()
  })

  it('resolve to null when the request rejects', async () => {
    vi.stubEnv('VITE_API_URL', 'http://api.test')
    const fetchImpl = async () => { throw new Error('offline') }
    expect(await postCartItem({ sessionId: 's-1', productId: 'p' }, { fetchImpl })).toBeNull()
    expect(await postOrder({ sessionId: 's-1' }, { fetchImpl })).toBeNull()
  })
})
