// API tests that need no database and no network.
//
// The route handlers talk to Mongoose models, so rather than downloading a real
// MongoDB (a ~600 MB binary, which is what made this suite hang) or requiring a
// local mongod, the three model modules are replaced with small in-memory
// stand-ins that implement exactly the query surface the routes use.
//
// Everything else is the real thing: the routers, `validate.js`, the error
// middleware, and the HTTP layer, driven through supertest.
//
// A suite that does hit a real MongoDB lives in `api.mongo.test.js` and runs
// only when MONGO_TEST_URI is set.

import { describe, it, expect, beforeEach, vi } from 'vitest'
import request from 'supertest'

const store = vi.hoisted(() => {
  const PRODUCTS = [
    { id: 'aurora-lamp', name: 'Aurora Lamp', price: 128, category: 'Lighting', tagline: 'Warm up a room', desc: 'A lamp.' },
    { id: 'drift-speaker', name: 'Drift Speaker', price: 240, category: 'Audio', tagline: 'Sound that floats', desc: 'A speaker.' },
    { id: 'halo-mug', name: 'Halo Mug', price: 24, category: 'Kitchen', tagline: 'Keeps it hot', desc: 'A mug.' },
  ]

  const carts = new Map()
  const orders = []
  let nextOrderId = 1

  // Minimal stand-in for a Mongoose Query: chainable, thenable, and honest
  // about `limit` so the list route's paging is actually exercised.
  function query(value) {
    const q = {
      sort: () => q,
      select: () => q,
      limit: (n) => {
        if (Array.isArray(value)) value = value.slice(0, n)
        return q
      },
      lean: () => Promise.resolve(value),
      then: (onOk, onErr) => Promise.resolve(value).then(onOk, onErr),
      catch: (onErr) => Promise.resolve(value).catch(onErr),
    }
    return q
  }

  const Product = {
    find: () => query(PRODUCTS.map((p) => ({ ...p }))),
    findOne: (filter) => {
      const found = PRODUCTS.find((p) => p.id === (filter && filter.id))
      return query(found ? { ...found } : null)
    },
  }

  // `new Cart(...)` and `Cart.findOne(...)` both have to work, so this is a real
  // class with a static lookup rather than a plain object.
  class Cart {
    constructor({ sessionId, items = [] } = {}) {
      this.sessionId = sessionId
      this.items = items
    }
    async save() {
      carts.set(this.sessionId, this)
      return this
    }
    toJSON() {
      return {
        sessionId: this.sessionId,
        items: this.items.map((i) => ({ productId: i.productId, name: i.name, price: i.price, qty: i.qty })),
        total: this.items.reduce((sum, i) => sum + i.price * i.qty, 0),
      }
    }
    static async findOne(filter) {
      return carts.get(filter && filter.sessionId) || null
    }
  }

  const Order = {
    async create(doc) {
      const order = { id: `order-${nextOrderId++}`, status: 'created', ...doc }
      orders.push(order)
      return { toJSON: () => ({ ...order }) }
    },
  }

  return {
    PRODUCTS,
    carts,
    orders,
    Product,
    Cart,
    Order,
    /** Seed a cart directly, for the states the write route cannot produce. */
    seedCart(sessionId, items = []) {
      const cart = new Cart({ sessionId, items })
      carts.set(sessionId, cart)
      return cart
    },
    reset() {
      carts.clear()
      orders.length = 0
      nextOrderId = 1
    },
  }
})

vi.mock('./models/Product.js', () => ({ default: store.Product }))
vi.mock('./models/Cart.js', () => ({ default: store.Cart }))
vi.mock('./models/Order.js', () => ({ default: store.Order }))

const { default: createApp } = await import('./app.js')
const app = createApp()

const SESSION = 'sess-abc12345'
const post = (url, body) => request(app).post(url).send(body)

beforeEach(() => store.reset())

describe('GET /api/health', () => {
  it('reports the live connection state rather than a hard-coded ok', async () => {
    const res = await request(app).get('/api/health')
    expect(res.status).toBe(200)
    expect(typeof res.body.db).toBe('string')
    // No database is connected in this suite, so health must say so.
    expect(res.body.status).toBe('degraded')
    expect(res.body.db).toBe('disconnected')
  })
})

describe('GET /api/products', () => {
  it('lists the whole catalogue without leaking Mongo internals', async () => {
    const res = await request(app).get('/api/products')
    expect(res.status).toBe(200)
    expect(res.body.count).toBe(store.PRODUCTS.length)
    expect(res.body.products[0]).toMatchObject({ id: 'aurora-lamp', name: 'Aurora Lamp', price: 128 })
    expect(res.body.products[0]._id).toBeUndefined()
  })

  it('applies ?limit', async () => {
    const res = await request(app).get('/api/products?limit=2')
    expect(res.status).toBe(200)
    expect(res.body.count).toBe(2)
  })

  it('rejects ?limit=0 instead of silently returning everything', async () => {
    const res = await request(app).get('/api/products?limit=0')
    expect(res.status).toBe(400)
    expect(res.body.error).toBe('Bad Request')
  })

  it('rejects a non-numeric ?limit', async () => {
    const res = await request(app).get('/api/products?limit=abc')
    expect(res.status).toBe(400)
  })

  it('rejects ?tier= because tiers are a client-side delivery concern', async () => {
    const res = await request(app).get('/api/products?tier=high')
    expect(res.status).toBe(400)
    expect(res.body.message).toMatch(/tier/i)
  })
})

describe('GET /api/products/:id', () => {
  it('returns one product by its slug', async () => {
    const res = await request(app).get('/api/products/halo-mug')
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ id: 'halo-mug', price: 24 })
  })

  it('404s an unknown slug', async () => {
    const res = await request(app).get('/api/products/does-not-exist')
    expect(res.status).toBe(404)
    expect(res.body.message).toMatch(/does-not-exist/)
  })
})

describe('POST /api/cart', () => {
  it('creates a cart on first add and answers 201', async () => {
    const res = await post('/api/cart', { sessionId: SESSION, productId: 'aurora-lamp' })
    expect(res.status).toBe(201)
    expect(res.body.sessionId).toBe(SESSION)
    expect(res.body.items).toHaveLength(1)
    expect(res.body.items[0]).toMatchObject({ productId: 'aurora-lamp', qty: 1 })
    expect(res.body.total).toBe(128)
  })

  it('takes name and price from the server record, never from the request body', async () => {
    const res = await post('/api/cart', {
      sessionId: SESSION,
      productId: 'aurora-lamp',
      qty: 1,
      price: 0.01,
      name: 'hacked',
    })
    expect(res.status).toBe(201)
    expect(res.body.items[0].price).toBe(128)
    expect(res.body.items[0].name).toBe('Aurora Lamp')
  })

  it('updates an existing cart with 200 and accumulates the quantity', async () => {
    await post('/api/cart', { sessionId: SESSION, productId: 'aurora-lamp' })
    const res = await post('/api/cart', { sessionId: SESSION, productId: 'aurora-lamp' })
    expect(res.status).toBe(200)
    expect(res.body.items).toHaveLength(1)
    expect(res.body.items[0].qty).toBe(2)
    expect(res.body.total).toBe(256)
  })

  it('adds a second distinct line instead of merging by mistake', async () => {
    await post('/api/cart', { sessionId: SESSION, productId: 'aurora-lamp' })
    const res = await post('/api/cart', { sessionId: SESSION, productId: 'halo-mug', qty: 3 })
    expect(res.status).toBe(200)
    expect(res.body.items).toHaveLength(2)
    expect(res.body.total).toBe(128 + 24 * 3)
  })

  it('caps a line at the 99 ceiling the schema enforces', async () => {
    await post('/api/cart', { sessionId: SESSION, productId: 'halo-mug', qty: 99 })
    const res = await post('/api/cart', { sessionId: SESSION, productId: 'halo-mug', qty: 99 })
    expect(res.status).toBe(200)
    expect(res.body.items[0].qty).toBe(99)
  })

  it('400s when sessionId is missing', async () => {
    const res = await post('/api/cart', { productId: 'aurora-lamp' })
    expect(res.status).toBe(400)
    expect(res.body.message).toMatch(/sessionId/)
  })

  it('400s a sessionId that is too short to be a real identifier', async () => {
    const res = await post('/api/cart', { sessionId: 'abc', productId: 'aurora-lamp' })
    expect(res.status).toBe(400)
    expect(res.body.message).toMatch(/sessionId/)
  })

  it('400s a sessionId containing characters we refuse to index', async () => {
    const res = await post('/api/cart', { sessionId: 'has space!!', productId: 'aurora-lamp' })
    expect(res.status).toBe(400)
  })

  it('400s a non-integer qty', async () => {
    const res = await post('/api/cart', { sessionId: SESSION, productId: 'aurora-lamp', qty: 1.5 })
    expect(res.status).toBe(400)
    expect(res.body.message).toMatch(/qty/)
  })

  it('400s a qty above the schema range', async () => {
    const res = await post('/api/cart', { sessionId: SESSION, productId: 'aurora-lamp', qty: 100 })
    expect(res.status).toBe(400)
  })

  it('400s a qty below the schema range', async () => {
    const res = await post('/api/cart', { sessionId: SESSION, productId: 'aurora-lamp', qty: 0 })
    expect(res.status).toBe(400)
  })

  it('400s a body that is not a JSON object', async () => {
    const res = await post('/api/cart', [1, 2, 3])
    expect(res.status).toBe(400)
    expect(res.body.message).toMatch(/JSON object/)
  })

  it('404s a product that is not in the catalogue', async () => {
    const res = await post('/api/cart', { sessionId: SESSION, productId: 'ghost-product' })
    expect(res.status).toBe(404)
    expect(res.body.message).toMatch(/ghost-product/)
  })
})

describe('GET /api/cart/:sessionId', () => {
  it('returns the stored cart', async () => {
    await post('/api/cart', { sessionId: SESSION, productId: 'halo-mug', qty: 2 })
    const res = await request(app).get(`/api/cart/${SESSION}`)
    expect(res.status).toBe(200)
    expect(res.body.items[0].qty).toBe(2)
    expect(res.body.total).toBe(48)
  })

  it('404s a session that has no cart yet', async () => {
    const res = await request(app).get('/api/cart/sess-nothing1')
    expect(res.status).toBe(404)
  })

  it('400s a malformed session id in the path', async () => {
    const res = await request(app).get('/api/cart/abc')
    expect(res.status).toBe(400)
  })
})

describe('POST /api/orders', () => {
  it('404s when the session has no cart', async () => {
    const res = await post('/api/orders', { sessionId: SESSION })
    expect(res.status).toBe(404)
  })

  it('400s when the cart exists but holds nothing', async () => {
    store.seedCart(SESSION, [])
    const res = await post('/api/orders', { sessionId: SESSION })
    expect(res.status).toBe(400)
    expect(res.body.message).toMatch(/empty/i)
  })

  it('snapshots the stored cart into an order with a server-computed total', async () => {
    await post('/api/cart', { sessionId: SESSION, productId: 'aurora-lamp' })
    await post('/api/cart', { sessionId: SESSION, productId: 'halo-mug', qty: 2 })
    const res = await post('/api/orders', { sessionId: SESSION })
    expect(res.status).toBe(201)
    expect(res.body.status).toBe('created')
    expect(res.body.items).toHaveLength(2)
    expect(res.body.total).toBe(128 + 48)
    expect(store.orders).toHaveLength(1)
  })

  it('ignores client-supplied items and prices', async () => {
    await post('/api/cart', { sessionId: SESSION, productId: 'drift-speaker', qty: 1 })
    const res = await post('/api/orders', {
      sessionId: SESSION,
      items: [{ productId: 'aurora-lamp', name: 'hacked', price: 0.01, qty: 1 }],
      total: 0.01,
    })
    expect(res.status).toBe(201)
    expect(res.body.total).toBe(240)
    expect(res.body.items[0].productId).toBe('drift-speaker')
  })

  it('400s a missing sessionId', async () => {
    const res = await post('/api/orders', {})
    expect(res.status).toBe(400)
  })
})

describe('error handling', () => {
  it('answers an unknown route with JSON, not HTML', async () => {
    const res = await request(app).get('/api/nope')
    expect(res.status).toBe(404)
    expect(res.headers['content-type']).toMatch(/application\/json/)
    expect(res.body.error).toBe('Not Found')
  })

  it('answers malformed JSON with 400 rather than blowing up as a 500', async () => {
    const res = await request(app)
      .post('/api/cart')
      .set('Content-Type', 'application/json')
      .send('{"sessionId": ')
    expect(res.status).toBe(400)
    expect(res.headers['content-type']).toMatch(/application\/json/)
  })

  it('does not leak a stack trace for a client error', async () => {
    const res = await post('/api/cart', { productId: 'aurora-lamp' })
    expect(res.status).toBe(400)
    expect(res.body.stack).toBeUndefined()
  })

  it('rejects an oversized body with 413 instead of buffering it', async () => {
    const res = await post('/api/cart', {
      sessionId: SESSION,
      productId: 'aurora-lamp',
      padding: 'x'.repeat(200 * 1024),
    })
    expect(res.status).toBe(413)
    expect(res.body.error).toBe('Payload Too Large')
  })
})
