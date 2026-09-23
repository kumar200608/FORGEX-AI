import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, Layers, Terminal, User, Bot, FileText, Fingerprint, 
  ShieldAlert, Building2, Network, RotateCcw, Clock, Wrench,
  AlertTriangle, Lock, ArrowDown, Shield, CheckCircle2, FileCode, Compass,
  ChevronRight, Info
} from 'lucide-react';

const ARCH_MODULES = [
  {
    id: 'user', label: 'User', desc: 'Human operator providing the authoritative goal statement.', file: null,
    icon: User, zone: 'user', color: '#94A3B8',
  },
  {
    id: 'intent', label: 'Intent Contract', desc: 'Immutable record of the authorized user goal. Cryptographically sealed.', file: 'app/agent/intent_contract.py',
    icon: Lock, zone: 'agent', color: '#22D3EE',
  },
  {
    id: 'ingestion', label: 'Source Ingestion', desc: 'Multi-format document parsing (PDF, TXT, DOCX, EML, JSON, XML, HTML, CSV, images).', file: 'app/ingestion/extractors/',
    icon: FileText, zone: 'agent', color: '#60A5FA',
  },
  {
    id: 'provenance', label: 'Provenance Registry', desc: 'SHA-256 hashing, source origin tagging, trust domain assignment.', file: 'app/provenance/source_registry.py',
    icon: Fingerprint, zone: 'agent', color: '#A78BFA',
  },
  {
    id: 'injection', label: 'Injection Detector', desc: 'Heuristic analysis of source content for prompt injection patterns and override commands.', file: 'app/security/injection_detector.py',
    icon: ShieldAlert, zone: 'agent', color: '#F97316',
  },
  {
    id: 'taint', label: 'Taint Tracker', desc: 'Tracks information flow from untrusted sources to proposed agent actions.', file: 'app/provenance/taint_tracker.py',
    icon: Network, zone: 'agent', color: '#A78BFA',
  },
  {
    id: 'planner', label: 'Agent Planner', desc: 'LLM-based tool call generation. Produces JSON plan steps from context.', file: 'app/agent/planner.py',
    icon: Bot, zone: 'agent', color: '#60A5FA',
  },
  {
    id: 'vendor', label: 'Vendor Verification', desc: 'Validates invoice beneficiary accounts against the approved vendor master registry.', file: 'app/business/vendor_verification.py',
    icon: Building2, zone: 'agent', color: '#22D3EE',
  },
  {
    id: 'firewall', label: 'Action Firewall', desc: 'Zero-trust enforcement gate. Evaluates each proposed tool call against all security signals before execution.', file: 'app/security/action_firewall.py',
    icon: Shield, zone: 'firewall', color: '#06B6D4',
    highlight: true,
  },
  {
    id: 'tools', label: 'Mock Tools', desc: 'Sandboxed tool execution simulator. No real-world side effects.', file: 'app/tools/mock_tools.py',
    icon: Wrench, zone: 'tools', color: '#10B981',
  },
  {
    id: 'evidence', label: 'Evidence Graph', desc: 'Causal chain linking user intent → source → analysis → decision.', file: 'app/provenance/evidence_graph.py',
    icon: Network, zone: 'side', color: '#8B5CF6',
  },
  {
    id: 'audit', label: 'Audit Logger', desc: 'Immutable, cryptographically hashed log of every firewall decision.', file: 'app/database/audit_logger.py',
    icon: Clock, zone: 'side', color: '#F59E0B',
  },
  {
    id: 'recovery', label: 'Recovery Engine', desc: 'Determines safe remediation action when a request is blocked.', file: 'app/recovery/recovery_engine.py',
    icon: RotateCcw, zone: 'side', color: '#10B981',
  },
];

const ZONE_CONFIG = {
  user: { label: 'User Layer', color: '#94A3B8', border: 'rgba(148,163,184,0.25)' },
  agent: { label: 'Zone 1: Agent Planning (Untrusted)', color: '#F59E0B', border: 'rgba(245,158,11,0.3)', desc: 'LLM reasoning, source processing. Never holds execution credentials.' },
  firewall: { label: 'Zone 2: Action Firewall (Enforcement)', color: '#06B6D4', border: 'rgba(6,182,212,0.5)', desc: 'Zero-trust gate. Cryptographically evaluates every tool call.', highlight: true },
  tools: { label: 'Zone 3: Tool Execution (Secured)', color: '#10B981', border: 'rgba(16,185,129,0.3)', desc: 'Tools only execute with explicit firewall authorization token.' },
  side: { label: 'Cross-Cutting Systems', color: '#8B5CF6', border: 'rgba(139,92,246,0.3)' },
};

function ModuleCard({ module, isSelected, onClick }) {
  const Icon = module.icon;
  const isFirewall = module.id === 'firewall';
  return (
    <motion.button
      whileHover={{ y: -3 }}
      onClick={onClick}
      style={{
        padding: '16px 18px',
        background: isSelected 
          ? `rgba(${isFirewall ? '6,182,212' : '29,99,237'},0.2)`
          : 'rgba(13,22,41,0.95)',
        border: `1.5px solid ${isSelected ? module.color : isFirewall ? 'rgba(6,182,212,0.5)' : 'rgba(255,255,255,0.1)'}`,
        borderRadius: '12px',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'all 0.2s ease',
        boxShadow: isSelected ? `0 0 20px ${module.color}44` : isFirewall ? '0 0 24px rgba(6,182,212,0.25)' : 'none',
        position: 'relative',
      }}
    >
      {isFirewall && !isSelected && (
        <div style={{
          position: 'absolute', top: '-1px', right: '12px',
          fontSize: '9px', padding: '2px 8px', borderRadius: '0 0 6px 6px',
          background: 'rgba(6,182,212,0.9)', color: '#fff', fontWeight: 800, letterSpacing: '0.05em',
        }}>
          ENFORCEMENT CENTER
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '8px' }}>
        <div style={{
          width: '34px', height: '34px', borderRadius: '9px', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: `${module.color}18`, border: `1px solid ${module.color}44`,
          color: module.color,
        }}>
          <Icon size={17} />
        </div>
        <div>
          <div style={{ fontSize: '13px', fontWeight: 800, color: '#FFFFFF', lineHeight: 1.2 }}>{module.label}</div>
          {module.file && (
            <code className="font-mono" style={{ fontSize: '9.5px', color: 'var(--text-muted)', marginTop: '2px', display: 'block' }}>
              {module.file}
            </code>
          )}
        </div>
      </div>
      <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{module.desc}</div>
    </motion.button>
  );
}

export default function Architecture() {
  const [selectedModule, setSelectedModule] = useState('firewall');

  const selectedDef = ARCH_MODULES.find(m => m.id === selectedModule);

  const zoneGroups = {
    user: ARCH_MODULES.filter(m => m.zone === 'user'),
    agent: ARCH_MODULES.filter(m => m.zone === 'agent'),
    firewall: ARCH_MODULES.filter(m => m.zone === 'firewall'),
    tools: ARCH_MODULES.filter(m => m.zone === 'tools'),
    side: ARCH_MODULES.filter(m => m.zone === 'side'),
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>

      {/* ── Header ── */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
          <Compass size={22} style={{ color: 'var(--accent-cyan)' }} />
          <h1 style={{ fontSize: '26px', fontWeight: 900, letterSpacing: '-0.02em' }}>SYSTEM ARCHITECTURE</h1>
          <span className="badge badge-neutral" style={{ fontSize: '10px' }}>Blueprint</span>
        </div>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', maxWidth: '700px' }}>
          Zero-trust architectural blueprint. Mathematical separation of agent reasoning from tool execution authority. 
          Click any module to inspect purpose and backend location.
        </p>
      </div>

      {/* ── Trust Flow Banner ── */}
      <div style={{
        background: 'radial-gradient(ellipse at 50% 0%, #0D1E40 0%, #080F1E 100%)',
        border: '1px solid rgba(29,99,237,0.25)', borderRadius: '16px', padding: '24px 28px',
      }}>
        <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '16px' }}>
          Enforcement Data Flow
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflowX: 'auto', paddingBottom: '4px', flexWrap: 'wrap' }}>
          {['USER', 'SOURCE INGESTION', 'PROVENANCE', 'INJECTION DETECTION', 'TAINT TRACKING', 'AGENT PLAN', 'BUSINESS VERIFICATION', 'ACTION FIREWALL ⚡', 'TOOLS'].map((step, i, arr) => (
            <React.Fragment key={step}>
              <div style={{
                padding: '7px 14px', borderRadius: '8px', fontSize: '11.5px', fontWeight: 700, whiteSpace: 'nowrap',
                background: step.includes('FIREWALL') ? 'rgba(6,182,212,0.2)' : 'rgba(255,255,255,0.05)',
                border: step.includes('FIREWALL') ? '1.5px solid var(--accent-cyan)' : '1px solid var(--border)',
                color: step.includes('FIREWALL') ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                boxShadow: step.includes('FIREWALL') ? '0 0 16px rgba(6,182,212,0.3)' : 'none',
              }}>
                {step}
              </div>
              {i < arr.length - 1 && <ChevronRight size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px' }}>
        {/* ── Main Architecture Layout ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* User Zone */}
          <div>
            <div style={{ fontSize: '10.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: ZONE_CONFIG.user.color, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: ZONE_CONFIG.user.color }} />
              User Layer
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '10px' }}>
              {zoneGroups.user.map(m => <ModuleCard key={m.id} module={m} isSelected={selectedModule === m.id} onClick={() => setSelectedModule(m.id === selectedModule ? null : m.id)} />)}
            </div>
          </div>

          {/* Agent Planning Zone */}
          <div style={{ padding: '18px', borderRadius: '14px', border: `1px dashed ${ZONE_CONFIG.agent.border}`, background: 'rgba(245,158,11,0.03)' }}>
            <div style={{ fontSize: '10.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: ZONE_CONFIG.agent.color, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: ZONE_CONFIG.agent.color }} />
              Zone 1 — {ZONE_CONFIG.agent.label}
              <span style={{ fontSize: '9.5px', color: 'var(--text-muted)', fontWeight: 400, marginLeft: '4px' }}>{ZONE_CONFIG.agent.desc}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '10px' }}>
              {zoneGroups.agent.map(m => <ModuleCard key={m.id} module={m} isSelected={selectedModule === m.id} onClick={() => setSelectedModule(m.id === selectedModule ? null : m.id)} />)}
            </div>
          </div>

          {/* Action Firewall Zone - Dominant */}
          <div style={{ padding: '18px', borderRadius: '14px', border: `2px solid ${ZONE_CONFIG.firewall.border}`, background: 'rgba(6,182,212,0.04)', boxShadow: '0 0 40px rgba(6,182,212,0.1)' }}>
            <div style={{ fontSize: '10.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: ZONE_CONFIG.firewall.color, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: ZONE_CONFIG.firewall.color, boxShadow: '0 0 8px var(--accent-cyan)' }} />
              Zone 2 — {ZONE_CONFIG.firewall.label}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}>
              {zoneGroups.firewall.map(m => <ModuleCard key={m.id} module={m} isSelected={selectedModule === m.id} onClick={() => setSelectedModule(m.id === selectedModule ? null : m.id)} />)}
            </div>
          </div>

          {/* Tool Execution Zone */}
          <div style={{ padding: '18px', borderRadius: '14px', border: `1px dashed ${ZONE_CONFIG.tools.border}`, background: 'rgba(16,185,129,0.02)' }}>
            <div style={{ fontSize: '10.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: ZONE_CONFIG.tools.color, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: ZONE_CONFIG.tools.color }} />
              Zone 3 — {ZONE_CONFIG.tools.label}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '10px' }}>
              {zoneGroups.tools.map(m => <ModuleCard key={m.id} module={m} isSelected={selectedModule === m.id} onClick={() => setSelectedModule(m.id === selectedModule ? null : m.id)} />)}
            </div>
          </div>
        </div>

        {/* ── Right Panel: Detail + Side Systems ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Module detail panel */}
          <AnimatePresence mode="wait">
            {selectedDef && (
              <motion.div
                key={selectedDef.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.22 }}
                style={{
                  padding: '20px 22px', borderRadius: '14px',
                  background: `${selectedDef.color}14`,
                  border: `1.5px solid ${selectedDef.color}44`,
                  boxShadow: `0 0 24px ${selectedDef.color}22`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${selectedDef.color}22`, border: `1px solid ${selectedDef.color}55`, color: selectedDef.color }}>
                    <selectedDef.icon size={19} />
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 800, color: '#FFFFFF' }}>{selectedDef.label}</div>
                    <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', color: selectedDef.color, fontWeight: 700 }}>
                      {selectedDef.zone === 'firewall' ? 'ENFORCEMENT CENTER' : `Zone: ${selectedDef.zone}`}
                    </div>
                  </div>
                </div>
                <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '12px' }}>{selectedDef.desc}</p>
                {selectedDef.file && (
                  <div style={{ padding: '8px 12px', borderRadius: '8px', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '9.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '3px' }}>Backend Module</div>
                    <code className="font-mono" style={{ fontSize: '11.5px', color: selectedDef.color }}>{selectedDef.file}</code>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Cross-cutting Side Systems */}
          <div style={{ padding: '16px 18px', borderRadius: '14px', border: `1px solid ${ZONE_CONFIG.side.border}`, background: 'rgba(139,92,246,0.04)' }}>
            <div style={{ fontSize: '10.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: ZONE_CONFIG.side.color, marginBottom: '12px' }}>
              Cross-Cutting Systems
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {zoneGroups.side.map(m => <ModuleCard key={m.id} module={m} isSelected={selectedModule === m.id} onClick={() => setSelectedModule(m.id === selectedModule ? null : m.id)} />)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
