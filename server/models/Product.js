// Product = one catalogue entry. The shape mirrors src/data/products.js exactly
// (id/name/price/category/tagline/desc) so the frontend can consume an API
// product and a static product interchangeably.

import mongoose from 'mongoose'

const productSchema = new mongoose.Schema(
  {
    // Business key, not Mongo's _id: the static catalogue is keyed by slug and
    // image URLs are built from it (`/assets/products/<id>-<tier>.jpg`).
    id: { type: String, required: true, unique: true, index: true, trim: true },
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    category: { type: String, required: true, trim: true },
    tagline: { type: String, default: '' },
    desc: { type: String, default: '' },
    // Which canvas preview the client should render. 'turntable' is the generic
    // spin every product gets; 'clock360' rotates the clock itself.
    preview: { type: String, enum: ['turntable', 'clock360'], default: 'turntable' },
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

export default mongoose.model('Product', productSchema)
