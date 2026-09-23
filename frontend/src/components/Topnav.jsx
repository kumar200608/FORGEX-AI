import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  RotateCcw,
  Menu,
  X
} from 'lucide-react';
import { api } from '../services/api';

export default function Topnav({ activeTab, setActiveTab, isOnline, onResetDemo }) {
  const [latency, setLatency] = useState(12);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Periodic latency probe
  useEffect(() => {
    let isMounted = true;
    const probe = async () => {
      const start = performance.now();
      try {
        await api.getHealth();
        if (isMounted) {
          const end = performance.now();
          setLatency(Math.round(end - start));
        }
      } catch (e) {
        if (isMounted) setLatency(null);
      }
    };
    probe();
    const interval = setInterval(probe, 15000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const navItems = [
    { id: 'dashboard', label: 'Command Center', icon: Activity },
    { id: 'live-security', label: 'Live Security', icon: Shield },
    { id: 'universal-scanner', label: 'Universal Scanner', icon: UploadCloud },
    { id: 'attack-playground', label: 'Attack Playground', icon: Zap },
    { id: 'evaluation', label: 'Evaluation', icon: CheckSquare },
    { id: 'vendor-trust', label: 'Vendor Trust', icon: Building2 },
    { id: 'audit-trail', label: 'Audit Trail', icon: Clock },
    { id: 'architecture', label: 'Architecture', icon: Layers },
  ];

  const handleNavClick = (id) => {
    setActiveTab(id);
    setMobileMenuOpen(false);
  };

  return (
    <header className="topnav-header">
      {/* Primary Top Navigation Bar */}
      <div className="topnav-main">
        <div className="topnav-container">
          {/* Left Brand Area */}
          <div 
            className="topnav-brand"
            onClick={() => handleNavClick('dashboard')}
            role="button"
            tabIndex={0}
          >
            <div className="topnav-brand-icon">
              <Shield size={20} className="shield-icon" />
              <div className="brand-glow-fx" />
            </div>
            <div className="topnav-brand-text">
              <div className="topnav-brand-title">
                <span>TRACEGUARD</span>
                <span className="brand-title-accent"> AI</span>
              </div>
              <div className="topnav-brand-subtitle">
                EXPLAINABLE ACTION FIREWALL
              </div>
            </div>
          </div>

          {/* Desktop Center Navigation Links */}
          <nav className="topnav-nav-links" aria-label="Main Navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id || (item.id === 'live-security' && activeTab === 'action-firewall');

              return (
                <button
                  key={item.id}
                  className={`topnav-link ${isActive ? 'active' : ''}`}
                  onClick={() => handleNavClick(item.id)}
                  type="button"
                >
                  <Icon size={14} className="topnav-link-icon" />
                  <span className="topnav-link-label">{item.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="topnav-active-indicator"
                      className="topnav-link-indicator"
                      transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                    />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Action / Status Area */}
          <div className="topnav-actions">
            {/* Backend Online Status Badge */}
            <div 
              className={`topnav-status-badge ${isOnline ? 'online' : 'offline'}`}
              title={isOnline ? `Backend connected (${latency !== null ? `${latency}ms latency` : 'healthy'})` : 'Backend disconnected'}
            >
              <span className="status-ping-dot" />
              <span className="status-text">
                {isOnline ? 'BACKEND ONLINE' : 'OFFLINE'}
              </span>
              {latency !== null && isOnline && (
                <span className="status-latency font-mono">
                  ({latency}ms)
                </span>
              )}
            </div>

            {/* Reset Demo Button */}
            {onResetDemo && (
              <button
                className="topnav-reset-btn"
                onClick={onResetDemo}
                type="button"
                title="Reset to clean baseline & Live Security"
              >
                <RotateCcw size={12} className="reset-icon" />
                <span className="reset-label">Reset Demo</span>
              </button>
            )}

            {/* Mobile Hamburger Toggle */}
            <button
              className="topnav-mobile-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              type="button"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Secondary Status Strip: FIREWALL ENFORCING */}
      <div className="topnav-status-strip">
        <div className="status-strip-container">
          <div className="status-strip-left">
            <span className="status-strip-pulse" />
            <div className="status-strip-tag">
              <Lock size={12} className="lock-icon" />
              <span className="status-strip-bold">FIREWALL ENFORCING</span>
            </div>
            <span className="status-strip-divider">•</span>
            <span className="status-strip-desc">
              Zero-Trust Tool Isolation Active
            </span>
          </div>

          <div className="status-strip-right">
            <span className="strip-metric">
              <span className="metric-dot cyan" />
              L7 Runtime Intercept
            </span>
            <span className="strip-metric">
              <span className="metric-dot emerald" />
              Taint Propagation Guard
            </span>
            <span className="strip-metric">
              <span className="metric-dot blue" />
              SHA-256 Provenance Audit
            </span>
          </div>
        </div>
      </div>

      {/* Mobile Slide-Down Navigation Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            className="topnav-mobile-drawer"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
          >
            <div className="mobile-drawer-inner">
              <div className="mobile-drawer-title">SECURITY NAVIGATION</div>
              <div className="mobile-nav-grid">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id || (item.id === 'live-security' && activeTab === 'action-firewall');
                  return (
                    <button
                      key={item.id}
                      className={`mobile-nav-link ${isActive ? 'active' : ''}`}
                      onClick={() => handleNavClick(item.id)}
                      type="button"
                    >
                      <Icon size={15} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
              <div className="mobile-drawer-footer">
                {onResetDemo && (
                  <button
                    className="mobile-reset-btn"
                    onClick={() => {
                      onResetDemo();
                      setMobileMenuOpen(false);
                    }}
                    type="button"
                  >
                    <RotateCcw size={13} />
                    <span>Reset Demo Baseline</span>
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
