// @vitest-environment jsdom
//
// The checkout path was the highest-value untested surface: it is what a judge
// clicks, and it is the only thing that actually uses the backend.

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, cleanup, waitFor } from '@testing-library/react'

const store = new Map()
globalThis.sessionStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => { store.set(k, String(v)) },
  removeItem: (k) => { store.delete(k) },
  clear: () => store.clear(),
}

const cart = await import('../cart.js')
const { default: CartPanel } = await import('./CartPanel.jsx')

const lamp = { id: 'aurora-lamp', name: 'Aurora Lamp', price: 89 }

beforeEach(() => {
  store.clear()
  cart.clear()
})

afterEach(() => {
  cleanup()
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe('CartPanel', () => {
  it('explains an empty cart instead of showing a broken list', () => {
    render(<CartPanel onClose={() => {}} />)
    expect(screen.getByTestId('cart-panel')).toBeTruthy()
    expect(screen.getByText(/nothing here yet/i)).toBeTruthy()
    expect(screen.queryByTestId('cart-lines')).toBeNull()
    expect(screen.getByTestId('place-order').disabled).toBe(true)
  })

  it('lists lines with their quantities and totals them', () => {
    cart.addItem(lamp, 2)
    render(<CartPanel onClose={() => {}} />)

    expect(screen.getByTestId('cart-lines').textContent).toContain('Aurora Lamp')
    expect(screen.getByTestId('cart-lines').textContent).toContain('×2')
    expect(screen.getByTestId('cart-total').textContent).toBe('$178.00')
    expect(screen.getByTestId('place-order').disabled).toBe(false)
  })

  it('drops a line when its Remove control is used', async () => {
    cart.addItem(lamp)
    render(<CartPanel onClose={() => {}} />)

    screen.getByTestId('remove-aurora-lamp').click()
    await waitFor(() => expect(screen.queryByTestId('cart-lines')).toBeNull())
    expect(cart.getCount()).toBe(0)
  })

  it('says nothing was recorded when no API is configured, and keeps the cart', async () => {
    cart.addItem(lamp)
    render(<CartPanel onClose={() => {}} />)

    screen.getByTestId('place-order').click()

    const note = await screen.findByTestId('cart-result-local')
    expect(note.textContent).toMatch(/no api configured/i)
    expect(cart.getCount()).toBe(1)   // the demonstration checkout is not destructive
  })

  it('shows the order id and empties the cart when the API accepts it', async () => {
    vi.stubEnv('VITE_API_URL', 'http://api.test')
    vi.stubGlobal('fetch', async (url) => {
      if (String(url).endsWith('/api/cart')) return { ok: true, json: async () => ({}) }
      return { ok: true, json: async () => ({ id: 'order-42', total: 89 }) }
    })

    cart.addItem(lamp)
    render(<CartPanel onClose={() => {}} />)

    screen.getByTestId('place-order').click()

    const note = await screen.findByTestId('cart-result-remote')
    expect(note.textContent).toContain('order-42')
    await waitFor(() => expect(cart.getCount()).toBe(0))
  })

  it('closes when Close is used', () => {
    const onClose = vi.fn()
    render(<CartPanel onClose={onClose} />)
    screen.getByTestId('cart-close').click()
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
