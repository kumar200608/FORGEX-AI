// Cart = one basket per anonymous `sessionId`. There is no auth in this demo,
// so the session id the client generates is the whole identity.
//
// Items denormalise `name` and `price` on purpose: a cart is a record of what
// the shopper was quoted, and it keeps the read path a single document fetch.

import mongoose from 'mongoose'

const cartItemSchema = new mongoose.Schema(
  {
    productId: { type: String, required: true, trim: true },
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    qty: { type: Number, required: true, min: 1, max: 99, default: 1 },
  },
  { _id: false }
)

const cartSchema = new mongoose.Schema(
  {
    sessionId: { type: String, required: true, unique: true, index: true, trim: true },
    items: { type: [cartItemSchema], default: [] },
  },
  {
    timestamps: true,
  }
)

// Derived, never stored — so it can never drift out of sync with `items`.
cartSchema.virtual('total').get(function total() {
  return (this.items || []).reduce((sum, item) => sum + item.price * item.qty, 0)
})

// One transform, applied to both `toJSON` (res.json) and explicit `.toJSON()`.
cartSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    delete ret._id
    delete ret.id // mongoose's virtual `id`; the caller keys carts by sessionId
    return ret
  },
})

export default mongoose.model('Cart', cartSchema)
