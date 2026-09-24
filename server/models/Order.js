// Order = an immutable snapshot taken from a cart at checkout time.
// Lines are copied rather than referenced, so later catalogue edits (or price
// changes) never rewrite history.

import mongoose from 'mongoose'

const orderItemSchema = new mongoose.Schema(
  {
    productId: { type: String, required: true, trim: true },
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    qty: { type: Number, required: true, min: 1, max: 99 },
  },
  { _id: false }
)

const orderSchema = new mongoose.Schema(
  {
    sessionId: { type: String, required: true, index: true, trim: true },
    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: (items) => Array.isArray(items) && items.length > 0,
        message: 'an order needs at least one item',
      },
    },
    total: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ['created'], default: 'created' },
  },
  {
    timestamps: true,
    toJSON: {
      versionKey: false,
      transform: (_doc, ret) => {
        delete ret._id
        return ret
      },
    },
  }
)

export default mongoose.model('Order', orderSchema)
