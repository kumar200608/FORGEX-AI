import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Activity, 
  RotateCcw, 
  Terminal, 
  Zap,
  Lock,
  ExternalLink
} from 'lucide-react';
import { api } from '../services/api';

export default function Topbar({ title, isOnline, onResetDemo, onNavigate }) {
  const [latency, setLatency] = useState(12);

  useEffect(() => {
    const probe = async () => {
      const start = performance.now();
      try {
        await api.getHealth();
        const end = performance.now();
        setLatency(Math.round(end - start));
      } catch (e) {
        setLatency(null);
      }
    };
    probe();
    const interval = setInterval(probe, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="topbar">
      <div className="topbar-title-section">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div 
            style={{ 
              width: '8px', 
              height: '8px', 
              borderRadius: '50%', 
              background: 'var(--accent-cyan)',
              boxShadow: '0 0 10px var(--accent-cyan)'
            }} 
          />
          <span className="topbar-title">{title}</span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {/* Backend Heartbeat & Telemetry */}
        <div 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px', 
            padding: '5px 12px', 
            borderRadius: 'var(--radius-full)', 
            background: isOnline ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            border: isOnline ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
            fontSize: '11.5px',
            fontWeight: 700
          }}
        >
          <span 
            style={{ 
              width: '7px', 
              height: '7px', 
              borderRadius: '50%', 
              backgroundColor: isOnline ? 'var(--allow)' : 'var(--block)',
              boxShadow: isOnline ? '0 0 8px var(--allow)' : '0 0 8px var(--block)'
            }} 
          />
          <span style={{ color: isOnline ? 'var(--allow)' : 'var(--block)', letterSpacing: '0.04em' }}>
            {isOnline ? 'BACKEND ONLINE' : 'DISCONNECTED'}
          </span>
          {latency !== null && isOnline && (
            <span className="font-mono" style={{ color: 'var(--text-muted)', fontSize: '10.5px' }}>
              ({latency}ms)
            </span>
          )}
        </div>

        {/* Quick Demo Reset */}
        {onResetDemo && (
          <button 
            className="btn-secondary" 
            style={{ fontSize: '12px', padding: '6px 12px' }}
            onClick={onResetDemo}
            title="Switch to Live Security with clean baseline"
          >
            <RotateCcw size={13} />
            <span>Reset Demo</span>
          </button>
        )}
      </div>
    </header>
  );
}
