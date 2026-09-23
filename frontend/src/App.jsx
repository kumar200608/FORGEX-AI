import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Topnav from './components/Topnav';
import Dashboard from './pages/Dashboard';
import LiveSecurity from './pages/LiveSecurity';
import UniversalScanner from './pages/UniversalScanner';
import AttackPlayground from './pages/AttackPlayground';
import Evaluation from './pages/Evaluation';
import VendorTrust from './pages/VendorTrust';
import AuditTrail from './pages/AuditTrail';
import Architecture from './pages/Architecture';
import { api } from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isOnline, setIsOnline] = useState(true);

  const checkHealth = async () => {
    try {
      const health = await api.getHealth();
      setIsOnline(health?.status === 'ok');
    } catch (err) {
      setIsOnline(false);
    }
  };

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 10000);
    return () => clearInterval(interval);
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard setActiveTab={setActiveTab} isOnline={isOnline} />;
      case 'live-security':
      case 'action-firewall':
        return <LiveSecurity setActiveTab={setActiveTab} />;
      case 'universal-scanner':
        return <UniversalScanner />;
      case 'attack-playground':
        return <AttackPlayground />;
      case 'evaluation':
        return <Evaluation />;
      case 'vendor-trust':
        return <VendorTrust />;
      case 'audit-trail':
        return <AuditTrail />;
      case 'architecture':
        return <Architecture />;
      default:
        return <Dashboard setActiveTab={setActiveTab} />;
    }
  };

  const handleResetDemo = () => {
    setActiveTab('live-security');
  };

  return (
    <div className="app-shell">
      <Topnav 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isOnline={isOnline} 
        onResetDemo={handleResetDemo} 
      />
      <main className="content-viewport">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
