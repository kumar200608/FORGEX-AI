// Theme preference: 'light' | 'dark' | 'system'.
//
// 'system' is a real third state, not a fallback: it follows the OS and keeps
// following it while it is selected. The resolved theme is written to
// <html data-theme> so the stylesheet only has to describe two states, and an
// inline script in index.html resolves it before first paint (see that file)
// so choosing 'system' never flashes the wrong theme on load.

const KEY = 'theme'
const PREFERENCES = ['light', 'dark', 'system']

const listeners = new Set()

function store() {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage
  } catch {
    return null   // some browsers throw when storage is blocked
  }
}

function mediaQuery() {
  try {
    return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia('(prefers-color-scheme: dark)')
      : null
  } catch {
    return null
  }
}

/** The stored preference, or 'system' when nothing valid is stored. */
// Holds a choice for this session when storage is unavailable or throws, so
// picking a theme still does something in private mode rather than snapping
// back. Storage stays authoritative whenever it works.
let memoryPreference = null

export function getPreference() {
  const s = store()
  if (!s) return memoryPreference || 'system'
  try {
    const raw = s.getItem(KEY)
    return PREFERENCES.includes(raw) ? raw : 'system'
  } catch {
    return memoryPreference || 'system'   // Safari private mode throws on read
  }
}

/** Whether the operating system currently asks for a dark UI. */
function systemPrefersDark() {
  const mq = mediaQuery()
  return mq ? mq.matches : false
}

/** Pure: the theme a preference resolves to. Exported so it can be tested. */
export function resolveTheme(preference, prefersDark) {
  if (preference === 'light' || preference === 'dark') return preference
  return prefersDark ? 'dark' : 'light'
}

export function getTheme() {
  return resolveTheme(getPreference(), systemPrefersDark())
}

/** Write the resolved theme to the document and notify subscribers. */
export function applyTheme() {
  const theme = getTheme()
  const preference = getPreference()

  if (typeof document !== 'undefined' && document.documentElement) {
    document.documentElement.dataset.theme = theme
    // Keep the browser/PWA chrome in step with the page.
    const meta = document.querySelector && document.querySelector('meta[name="theme-color"]')
    if (meta) meta.setAttribute('content', theme === 'dark' ? '#111825' : '#f5f6f3')
  }

  for (const fn of listeners) fn(theme, preference)
  return theme
}

/** Set the preference (persisted) and apply it. Returns the resolved theme. */
export function setPreference(preference) {
  if (!PREFERENCES.includes(preference)) return getTheme()
  memoryPreference = preference
  const s = store()
  if (s) {
    try {
      s.setItem(KEY, preference)
    } catch {
      /* storage blocked: the choice still applies for this session */
    }
  }
  return applyTheme()
}

/** Subscribe to theme changes. Returns an unsubscribe function. */
export function subscribe(fn) {
  listeners.add(fn)
  return () => { listeners.delete(fn) }
}

/**
 * Follow the OS while 'system' is selected. Returns an unsubscribe function.
 */
export function watchSystemTheme() {
  const mq = mediaQuery()
  if (!mq || typeof mq.addEventListener !== 'function') return () => {}
  const onChange = () => {
    if (getPreference() === 'system') applyTheme()
  }
  mq.addEventListener('change', onChange)
  return () => mq.removeEventListener('change', onChange)
}

export const themePreferences = PREFERENCES
