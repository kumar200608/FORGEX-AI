import React, { useState } from 'react';
import { AlertTriangle, Check, X, ShieldAlert, CheckCircle2, ShieldX, Loader2 } from 'lucide-react';
import { confirmSecurityRequest } from '../api/trustguardApi';

export default function ConfirmationModal({ 
  result, 
  requestId, 
  requestInfo,
  onResolved 
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resolution, setResolution] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  if (!result || result.policy?.decision !== 'CONFIRM') return null;

  const risk = result.risk || {};
  const policy = result.policy || {};

  const handleDecision = async (approved) => {
    setIsSubmitting(true);
    setErrorMsg(null);

    const activeRequestId = requestId || result.request_id;
    if (!activeRequestId) {
      setErrorMsg('No pending request ID found to confirm.');
      setIsSubmitting(false);
      return;
    }

    const res = await confirmSecurityRequest(activeRequestId, approved);
    setIsSubmitting(false);

    if (res.success) {
      setResolution(res.data);
      if (onResolved) {
        onResolved(res.data);
      }
    } else {
      setErrorMsg(res.error || 'Failed to submit confirmation');
    }
  };

  return (
    <div className="confirm-box">
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ 
          background: 'rgba(245, 158, 11, 0.2)', 
          color: 'var(--color-confirm)', 
          padding: '8px', 
          borderRadius: '8px' 
        }}>
          <AlertTriangle size={24} />
        </div>
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-confirm)' }}>
            Security Confirmation Required
          </h3>
          <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
            This sensitive operation was triggered by an untrusted or tainted source and requires explicit human verification.
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="alert-banner error">
          <span>{errorMsg}</span>
        </div>
      )}

      {resolution ? (
        <div style={{
          background: resolution.status === 'approved' ? 'var(--color-allow-bg)' : 'var(--color-block-bg)',
          border: `1px solid ${resolution.status === 'approved' ? 'var(--color-allow-border)' : 'var(--color-block-border)'}`,
          padding: '16px',
          borderRadius: '8px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700,
            color: resolution.status === 'approved' ? 'var(--color-allow)' : 'var(--color-block)' }}>
            {resolution.status === 'approved' ? <CheckCircle2 size={20} /> : <ShieldX size={20} />}
            <span>Decision Recorded: {resolution.status?.toUpperCase()}</span>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
            {resolution.message}
          </p>
          {resolution.email && (
            <div className="code-box" style={{ marginTop: '6px' }}>
              <strong>Execution Telemetry:</strong><br />
              Status: {resolution.email.status}<br />
              To: {resolution.email.recipient}<br />
              Subject: {resolution.email.subject}<br />
              Message: {resolution.email.message}
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="confirm-details-table">
            <div className="confirm-row">
              <span className="confirm-label">Target Recipient:</span>
              <span className="confirm-val">{requestInfo?.recipient || result.email?.recipient || 'N/A'}</span>
            </div>
            <div className="confirm-row">
              <span className="confirm-label">Action Subject:</span>
              <span className="confirm-val">{requestInfo?.subject || result.email?.subject || 'Action Request'}</span>
            </div>
            {requestInfo?.body && (
              <div className="confirm-row">
                <span className="confirm-label">Body Preview:</span>
                <span className="confirm-val" style={{ maxWidth: '65%', textAlign: 'right', fontStyle: 'italic', fontSize: '0.8rem' }}>
                  {requestInfo.body.length > 50 ? `${requestInfo.body.substring(0, 50)}...` : requestInfo.body}
                </span>
              </div>
            )}
            <div className="confirm-row">
              <span className="confirm-label">Calculated Risk Level:</span>
              <span className="confirm-val" style={{ color: 'var(--color-confirm)' }}>
                {risk.risk_level || 'MEDIUM'}
              </span>
            </div>
            <div className="confirm-row">
              <span className="confirm-label">Calculated Risk Score:</span>
              <span className="confirm-val">{risk.risk_score || 60} / 100</span>
            </div>
            <div className="confirm-row">
              <span className="confirm-label">Policy Reason:</span>
              <span className="confirm-val" style={{ textAlign: 'right', maxWidth: '60%' }}>
                {policy.reason || 'Medium-risk request requires human verification before tool dispatch.'}
              </span>
            </div>
            <div className="confirm-row">
              <span className="confirm-label">Request ID:</span>
              <span className="confirm-val" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {requestId || result.request_id || 'N/A'}
              </span>
            </div>
          </div>

          <div className="confirm-actions">
            <button
              type="button"
              className="btn-approve"
              disabled={isSubmitting}
              onClick={() => handleDecision(true)}
            >
              <Check size={18} strokeWidth={3} />
              Approve & Dispatch Tool
            </button>
            <button
              type="button"
              className="btn-reject"
              disabled={isSubmitting}
              onClick={() => handleDecision(false)}
            >
              <X size={18} strokeWidth={3} />
              Reject & Abort
            </button>
          </div>
        </>
      )}
    </div>
  );
}
