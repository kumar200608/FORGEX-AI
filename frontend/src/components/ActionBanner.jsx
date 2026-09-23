import React from 'react';
import { ShieldX, CheckCircle2, AlertOctagon, MailCheck, Ban } from 'lucide-react';

export default function ActionBanner({ result }) {
  if (!result || !result.policy) return null;

  const decision = result.policy?.decision?.toUpperCase();
  const risk = result.risk || {};
  const injection = result.injection || {};
  const policy = result.policy || {};
  const email = result.email;

  if (decision === 'BLOCK') {
    return (
      <div className="execution-card blocked">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              background: 'var(--color-block)',
              color: '#ffffff',
              padding: '10px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <ShieldX size={28} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-block)' }}>
                Request Blocked
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#fca5a5' }}>
                High-risk prompt injection attempt neutralized. Tool invocation aborted.
              </p>
            </div>
          </div>

          <div style={{
            background: 'rgba(239, 68, 68, 0.2)',
            border: '1px solid var(--color-block)',
            color: 'var(--color-block)',
            padding: '4px 12px',
            borderRadius: '6px',
            fontWeight: 800,
            fontFamily: 'var(--font-mono)',
            fontSize: '0.85rem'
          }}>
            SECURITY ENFORCED
          </div>
        </div>

        <div className="confirm-details-table" style={{ background: 'rgba(239, 68, 68, 0.05)' }}>
          <div className="confirm-row">
            <span className="confirm-label">Risk Level:</span>
            <span className="confirm-val" style={{ color: 'var(--color-block)' }}>
              {risk.risk_level || 'HIGH'}
            </span>
          </div>
          <div className="confirm-row">
            <span className="confirm-label">Risk Score:</span>
            <span className="confirm-val">{risk.risk_score} / 100</span>
          </div>
          <div className="confirm-row">
            <span className="confirm-label">Prompt Injection Detected:</span>
            <span className="confirm-val" style={{ color: 'var(--color-block)' }}>
              {injection.injection_detected ? 'YES (High Confidence)' : 'NO'}
            </span>
          </div>
          <div className="confirm-row">
            <span className="confirm-label">Policy Reason:</span>
            <span className="confirm-val" style={{ maxWidth: '65%', textAlign: 'right' }}>
              {policy.reason || 'High-risk request blocked by security policy.'}
            </span>
          </div>
          <div className="confirm-row">
            <span className="confirm-label">Email Tool State:</span>
            <span className="confirm-val" style={{ color: 'var(--color-block)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Ban size={14} />
              NOT EXECUTED (Tool execution suppressed)
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (decision === 'ALLOW') {
    return (
      <div className="execution-card allowed">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              background: 'var(--color-allow)',
              color: '#070a12',
              padding: '10px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <CheckCircle2 size={28} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-allow)' }}>
                Request Allowed
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#6ee7b7' }}>
                Safe trusted input verified. Sensitive action successfully dispatched.
              </p>
            </div>
          </div>

          <div style={{
            background: 'var(--color-allow-bg)',
            border: '1px solid var(--color-allow-border)',
            color: 'var(--color-allow)',
            padding: '4px 12px',
            borderRadius: '6px',
            fontWeight: 800,
            fontFamily: 'var(--font-mono)',
            fontSize: '0.85rem'
          }}>
            SAFE
          </div>
        </div>

        {email ? (
          <div>
            <span className="inspect-metric-label" style={{ fontSize: '0.78rem', marginBottom: '4px', display: 'block' }}>
              Backend Email Tool Telemetry:
            </span>
            <div className="code-box">
              <div><strong>Status:</strong> {email.status}</div>
              <div><strong>To:</strong> {email.recipient}</div>
              <div><strong>Subject:</strong> {email.subject}</div>
              <div><strong>Output:</strong> {email.message}</div>
            </div>
          </div>
        ) : (
          <div className="code-box">
            Email tool execution simulated successfully.
          </div>
        )}
      </div>
    );
  }

  return null;
}
