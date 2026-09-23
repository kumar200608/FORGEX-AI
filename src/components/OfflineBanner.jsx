import { useAdaptive } from '../adaptive/AdaptiveProvider.jsx'

export default function OfflineBanner() {
  const { online, mode } = useAdaptive()
  if (online) return null
  return (
    <div className="offline-banner" role="status" data-testid="offline-banner">
      <b>You're offline.</b> Serving the core experience from cache — no blank screen, no dead app.
      {mode === 'OFFLINE' && <span className="offline-hint"> Images already cached stay available.</span>}
    </div>
  )
}
