import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, HelpCircle } from 'lucide-react';

export default function DecisionBadge({ decision, size = 'normal' }) {
  const norm = (decision || '').toUpperCase();

  if (norm === 'ALLOW') {
    return (
      <span className={`badge badge-allow ${size === 'lg' ? 'badge-lg' : ''}`}>
        <CheckCircle2 size={size === 'lg' ? 16 : 12} />
        <span>ALLOW</span>
      </span>
    );
  }

  if (norm === 'BLOCK') {
    return (
      <span className={`badge badge-block ${size === 'lg' ? 'badge-lg' : ''}`}>
        <XCircle size={size === 'lg' ? 16 : 12} />
        <span>BLOCK</span>
      </span>
    );
  }

  if (norm === 'ASK_USER' || norm === 'ASK USER') {
    return (
      <span className={`badge badge-ask ${size === 'lg' ? 'badge-lg' : ''}`}>
        <AlertTriangle size={size === 'lg' ? 16 : 12} />
        <span>ASK USER</span>
      </span>
    );
  }

  return (
    <span className="badge badge-muted">
      <HelpCircle size={12} />
      <span>{decision || 'PENDING'}</span>
    </span>
  );
}
