import { useEffect, useState } from 'react'
import { getPreference, setPreference, subscribe, themePreferences } from '../theme.js'

const LABEL = { light: 'Light', dark: 'Dark', system: 'Auto' }

const ICONS = {
  light: (
    <svg viewBox="0 0 20 20" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <circle cx="10" cy="10" r="3.6" />
      <path d="M10 1.8v2M10 16.2v2M1.8 10h2M16.2 10h2M4.2 4.2l1.4 1.4M14.4 14.4l1.4 1.4M15.8 4.2l-1.4 1.4M5.6 14.4l-1.4 1.4" />
    </svg>
  ),
  dark: (
    <svg viewBox="0 0 20 20" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16.5 12.4A6.9 6.9 0 0 1 7.6 3.5a6.9 6.9 0 1 0 8.9 8.9Z" />
    </svg>
  ),
  system: (
    <svg viewBox="0 0 20 20" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <circle cx="10" cy="10" r="7" />
      <path d="M10 3v14" />
      <path d="M10 3a7 7 0 0 1 0 14Z" fill="currentColor" stroke="none" />
    </svg>
  ),
}

// Three explicit states in one control, rather than a toggle that hides which
// state you are in: "auto" is a real choice and has to be visible as one.
export default function ThemeToggle() {
  const [preference, setLocal] = useState(getPreference)

  useEffect(() => subscribe((_theme, next) => setLocal(next)), [])

  return (
    <div className="seg theme-seg" role="group" aria-label="Colour theme">
      {themePreferences.map((key) => (
        <button
          key={key}
          type="button"
          className={`seg-btn${preference === key ? ' active' : ''}`}
          aria-pressed={preference === key}
          aria-label={`${LABEL[key]} theme`}
          title={`${LABEL[key]} theme`}
          onClick={() => setPreference(key)}
          data-testid={`theme-${key}`}
        >
          {ICONS[key]}
        </button>
      ))}
    </div>
  )
}
