import React from 'react';
import { ShieldAlert, CheckCircle, AlertTriangle, ShieldX } from 'lucide-react';

export default function SummaryCards({ logs = [] }) {
  const totalEvents = logs.length;
  const allowedCount = logs.filter(
    (log) => (log.decision || '').toUpperCase() === 'ALLOW'
  ).length;
  const confirmCount = logs.filter(
    (log) => (log.decision || '').toUpperCase() === 'CONFIRM'
  ).length;
  const blockedCount = logs.filter(
    (log) => (log.decision || '').toUpperCase() === 'BLOCK'
  ).length;

  return (
    <div className="summary-grid">
      <div className="summary-card total">
        <div className="summary-info">
          <span className="summary-label">Total Security Events</span>
          <span className="summary-value">{totalEvents}</span>
          <span className="summary-subtext">Processed by TrustGuard</span>
        </div>
        <div className="summary-icon-box">
          <ShieldAlert size={22} />
        </div>
      </div>

      <div className="summary-card allowed">
        <div className="summary-info">
          <span className="summary-label">Allowed</span>
          <span className="summary-value">{allowedCount}</span>
          <span className="summary-subtext">Clean & verified safe</span>
        </div>
        <div className="summary-icon-box">
          <CheckCircle size={22} />
        </div>
      </div>

      <div className="summary-card confirm">
        <div className="summary-info">
          <span className="summary-label">Confirmation Required</span>
          <span className="summary-value">{confirmCount}</span>
          <span className="summary-subtext">Medium risk human approval</span>
        </div>
        <div className="summary-icon-box">
          <AlertTriangle size={22} />
        </div>
      </div>

      <div className="summary-card blocked">
        <div className="summary-info">
          <span className="summary-label">Blocked</span>
          <span className="summary-value">{blockedCount}</span>
          <span className="summary-subtext">High risk injection attempts</span>
        </div>
        <div className="summary-icon-box">
          <ShieldX size={22} />
        </div>
      </div>
    </div>
  );
}
