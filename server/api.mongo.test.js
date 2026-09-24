// Integration suite against a REAL MongoDB.
//
// It is skipped unless MONGO_TEST_URI points at a database you are happy to
// write to, so `npm test` stays hermetic and fast:
//
//   PowerShell :  $env:MONGO_TEST_URI = 'mongodb://127.0.0.1:27017/adaptive-test'; npm test
//   bash       :  MONGO_TEST_URI='mongodb://127.0.0.1:27017/adaptive-test' npm test
//
// This is the only place the Mongoose models, the schema validation and the
// seed script are exercised for real. The hermetic suite in api.test.js covers
// the HTTP layer with in-memory stand-ins.

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import request from 'supertest'
import createApp from './app.js'
import { connect, disconnect } from './db.js'
import Cart from './models/Cart.js'
import Order from './models/Order.js'
import { seed } from './seed.js'
import { PRODUCTS } from '../src/data/products.js'

const uri = process.env.MONGO_TEST_URI
const suite = uri ? describe : describe.skip

suite('API against a real MongoDB', () => {
  const app = createApp()
  const session = 'mongo-test-session'
  const first = PRODUCTS[0]

  beforeAll(async () => {
    await connect(uri)
    await seed()
  }, 60_000)

  beforeEach(async () => {
    await Cart.deleteMany({ sessionId: session })
    await Order.deleteMany({ sessionId: session })
  })

  afterAll(async () => {
    await Cart.deleteMany({ sessionId: session })
    await Order.deleteMany({ sessionId: session })
    await disconnect()
  })

  it('reports ok once the connection is live', async () => {
    const res = await request(app).get('/api/health')
    expect(res.status).toBe(200)
    expect(res.body.status).toBe('ok')
    expect(res.body.db).toBe('connected')
  })

  it('serves the seeded catalogue', async () => {
    const res = await request(app).get('/api/products')
    expect(res.status).toBe(200)
    expect(res.body.count).toBe(PRODUCTS.length)
  })

  it('runs an add-to-cart then checkout round trip against stored documents', async () => {
    const add = await request(app).post('/api/cart').send({ sessionId: session, productId: first.id, qty: 2 })
    expect(add.status).toBe(201)
    expect(add.body.total).toBe(first.price * 2)

    const order = await request(app).post('/api/orders').send({ sessionId: session })
    expect(order.status).toBe(201)
    expect(order.body.total).toBe(first.price * 2)
    expect(order.body.items[0].productId).toBe(first.id)

    // The order is a snapshot: it must survive as its own document.
    expect(await Order.countDocuments({ sessionId: session })).toBe(1)
  })

  it('404s a product that is not in the database', async () => {
    const res = await request(app).get('/api/products/not-a-real-product')
    expect(res.status).toBe(404)
  })
})
