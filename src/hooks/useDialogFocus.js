import { useEffect, useRef } from 'react'

// Focus management for the two overlay dialogs (product detail, dashboard).
//
// What it does, and why each part is here:
//   · initial focus — a dialog that opens without moving focus leaves the
//     keyboard user behind the backdrop;
//   · Tab containment — Tab/Shift+Tab cycle inside the dialog instead of
//     escaping to the page underneath;
//   · Escape — dismisses, captured so nothing under the dialog sees the key;
//   · focus restoration — the element that opened the dialog gets focus back
//     on close, so the user resumes where they were;
//   · background scroll lock — the drawer is a scroll container; without this
//     the page scrolls behind it.
//
// Returns the ref for the dialog container. The container must be focusable
// (tabIndex={-1}) so it can be a fallback focus target and a Tab endpoint.
const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

export function useDialogFocus({ onClose, initialRef } = {}) {
  const containerRef = useRef(null)
  const restoreRef = useRef(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    restoreRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null

    const focusables = () => Array.from(container.querySelectorAll(FOCUSABLE))

    const target = initialRef?.current || focusables()[0] || container
    target.focus?.({ preventScroll: true })

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onCloseRef.current?.()
        return
      }
      if (event.key !== 'Tab') return

      const list = focusables()
      if (!list.length) {
        event.preventDefault()
        container.focus?.()
        return
      }
      const first = list[0]
      const last = list[list.length - 1]
      const active = document.activeElement
      const inside = container.contains(active)

      if (event.shiftKey) {
        if (!inside || active === first) { event.preventDefault(); last.focus() }
      } else if (!inside || active === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown, true)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKeyDown, true)
      document.body.style.overflow = previousOverflow
      const restore = restoreRef.current
      if (restore && document.contains(restore) && typeof restore.focus === 'function') {
        restore.focus({ preventScroll: true })
      }
    }
  }, [initialRef])

  return containerRef
}
