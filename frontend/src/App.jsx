import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import SummaryCards from './components/SummaryCards';
import SecurityPipeline from './components/SecurityPipeline';
import SecurityCheckForm from './components/SecurityCheckForm';
import SecurityResult from './components/SecurityResult';
import ConfirmationModal from './components/ConfirmationModal';
import ActionBanner from './components/ActionBanner';
import AuditLogTable from './components/AuditLogTable';
import { checkHealth, fetchAuditLogs, runSecurityCheck } from './api/trustguardApi';
import { Shield, AlertCircle, Info, Lock } from 'lucide-react';

export default function App() {
  const [backendOnline, setBackendOnline] = useState(true);
  const [checkingHealth, setCheckingHealth] = useState(false);
  const [healthError, setHealthError] = useState(null);

  const [auditLogs, setAuditLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [securityResult, setSecurityResult] = useState(null);
  const [formError, setFormError] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    action: 'SEND_EMAIL',
    recipient: 'finance-director@company.com',
    subject: 'Quarterly Financial Statement Summary',
    body: 'Please find attached the approved quarterly balance sheet and ledger numbers.',
    source: 'user',
    source_content: 'Official approved report provided during internal board review.',
    user_instruction: 'Dispatch the financial overview to the finance director.',
  });

  // Health check worker
  const performHealthCheck = useCallback(async () => {
    setCheckingHealth(true);
    const res = await checkHealth();
    setBackendOnline(res.online);
    if (!res.online) {
      setHealthError(res.error);
    } else {
      setHealthError(null);
    }
    setCheckingHealth(false);
  }, []);

  // Fetch audit logs
  const loadAuditLogs = useCallback(async () => {
    setLoadingLogs(true);
    const res = await fetchAuditLogs();
    if (res.success) {
      setAuditLogs(res.logs);
    }
    setLoadingLogs(false);
  }, []);

  // Initial load & heartbeat interval
  useEffect(() => {
    performHealthCheck();
    loadAuditLogs();

    const healthInterval = setInterval(() => {
      performHealthCheck();
    }, 15000);

    return () => clearInterval(healthInterval);
  }, [performHealthCheck, loadAuditLogs]);

  // Handle Form Submit
  const handleSecurityCheck = async (e) => {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);

    const res = await runSecurityCheck(formData);
    setIsSubmitting(false);

    if (res.success) {
      setSecurityResult(res.data);
      // Automatically refresh audit logs to reflect newly created audit record
      loadAuditLogs();
    } else {
      setFormError(res.error || 'Failed to complete security check');
      // If error might be network failure, recheck health
      performHealthCheck();
    }
  };

  // Handle resolution of a confirmation (Approve or Reject)
  const handleConfirmationResolved = (resolutionData) => {
    // Refresh audit logs
    loadAuditLogs();
  };

  return (
    <div className="app-container">
      {/* 1. Header with Live Health Indicator */}
      <Header
        backendOnline={backendOnline}
        checkingHealth={checkingHealth}
        onRefreshHealth={performHealthCheck}
      />

      {/* Backend Offline Warning Banner */}
      {!backendOnline && (
        <div className="alert-banner error">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertCircle size={20} />
            <span>
              <strong>Backend Offline:</strong> Cannot connect to TrustGuard at <code>http://127.0.0.1:8000</code>. Please ensure the backend is running.
            </span>
          </div>
          <button
            type="button"
            className="filter-btn"
            onClick={performHealthCheck}
            disabled={checkingHealth}
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* 8. Dashboard Summary Cards */}
      <SummaryCards logs={auditLogs} />

      {/* 9. Visual Security Pipeline Component */}
      <SecurityPipeline
        lastResult={securityResult}
        isChecking={isSubmitting}
      />

      {/* Main Form & Results Workspace */}
      <div className="main-grid">
        {/* Left: Security Check Panel */}
        <SecurityCheckForm
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleSecurityCheck}
          isSubmitting={isSubmitting}
        />

        {/* Right: Results / Inspections Panel */}
        <div className="results-panel">
          {formError && (
            <div className="alert-banner error">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={18} />
                <span>{formError}</span>
              </div>
            </div>
          )}

          {!securityResult ? (
            <div className="empty-state">
              <div className="empty-icon">
                <Shield size={32} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Awaiting Security Inspection
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px', maxWidth: '420px' }}>
                  Select a test scenario or customize your action payload, then click <strong>"Run Security Check"</strong> to run it through the TrustGuard firewall.
                </p>
              </div>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                fontSize: '0.75rem', 
                color: 'var(--text-muted)',
                background: 'var(--bg-surface)',
                padding: '6px 14px',
                borderRadius: '6px'
              }}>
                <Lock size={12} style={{ color: 'var(--accent-cyan)' }} />
                <span>Zero Direct Tool Invocation • Strict Isolation Guarantees</span>
              </div>
            </div>
          ) : (
            <>
              {/* Verdict Result Banner */}
              <div className={`verdict-banner ${securityResult.policy?.decision?.toLowerCase()}`}>
                <div className="verdict-left">
                  <div className="verdict-icon">
                    <Shield size={24} />
                  </div>
                  <div>
                    <h3 className="verdict-title">
                      Policy Verdict: {securityResult.policy?.decision}
                    </h3>
                    <p className="verdict-desc">
                      {securityResult.policy?.reason}
                    </p>
                  </div>
                </div>
                <span className="verdict-tag" style={{
                  background: 'var(--bg-surface)',
                  color: 'var(--text-primary)'
                }}>
                  {securityResult.risk?.risk_level} RISK
                </span>
              </div>

              {/* 4. Confirmation UI if decision === "CONFIRM" */}
              {securityResult.policy?.decision === 'CONFIRM' && (
                <ConfirmationModal
                  result={securityResult}
                  requestId={securityResult.request_id}
                  requestInfo={formData}
                  onResolved={handleConfirmationResolved}
                />
              )}

              {/* 5. BLOCK UI or 6. ALLOW UI */}
              <ActionBanner result={securityResult} />

              {/* 3. Detailed Security Result Cards (Trust, Taint, Injection, Risk) */}
              <SecurityResult result={securityResult} />
            </>
          )}
        </div>
      </div>

      {/* 7. Audit Log Dashboard Table */}
      <AuditLogTable
        logs={auditLogs}
        isLoading={loadingLogs}
        onRefresh={loadAuditLogs}
      />
    </div>
  );
}
