import React from 'react';
import { Shield, RefreshCw, CheckCircle2, AlertOctagon, Terminal } from 'lucide-react';

export default function Header({ backendOnline, checkingHealth, onRefreshHealth }) {
  return (
    <header className="soc-header">
      <div className="brand-section">
        <div className="brand-icon-wrapper">
          <Shield size={28} strokeWidth={2.2} />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 className="brand-title">TrustGuard</h1>
            <span className="brand-tag">SOC FIREWALL</span>
          </div>
          <p className="brand-subtitle">
            <Terminal size={12} />
            Indirect Prompt Injection Firewall
          </p>
        </div>
      </div>

      <div className="header-status-group">
        <div
          className={`status-badge ${backendOnline ? 'online' : 'offline'}`}
          title={backendOnline ? 'FastAPI Backend is reachable at http://127.0.0.1:8000' : 'Cannot reach backend at http://127.0.0.1:8000'}
        >
          <span className={`status-dot ${backendOnline ? 'online' : 'offline'}`} />
          <span>{backendOnline ? 'Backend Online' : 'Backend Offline'}</span>
        </div>

        <button
          className="btn-icon"
          onClick={onRefreshHealth}
          disabled={checkingHealth}
          title="Recheck Backend Health"
        >
          <RefreshCw size={16} className={checkingHealth ? 'spin' : ''} />
        </button>
      </div>
    </header>
  );
}
