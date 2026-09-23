import React from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Radio, 
  Fingerprint, 
  Gauge, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle,
  FileText
} from 'lucide-react';

export default function SecurityResult({ result }) {
  if (!result) return null;

  const { trust, taint, injection, risk, policy } = result;

  const trustLevel = trust?.trust_level || 'UNKNOWN';
  const isTainted = taint?.tainted;
  const injectionDetected = injection?.injection_detected;
  const riskScore = risk?.risk_score ?? 0;
  const riskLevel = risk?.risk_level || 'LOW';
  const decision = policy?.decision || 'ALLOW';

  return (
    <div className="inspection-grid">
      {/* 1. TRUST CHECK CARD */}
      <div className="inspect-card">
        <div className="inspect-header">
          <span className="inspect-title">
            <ShieldCheck size={16} />
            1. Trust Check
          </span>
          <span className={`inspect-badge ${trustLevel.toLowerCase()}`}>
            {trustLevel}
          </span>
        </div>
        <div className="inspect-body">
          <div className="inspect-metric-row">
            <span className="inspect-metric-label">Source Identity:</span>
            <span className="inspect-metric-val">{trust?.source || 'N/A'}</span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
            {trust?.reason || 'Source trust evaluation completed.'}
          </p>
        </div>
      </div>

      {/* 2. TAINT TRACKER CARD */}
      <div className="inspect-card">
        <div className="inspect-header">
          <span className="inspect-title">
            <Radio size={16} />
            2. Taint Tracker
          </span>
          <span
            className="inspect-badge"
            style={{
              background: isTainted ? 'var(--color-confirm-bg)' : 'var(--color-allow-bg)',
              color: isTainted ? 'var(--color-confirm)' : 'var(--color-allow)',
              border: `1px solid ${isTainted ? 'var(--color-confirm-border)' : 'var(--color-allow-border)'}`
            }}
          >
            {isTainted ? 'TAINTED' : 'NOT TAINTED'}
          </span>
        </div>
        <div className="inspect-body">
          <div className="inspect-metric-row">
            <span className="inspect-metric-label">Taint Source:</span>
            <span className="inspect-metric-val">{taint?.taint_source || 'None (Clean)'}</span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
            {taint?.reason || 'Data provenance analyzed.'}
          </p>
        </div>
      </div>

      {/* 3. INJECTION DETECTION CARD */}
      <div className="inspect-card">
        <div className="inspect-header">
          <span className="inspect-title">
            <Fingerprint size={16} />
            3. Injection Detection
          </span>
          <span
            className="inspect-badge"
            style={{
              background: injectionDetected ? 'var(--color-block-bg)' : 'var(--color-allow-bg)',
              color: injectionDetected ? 'var(--color-block)' : 'var(--color-allow)',
              border: `1px solid ${injectionDetected ? 'var(--color-block-border)' : 'var(--color-allow-border)'}`
            }}
          >
            {injectionDetected ? 'DETECTED' : 'NOT DETECTED'}
          </span>
        </div>
        <div className="inspect-body">
          <div className="inspect-metric-row">
            <span className="inspect-metric-label">Detection Confidence:</span>
            <span className="inspect-metric-val">
              {Math.round((injection?.confidence ?? 0) * 100)}%
            </span>
          </div>
          {injection?.reasons && injection.reasons.length > 0 ? (
            <div>
              <span className="inspect-metric-label" style={{ fontSize: '0.75rem' }}>
                Flagged Injection Patterns:
              </span>
              <div className="tag-list">
                {injection.reasons.map((pattern, idx) => (
                  <span key={idx} className="tag-item">
                    "{pattern}"
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
              No adversarial instruction override patterns detected in source.
            </p>
          )}
        </div>
      </div>

      {/* 4. RISK ASSESSMENT CARD */}
      <div className="inspect-card">
        <div className="inspect-header">
          <span className="inspect-title">
            <Gauge size={16} />
            4. Risk Score Engine
          </span>
          <span
            className="inspect-badge"
            style={{
              background:
                riskLevel === 'HIGH'
                  ? 'var(--color-block-bg)'
                  : riskLevel === 'MEDIUM'
                  ? 'var(--color-confirm-bg)'
                  : 'var(--color-allow-bg)',
              color:
                riskLevel === 'HIGH'
                  ? 'var(--color-block)'
                  : riskLevel === 'MEDIUM'
                  ? 'var(--color-confirm)'
                  : 'var(--color-allow)',
            }}
          >
            {riskLevel} RISK ({riskScore}/100)
          </span>
        </div>
        <div className="inspect-body">
          <div className="risk-bar-container">
            <div
              className={`risk-bar-fill ${riskLevel.toLowerCase()}`}
              style={{ width: `${Math.min(100, Math.max(5, riskScore))}%` }}
            />
          </div>
          {risk?.reasons && risk.reasons.length > 0 ? (
            <ul style={{ paddingLeft: '16px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              {risk.reasons.map((r, idx) => (
                <li key={idx}>{r}</li>
              ))}
            </ul>
          ) : (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
              Standard operational risk levels.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
