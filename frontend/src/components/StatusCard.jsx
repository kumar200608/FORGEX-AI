import React from 'react';

export default function StatusCard({ icon: Icon, label, value, status = 'active', subtext }) {
  return (
    <div className="status-card">
      <div className="status-card-icon">
        <Icon size={20} />
      </div>
      <div className="status-card-info">
        <span className="status-card-label">{label}</span>
        <span className="status-card-val">{value}</span>
        {subtext && <span style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '2px' }}>{subtext}</span>}
      </div>
    </div>
  );
}
