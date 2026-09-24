// Smart prefetching — warms the cache only as far as the delivery budget
// allows. FULL: idle-prefetch everything. LIGHT: on intent (hover) only.
// DATA SAVER: never.

const requested = new Set()

export function resetPrefetchState() {
  requested.clear()
}

export function prefetchImage(url, budget, log) {
  if (!budget || budget.prefetch === 'none') return false
  if (requested.has(url)) return false
  requested.add(url)
  fetch(url, { priority: 'low' })
    .then(() => log && log('prefetch', `warmed ${url.split('/').pop()} (budget: ${budget.prefetch})`))
    .catch(() => requested.delete(url))
  return true
}

export function prefetchImages(urls, budget, log) {
  let n = 0
  for (const url of urls) if (prefetchImage(url, budget, log)) n += 1
  return n
}
