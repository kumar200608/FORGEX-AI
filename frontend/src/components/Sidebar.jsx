import React from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, 
  Activity, 
  Zap, 
  CheckSquare, 
  Building2, 
  Clock, 
  Layers, 
  UploadCloud,
  Lock,
  Flame,
  FileCheck
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab }) {
  const navItems = [
    { id: 'dashboard', label: 'Command Center', icon: Activity, badge: 'OVERVIEW' },
    { id: 'live-security', label: 'Live Security', icon: Shield, badge: 'MAIN DEMO' },
    { id: 'universal-scanner', label: 'Universal Scanner', icon: UploadCloud, badge: '10 FORMATS' },
    { id: 'attack-playground', label: 'Attack Playground', icon: Zap, badge: '25 SCENARIOS' },
    { id: 'evaluation', label: 'Evaluation', icon: CheckSquare, badge: 'BENCHMARK' },
    { id: 'vendor-trust', label: 'Vendor Trust', icon: Building2 },
    { id: 'audit-trail', label: 'Audit Trail', icon: Clock },
    { id: 'architecture', label: 'Architecture', icon: Layers },
  ];

  return (
    <aside className="sidebar">
      <div>
        {/* Brand Header */}
        <div className="sidebar-header">
          <div className="brand-row">
            <div className="brand-icon-wrap">
              <Shield size={22} />
            </div>
            <div>
              <div className="brand-title">TRACEGUARD AI</div>
              <div className="brand-subtitle">Explainable Action Firewall</div>
            </div>
          </div>
          <div className="brand-tagline">
            Zero-Trust Runtime Guardrail for tool-using AI agents & real-world integrations.
          </div>
        </div>

        {/* Navigation List */}
        <nav className="sidebar-nav">
          <div className="nav-section-title">Security Navigation</div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id || (item.id === 'live-security' && activeTab === 'action-firewall');
            
            return (
              <button
                key={item.id}
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => setActiveTab(item.id)}
              >
                <Icon size={16} className="nav-icon" />
                <span style={{ flex: 1 }}>{item.label}</span>
                {item.badge && (
                  <span 
                    style={{
                      fontSize: '9.5px',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      background: isActive ? 'rgba(6, 182, 212, 0.22)' : 'rgba(255, 255, 255, 0.05)',
                      color: isActive ? 'var(--accent-cyan-light)' : 'var(--text-muted)',
                      fontWeight: 700,
                      letterSpacing: '0.04em'
                    }}
                  >
                    {item.badge}
                  </span>
                )}
                {isActive && (
                  <motion.div 
                    layoutId="active-nav-glow"
                    style={{
                      position: 'absolute',
                      right: 0,
                      top: '20%',
                      bottom: '20%',
                      width: '3px',
                      backgroundColor: 'var(--accent-cyan)',
                      borderRadius: '2px',
                      boxShadow: '0 0 10px var(--accent-cyan)'
                    }}
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Protection Status */}
      <div className="sidebar-footer">
        <div className="protection-status-card">
          <div className="status-indicator-dot pulse" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--color-allow)', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Lock size={12} /> FIREWALL ENFORCING
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Zero-Trust Tool Isolation Active
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
