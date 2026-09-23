// Checkout. An order is built from the *stored* cart, never from client-supplied
// line items, so prices and quantities cannot be forged at the last step.

import { Router } from 'express'
import Cart from '../models/Cart.js'
import Order from '../models/Order.js'
import { asyncHandler, httpError } from '../middleware/error.js'
import { requireObjectBody, validateSessionId } from '../validate.js'

const router = Router()

const round2 = (n) => Math.round(n * 100) / 100

/**
 * POST /api/orders  { sessionId }
 * 400 when the cart exists but is empty, 404 when there is no cart at all.
 * The cart is intentionally left intact — this demo has no payment step, so
 * clearing it would destroy the only basket the shopper has.
 */
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const body = requireObjectBody(req.body)
    const sessionId = validateSessionId(body.sessionId)

    const cart = await Cart.findOne({ sessionId })
    if (!cart) throw httpError(404, `No cart for session "${sessionId}"`)
    if (!cart.items.length) {
      throw httpError(400, 'Cart is empty — add an item before creating an order')
    }

    const items = cart.items.map((item) => ({
      productId: item.productId,
      name: item.name,
      price: item.price,
      qty: item.qty,
    }))
    const total = round2(items.reduce((sum, item) => sum + item.price * item.qty, 0))

    const order = await Order.create({ sessionId, items, total })
    res.status(201).json(order.toJSON())
  })
)

export default router
