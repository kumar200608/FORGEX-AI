// Hash routing, kept pure so it can be tested without a browser.
//
//   (empty)                -> shop
//   #/dashboard            -> dashboard, overview page
//   #/dashboard/metrics    -> dashboard, metrics page
//   #/dashboard/log        -> dashboard, event log page
//
// The hash is used rather than a path because the app is a static PWA: a hash
// change never reaches the server, so the service worker's network-first
// navigation fallback is not involved, and any host can serve the build.

export const DASHBOARD_BASE = '#/dashboard'
export const DASHBOARD_PAGES = ['overview', 'metrics', 'log']
export const DEFAULT_PAGE = 'overview'

/** Parse a location hash into the view and page to render. */
export function routeFromHash(hash) {
  const raw = typeof hash === 'string' ? hash : ''
  if (raw === DASHBOARD_BASE) return { view: 'dashboard', page: DEFAULT_PAGE }
  if (raw.startsWith(`${DASHBOARD_BASE}/`)) {
    const page = raw.slice(DASHBOARD_BASE.length + 1).replace(/\/+$/, '')
    if (DASHBOARD_PAGES.includes(page)) return { view: 'dashboard', page }
    // An unknown page under /dashboard stays in the dashboard rather than
    // dumping the user back on the shop.
    return { view: 'dashboard', page: DEFAULT_PAGE }
  }
  return { view: 'shop', page: DEFAULT_PAGE }
}

/** The hash for a route. '' means "no hash" (the shop). */
export function hashFor(view, page = DEFAULT_PAGE) {
  if (view !== 'dashboard') return ''
  return page === DEFAULT_PAGE ? DASHBOARD_BASE : `${DASHBOARD_BASE}/${page}`
}
