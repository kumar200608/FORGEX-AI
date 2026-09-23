// Seed the catalogue into MongoDB.
//
//   npm run server:seed
//
// The product data is *imported* from the frontend module rather than copied, so
// there is exactly one source of truth. `PRODUCTS` is already exported there and
// the shape matches models/Product.js field-for-field — no data was changed.

import { pathToFileURL } from 'node:url'
import 'dotenv/config'
import { PRODUCTS } from '../src/data/products.js'
import Product from './models/Product.js'
import { connect, disconnect, getMongoUri, redactUri } from './db.js'

/**
 * Idempotent by construction.
 *
 * Every product is written with `updateOne({ id }, { $set: … }, { upsert: true })`
 * inside one bulkWrite:
 *   - the filter is the unique business key (`id`), so re-running can never
 *     insert a duplicate — the second run matches instead of upserting;
 *   - `$set` (not `$setOnInsert`) makes seeding also *reconcile* drift: change a
 *     price in products.js, re-seed, and Mongo matches the source.
 * Running it twice reports 0 upserts the second time and the collection still
 * holds exactly PRODUCTS.length documents.
 */
export async function seed(products = PRODUCTS) {
  const operations = products.map((product) => ({
    updateOne: {
      filter: { id: product.id },
      update: {
        $set: {
          id: product.id,
          name: product.name,
          price: product.price,
          category: product.category,
          tagline: product.tagline ?? '',
          desc: product.desc ?? '',
          preview: product.preview ?? 'turntable',
        },
      },
      upsert: true,
    },
  }))

  const result = await Product.bulkWrite(operations, { ordered: false })
  return {
    total: products.length,
    upserted: result.upsertedCount ?? 0,
    modified: result.modifiedCount ?? 0,
    matched: result.matchedCount ?? 0,
  }
}

async function main() {
  let uri
  try {
    uri = getMongoUri()
  } catch (err) {
    console.error(`[seed] ${err.message}`)
    process.exitCode = 1
    return
  }

  try {
    await connect(uri)
  } catch (err) {
    console.error(`[seed] could not connect to MongoDB at ${redactUri(uri)} — ${err.message}`)
    process.exitCode = 1
    return
  }

  try {
    const stats = await seed()
    console.log(`[seed] ${redactUri(uri)}`)
    console.log(
      `[seed] catalogue: ${stats.total} products — upserted ${stats.upserted}, ` +
        `updated ${stats.modified}, matched ${stats.matched}`
    )
    const count = await Product.countDocuments()
    console.log(`[seed] collection now holds ${count} product(s)`)
  } catch (err) {
    console.error(`[seed] seeding failed — ${err.message}`)
    process.exitCode = 1
  } finally {
    await disconnect()
  }
}

// Only run when invoked directly (`node server/seed.js`), not when a test
// imports `seed()`. pathToFileURL handles the Windows drive-letter form.
const invokedDirectly =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href

if (invokedDirectly) main()
