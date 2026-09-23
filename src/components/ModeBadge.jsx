const MODE_META = {
  FULL: { label: 'FULL', hint: 'high images · all features', cls: 'badge-full' },
  LIGHT: { label: 'LIGHT', hint: 'mid images · reduced features', cls: 'badge-light' },
  'DATA SAVER': { label: 'DATA SAVER', hint: 'low images · heavy features off', cls: 'badge-saver' },
  OFFLINE: { label: 'OFFLINE', hint: 'serving from cache', cls: 'badge-offline' },
}

export default function ModeBadge({ mode, compact = false }) {
  const meta = MODE_META[mode] || MODE_META.FULL
  return (
    <span className={`mode-badge ${meta.cls}`} title={`Delivery mode: ${meta.label} — ${meta.hint}`}>
      <span className="mode-dot" aria-hidden="true" />
      {meta.label}
      {!compact && <span className="mode-hint">{meta.hint}</span>}
    </span>
  )
}
