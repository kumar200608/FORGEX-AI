// Cart reads and writes. A cart is created on first write for a sessionId, so
// the client never has to "open" one first.

import { Router } from 'express'
import Cart from '../models/Cart.js'
import Product from '../models/Product.js'
import { asyncHandler, httpError } from '../middleware/error.js'
import { requireObjectBody, validateProductId, validateQty, validateSessionId } from '../validate.js'

const router = Router()

/**
 * POST /api/cart
 * Create-or-update the cart for `{ sessionId, productId, qty? }`.
 * 201 when the cart is created, 200 when an existing cart is updated.
 *
 * Denormalised line fields (name, price) are copied from the *server's* product
 * record, never from the request body — a client cannot set its own price.
 */
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const body = requireObjectBody(req.body)
    const sessionId = validateSessionId(body.sessionId)
    const productId = validateProductId(body.productId)
    const qty = validateQty(body.qty)

    const product = await Product.findOne({ id: productId }).lean()
    if (!product) throw httpError(404, `No product with id "${productId}"`)

    let cart = await Cart.findOne({ sessionId })
    let created = false
    if (!cart) {
      cart = new Cart({ sessionId, items: [] })
      created = true
    }

    const existing = cart.items.find((item) => item.productId === productId)
    if (existing) {
      // Cap at the schema's 99 ceiling rather than letting validation blow up
      // the whole update at checkout.
      existing.qty = Math.min(existing.qty + qty, 99)
    } else {
      cart.items.push({
        productId: product.id,
        name: product.name,
        price: product.price,
        qty,
      })
    }

    await cart.save()
    res.status(created ? 201 : 200).json(cart.toJSON())
  })
)

/** GET /api/cart/:sessionId — 404 when the session has no cart yet. */
router.get(
  '/:sessionId',
  asyncHandler(async (req, res) => {
    const sessionId = validateSessionId(req.params.sessionId)
    const cart = await Cart.findOne({ sessionId })
    if (!cart) throw httpError(404, `No cart for session "${sessionId}"`)
    res.json(cart.toJSON())
  })
)

export default router
