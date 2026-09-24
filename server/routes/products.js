// Catalogue reads. The list route is deliberately small: the demo catalogue is
// eight documents, so filtering/pagination happen in the query, not in JS.

import { Router } from 'express'
import Product from '../models/Product.js'
import { asyncHandler, httpError } from '../middleware/error.js'
import { parseLimit } from '../validate.js'

const router = Router()

// `?tier=` is explicitly rejected rather than silently ignored. Tiers are a
// *delivery* concern owned by the adaptive client (it picks low/mid/high image
// variants from the budget) — the catalogue itself has no tier column, so
// accepting the parameter would imply a filter that can never be applied.
const REJECTED_QUERY = ['tier']

/**
 * GET /api/products
 * Optional `?limit=` (1–100). Unknown-but-meaningful params are rejected so a
 * typo returns 400 instead of a silently unfiltered list.
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    for (const key of REJECTED_QUERY) {
      if (req.query[key] !== undefined) {
        throw httpError(
          400,
          `\`${key}\` is not a stored field on the catalogue. Image tiers are chosen ` +
            'client-side by the adaptive engine, so there is nothing to filter here.'
        )
      }
    }

    const limit = parseLimit(req.query.limit)
    const query = Product.find().sort({ id: 1 }).select('-_id id name price category tagline desc preview')
    if (limit !== undefined) query.limit(limit)

    const products = await query.lean()
    res.json({ count: products.length, products })
  })
)

/** GET /api/products/:id — the business slug, not Mongo's _id. */
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const product = await Product.findOne({ id: req.params.id })
      .select('-_id id name price category tagline desc preview')
      .lean()
    if (!product) throw httpError(404, `No product with id "${req.params.id}"`)
    res.json(product)
  })
)

export default router
