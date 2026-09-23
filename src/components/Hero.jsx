import { useAdaptive } from '../adaptive/AdaptiveProvider.jsx'

export default function Hero({ onOpenDashboard }) {
  const { mode, budget, decision } = useAdaptive()
  const steps = [
    ['01', 'Detect', 'network + device signals'],
    ['02', 'Decide', `one score → ${mode.toLowerCase()} budget`],
    ['03', 'Optimize', `${budget.imageTier} images · ${budget.jsLevel} JS`],
    ['04', 'Deliver', `prefetch: ${budget.prefetch}`],
  ]
  return (
    <section className="hero">
      <div className="hero-copy">
        <p className="eyebrow">Hackathon 2026 · Web Performance track</p>
        <h1>Delivery that adapts to your network and device.</h1>
        <p className="hero-sub">
          A 5G laptop and a 3G phone don't have the same capabilities — so this app
          doesn't send them the same payload. It detects, decides, optimizes, delivers.
        </p>
        <p className="hero-live">
          Right now you're getting <b>{mode}</b> delivery
          {decision.linkScore != null && <> — profile score <b>{decision.totalScore}/105</b></>}.
        </p>
        {/* The hero's primary action: the dashboard this page keeps referring to,
            reachable without scrolling past the fold. */}
        <div className="hero-cta">
          <button className="btn primary" onClick={onOpenDashboard}>Open the dashboard</button>
        </div>
      </div>
      <div className="hero-steps">
        {steps.map(([n, name, detail]) => (
          <div className="step" key={n}>
            <span className="step-n">{n}</span>
            <span className="step-name">{name}</span>
            <span className="step-detail">{detail}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
