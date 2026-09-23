// The Express app, exported as a factory so tests can mount it without binding
// a port or owning the process. `index.js` is what actually listens.

import express from 'express'
import cors from 'cors'
import productsRouter from './routes/products.js'
import cartRouter from './routes/cart.js'
import ordersRouter from './routes/orders.js'
import { errorHandler, notFound } from './middleware/error.js'
import { dbState, isConnected } from './db.js'

export function createApp() {
  const app = express()

  // The frontend is a static PWA served from a different origin (Vite :5173,
  // preview :4173), so permissive CORS is the dev-friendly default here.
  app.use(cors())

  // Bounded body: every accepted payload is a small JSON object. Without a cap,
  // express.json() buffers whatever it is sent.
  app.use(express.json({ limit: '100kb' }))

  // Liveness + readiness in one: `db` is read from mongoose's live readyState,
  // so this cannot report "ok" while the database is actually gone.
  app.get('/api/health', (req, res) => {
    const db = dbState()
    res.json({ status: isConnected() ? 'ok' : 'degraded', db })
  })

  app.use('/api/products', productsRouter)
  app.use('/api/cart', cartRouter)
  app.use('/api/orders', ordersRouter)

  // Order matters: unmatched routes 404, then every error funnels to the handler.
  app.use(notFound)
  app.use(errorHandler)

  return app
}

export default createApp
