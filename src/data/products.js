// Demo catalogue for "Aurora Goods" — the shop from the deck's example scenario.
// Images exist in three tiers per product: low / mid / high (see public/assets/products).
export const PRODUCTS = [
  {
    id: 'aurora-lamp', name: 'Aurora Lamp', price: 89, category: 'Lighting',
    tagline: 'Warm gradient glow for late work sessions.',
    desc: 'A sculptural desk lamp with a stepless warm-to-neutral dial, a matte steel stem and a base-weighted arm that stays exactly where you put it.',
  },
  {
    id: 'nimbus-chair', name: 'Nimbus Chair', price: 249, category: 'Furniture',
    tagline: 'Nine hours of sitting, zero complaints.',
    desc: 'Breathable weave back, moulded seat foam and a recline that locks anywhere between 95° and 125°. Assembled in four clicks.',
  },
  {
    id: 'orbit-clock', name: 'Orbit Clock', price: 59, category: 'Decor',
    // The clock gets a real 360-degree rotation preview instead of the generic spin.
    preview: 'clock360',
    tagline: 'Silent sweep, loud personality.',
    desc: 'A 40 cm wall clock with a silent sweep movement, an anodised bezel and hands you can read from the next room.',
  },
  {
    id: 'drift-speaker', name: 'Drift Speaker', price: 149, category: 'Audio',
    tagline: 'Room-filling sound, pocket-sized footprint.',
    desc: 'A 30 W portable speaker with passive bass radiators, 14-hour battery and IPX5 splash resistance for the balcony and the bathroom.',
  },
  {
    id: 'halo-mug', name: 'Halo Mug', price: 24, category: 'Kitchen',
    tagline: 'Keeps coffee at 62°C for 90 minutes.',
    desc: 'Double-walled ceramic with a vacuum core, a cork base that never rings the table, and a lid that survives being dropped.',
  },
  {
    id: 'zenith-bottle', name: 'Zenith Bottle', price: 34, category: 'Outdoors',
    tagline: 'Ice water at mile twenty.',
    desc: 'A 750 ml vacuum bottle that holds cold for 24 hours, with a one-handed magnetic cap and a powder coat that hides scratches.',
  },
  {
    id: 'lumen-candle', name: 'Lumen Candle', price: 19, category: 'Decor',
    tagline: 'Amber light, zero soot.',
    desc: 'Soy-wax candle with a wooden wick that crackles quietly, pouring an amber light across the room for 45 hours.',
  },
  {
    id: 'terra-plantor', name: 'Terra Planter', price: 49, category: 'Garden',
    tagline: 'Self-watering for two weeks.',
    desc: 'A glazed stoneware planter with a wicking reservoir, a water-level window and a drainage tray that actually fits.',
  },
]

// Every product ships in three formats. The savings are measured, not assumed:
// regenerating with `scripts/generate-images.py` prints the byte size of each
// one, and manifest.json records them for the dashboard to compare against.
export const IMAGE_FORMATS = ['avif', 'webp', 'jpg']

export const productImage = (id, tier, format = 'jpg') => `/assets/products/${id}-${tier}.${format}`

/** All three URLs for a tier, for a <picture> element. */
export const productImageSet = (id, tier) => ({
  avif: productImage(id, tier, 'avif'),
  webp: productImage(id, tier, 'webp'),
  jpg: productImage(id, tier, 'jpg'),
})

// Resolved once. A browser that cannot encode AVIF hands back a PNG data URL
// instead, so this is a synchronous, dependency-free capability check.
let cachedBestFormat = null
export function bestImageFormat() {
  if (cachedBestFormat) return cachedBestFormat
  try {
    const canvas = document.createElement('canvas')
    canvas.width = 1
    canvas.height = 1
    cachedBestFormat = canvas.toDataURL('image/avif').startsWith('data:image/avif') ? 'avif' : 'webp'
  } catch {
    cachedBestFormat = 'jpg'
  }
  return cachedBestFormat
}
