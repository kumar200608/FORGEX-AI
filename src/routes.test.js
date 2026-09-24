import { describe, it, expect } from 'vitest'
import { routeFromHash, hashFor, DASHBOARD_BASE, DASHBOARD_PAGES, DEFAULT_PAGE } from './routes.js'

describe('routeFromHash', () => {
  it('treats an empty or missing hash as the shop', () => {
    expect(routeFromHash('')).toEqual({ view: 'shop', page: DEFAULT_PAGE })
    expect(routeFromHash(undefined)).toEqual({ view: 'shop', page: DEFAULT_PAGE })
    expect(routeFromHash(null)).toEqual({ view: 'shop', page: DEFAULT_PAGE })
  })

  it('opens the overview page for the bare dashboard hash', () => {
    expect(routeFromHash(DASHBOARD_BASE)).toEqual({ view: 'dashboard', page: 'overview' })
  })

  it('opens each named dashboard page', () => {
    expect(routeFromHash('#/dashboard/metrics')).toEqual({ view: 'dashboard', page: 'metrics' })
    expect(routeFromHash('#/dashboard/log')).toEqual({ view: 'dashboard', page: 'log' })
    expect(routeFromHash('#/dashboard/overview')).toEqual({ view: 'dashboard', page: 'overview' })
  })

  it('keeps an unknown dashboard page inside the dashboard instead of dropping to the shop', () => {
    expect(routeFromHash('#/dashboard/nope')).toEqual({ view: 'dashboard', page: DEFAULT_PAGE })
    expect(routeFromHash('#/dashboard/metrics/')).toEqual({ view: 'dashboard', page: 'metrics' })
  })

  it('ignores unrelated hashes', () => {
    expect(routeFromHash('#/something-else')).toEqual({ view: 'shop', page: DEFAULT_PAGE })
    expect(routeFromHash('#')).toEqual({ view: 'shop', page: DEFAULT_PAGE })
  })

  it('every declared page is reachable', () => {
    DASHBOARD_PAGES.forEach((page) => {
      expect(routeFromHash(`${DASHBOARD_BASE}/${page}`)).toEqual({ view: 'dashboard', page })
    })
  })
})

describe('hashFor', () => {
  it('gives the shop no hash at all', () => {
    expect(hashFor('shop')).toBe('')
  })

  it('keeps the overview hash short', () => {
    expect(hashFor('dashboard', 'overview')).toBe(DASHBOARD_BASE)
  })

  it('round-trips every page', () => {
    DASHBOARD_PAGES.forEach((page) => {
      expect(routeFromHash(hashFor('dashboard', page))).toEqual({ view: 'dashboard', page })
    })
    expect(routeFromHash(hashFor('shop'))).toEqual({ view: 'shop', page: DEFAULT_PAGE })
  })
})
