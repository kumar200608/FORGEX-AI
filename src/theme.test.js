import { describe, it, expect, beforeEach } from 'vitest'

// Stubs must exist before the module is evaluated.
const local = new Map()
let systemDark = false

globalThis.localStorage = {
  getItem: (k) => (local.has(k) ? local.get(k) : null),
  setItem: (k, v) => { local.set(k, String(v)) },
  removeItem: (k) => { local.delete(k) },
}
globalThis.window = {
  matchMedia: (query) => ({
    matches: query.includes('dark') ? systemDark : false,
    addEventListener: () => {},
    removeEventListener: () => {},
  }),
}
globalThis.document = {
  documentElement: { dataset: {} },
  querySelector: () => null,
}

const theme = await import('./theme.js')

beforeEach(() => {
  local.clear()
  systemDark = false
})

describe('resolveTheme', () => {
  it('lets an explicit preference beat the OS', () => {
    expect(theme.resolveTheme('light', true)).toBe('light')
    expect(theme.resolveTheme('dark', false)).toBe('dark')
    expect(theme.resolveTheme('light', false)).toBe('light')
    expect(theme.resolveTheme('dark', true)).toBe('dark')
  })

  it('follows the OS for system', () => {
    expect(theme.resolveTheme('system', true)).toBe('dark')
    expect(theme.resolveTheme('system', false)).toBe('light')
  })

  it('treats an unknown preference as system', () => {
    expect(theme.resolveTheme(undefined, true)).toBe('dark')
    expect(theme.resolveTheme('neon', false)).toBe('light')
  })
})

describe('preference storage', () => {
  it('defaults to system when nothing is stored', () => {
    expect(theme.getPreference()).toBe('system')
    expect(theme.getTheme()).toBe('light')
  })

  it('ignores a stored value that is not a known preference', () => {
    local.set('theme', 'midnight')
    expect(theme.getPreference()).toBe('system')
  })

  it('persists the choice and resolves it', () => {
    expect(theme.setPreference('dark')).toBe('dark')
    expect(local.get('theme')).toBe('dark')
    expect(theme.getTheme()).toBe('dark')

    // An explicit choice survives a change of OS preference.
    systemDark = false
    expect(theme.getTheme()).toBe('dark')

    expect(theme.setPreference('light')).toBe('light')
    systemDark = true
    expect(theme.getTheme()).toBe('light')
  })

  it('rejects an unknown preference without writing it', () => {
    theme.setPreference('neon')
    expect(local.has('theme')).toBe(false)
    expect(theme.getPreference()).toBe('system')
  })

  it('follows the OS while system is selected', () => {
    theme.setPreference('system')
    systemDark = true
    expect(theme.getTheme()).toBe('dark')
    systemDark = false
    expect(theme.getTheme()).toBe('light')
  })
})

describe('applying the theme', () => {
  it('writes the resolved theme onto <html data-theme>', () => {
    theme.setPreference('dark')
    expect(globalThis.document.documentElement.dataset.theme).toBe('dark')
    theme.setPreference('light')
    expect(globalThis.document.documentElement.dataset.theme).toBe('light')
  })

  it('notifies subscribers with the theme and the preference', () => {
    const seen = []
    const off = theme.subscribe((resolved, preference) => seen.push([resolved, preference]))
    theme.setPreference('dark')
    theme.setPreference('system')
    off()
    theme.setPreference('light')
    expect(seen).toEqual([['dark', 'dark'], ['light', 'system']])
  })

  it('falls back to the session choice when storage throws', () => {
    const original = globalThis.localStorage
    globalThis.localStorage = {
      getItem: () => { throw new Error('blocked') },
      setItem: () => { throw new Error('blocked') },
    }
    // Storage refuses to persist it...
    expect(theme.setPreference('dark')).toBe('dark')
    // ...but the choice still applies for this session rather than snapping back.
    expect(theme.getPreference()).toBe('dark')
    expect(theme.setPreference('light')).toBe('light')
    expect(theme.getPreference()).toBe('light')
    globalThis.localStorage = original
  })

  it('exposes exactly the three supported preferences', () => {
    expect(theme.themePreferences).toEqual(['light', 'dark', 'system'])
  })
})
