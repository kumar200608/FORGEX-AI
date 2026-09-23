// @vitest-environment jsdom
//
// The focus trap had no automated coverage at all: it was a behaviour judges
// click through and nothing verified. This exercises it in a real DOM.

import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { useRef } from 'react'
import { useDialogFocus } from './useDialogFocus.js'

afterEach(cleanup)

function Dialog({ onClose }) {
  const closeRef = useRef(null)
  const ref = useDialogFocus({ onClose, initialRef: closeRef })
  return (
    <div ref={ref} role="dialog" aria-modal="true" tabIndex={-1} data-testid="dialog">
      <button ref={closeRef} data-testid="first">Close</button>
      <button data-testid="middle">Middle</button>
      <button data-testid="last">Last</button>
    </div>
  )
}

function press(key, target, shiftKey = false) {
  target.dispatchEvent(
    new KeyboardEvent('keydown', { key, shiftKey, bubbles: true, cancelable: true }),
  )
}

describe('useDialogFocus', () => {
  it('moves focus into the dialog on mount, preferring the initial target', () => {
    render(<Dialog onClose={() => {}} />)
    expect(document.activeElement).toBe(screen.getByTestId('first'))
  })

  it('keeps Tab inside the dialog by wrapping from the last control to the first', () => {
    render(<Dialog onClose={() => {}} />)
    const last = screen.getByTestId('last')
    last.focus()
    expect(document.activeElement).toBe(last)

    press('Tab', last)
    expect(document.activeElement).toBe(screen.getByTestId('first'))
  })

  it('wraps backwards from the first control to the last on Shift+Tab', () => {
    render(<Dialog onClose={() => {}} />)
    const first = screen.getByTestId('first')
    first.focus()

    press('Tab', first, true)
    expect(document.activeElement).toBe(screen.getByTestId('last'))
  })

  it('lets Tab move normally between controls in the middle of the dialog', () => {
    render(<Dialog onClose={() => {}} />)
    const middle = screen.getByTestId('middle')
    middle.focus()

    press('Tab', middle)
    // Nothing intercepted it, so focus is wherever the browser left it: still
    // inside the dialog, not wrapped by the handler.
    expect(screen.getByTestId('dialog').contains(document.activeElement)).toBe(true)
  })

  it('calls onClose on Escape', () => {
    const onClose = vi.fn()
    render(<Dialog onClose={onClose} />)
    press('Escape', document.activeElement)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('locks background scrolling while open and restores it after', () => {
    const before = document.body.style.overflow
    const { unmount } = render(<Dialog onClose={() => {}} />)
    expect(document.body.style.overflow).toBe('hidden')
    unmount()
    expect(document.body.style.overflow).toBe(before)
  })

  it('hands focus back to whatever opened it', () => {
    const opener = document.createElement('button')
    document.body.appendChild(opener)
    opener.focus()
    expect(document.activeElement).toBe(opener)

    const { unmount } = render(<Dialog onClose={() => {}} />)
    expect(document.activeElement).toBe(screen.getByTestId('first'))

    unmount()
    expect(document.activeElement).toBe(opener)
    opener.remove()
  })

  it('removes its key listener on unmount', () => {
    const onClose = vi.fn()
    const { unmount } = render(<Dialog onClose={onClose} />)
    unmount()
    press('Escape', document.body)
    expect(onClose).not.toHaveBeenCalled()
  })
})
