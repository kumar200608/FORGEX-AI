import React from 'react';

export default function MetricCard({ label, value, subtext, color = 'default' }) {
  let valColor = '#ffffff';
  if (color === 'green') valColor = 'var(--color-allow)';
  if (color === 'red') valColor = 'var(--color-block)';
  if (color === 'cyan') valColor = 'var(--accent-cyan)';

  return (
    <div className="metric-card">
      <span className="metric-label">{label}</span>
      <span className="metric-value" style={{ color: valColor }}>{value}</span>
      {subtext && <span className="metric-sub">{subtext}</span>}
    </div>
  );
}
