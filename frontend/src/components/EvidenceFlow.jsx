import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Lock, FileText, Zap, Fingerprint, Terminal, Building, 
  Shield, CheckCircle2, RotateCcw, Network, ChevronDown, ChevronUp,
  AlertTriangle, XCircle, Info
} from 'lucide-react';

const NODE_DEFS = [
  { id: 'user_intent', label: 'User Intent', icon: Lock, x: 50, y: 20, color: '#22D3EE' },
  { id: 'source', label: 'Source', icon: FileText, x: 200, y: 20, color: '#60A5FA' },
  { id: 'injection', label: 'Injection Analysis', icon: Zap, x: 350, y: 20, color: '#F97316' },
  { id: 'taint', label: 'Taint Tracking', icon: Fingerprint, x: 500, y: 20, color: '#A78BFA' },
  { id: 'agent_plan', label: 'Agent Plan', icon: Terminal, x: 650, y: 20, color: '#60A5FA' },
  { id: 'business_verification', label: 'Vendor Verify', icon: Building, x: 800, y: 20, color: '#22D3EE' },
  { id: 'action_firewall', label: 'Action Firewall', icon: Shield, x: 950, y: 20, color: '#06B6D4' },
  { id: 'decision', label: 'Decision', icon: CheckCircle2, x: 1100, y: 20, color: '#10B981' },
];

const EDGES = [
  { from: 'user_intent', to: 'source' }, { from: 'user_intent', to: 'action_firewall' },
  { from: 'source', to: 'injection' }, { from: 'injection', to: 'taint' },
  { from: 'taint', to: 'agent_plan' }, { from: 'agent_plan', to: 'action_firewall' },
  { from: 'source', to: 'business_verification' }, { from: 'business_verification', to: 'action_firewall' },
  { from: 'action_firewall', to: 'decision' },
];

function getNodeState(nodeId, data) {
  if (!data) return 'neutral';
  const { source, injection_result, business_verification, plan, overall_decision, evaluations = [] } = data;
  const isInjection = injection_result?.detected ?? false;
  const isTainted = source?.taint_status === 'TAINTED' || isInjection;
  const vendorExists = business_verification?.vendor_exists;
  const vendorMatch = business_verification?.beneficiary_match;
  const isBlocked = overall_decision === 'BLOCK';
  const isAsk = overall_decision === 'ASK_USER';

  switch (nodeId) {
    case 'user_intent': return 'ok';
    case 'source': return source ? (source.trust_domain === 'EXTERNAL' ? 'warning' : 'ok') : 'neutral';
    case 'injection': return injection_result ? (isInjection ? 'error' : 'ok') : 'neutral';
    case 'taint': return source?.taint_status ? (isTainted ? 'error' : 'ok') : 'neutral';
    case 'agent_plan': return plan ? 'ok' : 'neutral';
    case 'business_verification': return business_verification
      ? (vendorExists && vendorMatch ? 'ok' : vendorExists && !vendorMatch ? 'error' : 'warning')
      : 'neutral';
    case 'action_firewall': return isBlocked ? 'error' : isAsk ? 'warning' : (overall_decision ? 'ok' : 'neutral');
    case 'decision': return isBlocked ? 'error' : isAsk ? 'warning' : (overall_decision ? 'ok' : 'neutral');
    default: return 'neutral';
  }
}

function getNodeEvidence(nodeId, data) {
  if (!data) return null;
  const { source, injection_result, business_verification, plan, overall_decision, intent, explanation, evaluations = [] } = data;
  const allViolations = evaluations.flatMap(e => e.violated_constraints || []);

  switch (nodeId) {
    case 'user_intent': return { title: 'User Intent Contract', body: intent?.user_goal || 'No intent loaded', detail: 'Immutable authorization boundary. All agent actions must serve this objective.' };
    case 'source': return { title: 'Source Document', body: `File: ${source?.filename || 'Unknown'}`, detail: `Trust Domain: ${source?.trust_domain || '?'} | Hash: ${source?.sha256?.slice(0,16) || 'N/A'}...` };
    case 'injection': return {
      title: 'Injection Detection',
      body: injection_result?.detected ? `DETECTED — ${injection_result.threat_level} threat` : 'No injection detected',
      detail: injection_result?.attack_type || injection_result?.reason || 'Content analyzed for prompt injection patterns.',
    };
    case 'taint': return { title: 'Taint Status', body: source?.taint_status || 'UNKNOWN', detail: source?.taint_status === 'TAINTED' ? 'Source content is tainted. Actions derived from this content carry risk.' : 'Content lineage is clean.' };
    case 'agent_plan': return { title: 'Agent Plan', body: plan?.steps?.map(s => s.action_name).join(', ') || 'No steps', detail: `${plan?.steps?.length || 0} proposed tool calls evaluated.` };
    case 'business_verification': return {
      title: 'Vendor Verification',
      body: business_verification?.vendor_name || 'Unknown Vendor',
      detail: `Exists: ${business_verification?.vendor_exists ? 'Yes' : 'No'} | Beneficiary Match: ${business_verification?.beneficiary_match ? 'Yes' : 'No'}`,
    };
    case 'action_firewall': return { title: 'Action Firewall Decision', body: overall_decision || 'Pending', detail: allViolations.length ? `Violations: ${allViolations.join('; ')}` : 'All constraints evaluated.' };
    case 'decision': return { title: 'Final Decision', body: overall_decision || 'Pending', detail: explanation || 'No explanation generated.' };
    default: return null;
  }
}

const stateStyle = {
  neutral: { border: 'rgba(255,255,255,0.1)', bg: 'rgba(13,22,41,0.95)', icon: 'var(--text-muted)', dot: '#475569' },
  ok: { border: 'var(--allow)', bg: 'rgba(16,185,129,0.12)', icon: 'var(--allow)', dot: 'var(--allow)' },
  error: { border: 'var(--block)', bg: 'rgba(239,68,68,0.14)', icon: 'var(--block)', dot: 'var(--block)' },
  warning: { border: 'var(--ask)', bg: 'rgba(245,158,11,0.14)', icon: 'var(--ask)', dot: 'var(--ask)' },
};

export default function EvidenceFlow({ evidenceGraph, rawData, setActiveTab }) {
  const [selectedNode, setSelectedNode] = useState(null);
  const [animKey, setAnimKey] = useState(0);

  const data = rawData || evidenceGraph;

  const handleNodeClick = (nodeId) => {
    setSelectedNode(selectedNode === nodeId ? null : nodeId);
  };

  if (!data) {
    return (
      <div className="card-panel" style={{ padding: '28px', textAlign: 'center' }}>
        <Network size={36} style={{ color: 'var(--accent-cyan)', opacity: 0.4, margin: '0 auto 12px' }} />
        <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>Evidence Graph</div>
        <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Run a pipeline scenario to view the causal evidence graph.</div>
      </div>
    );
  }

  const overall = rawData?.overall_decision;
  const isBlocked = overall === 'BLOCK';

  return (
    <div className="card-panel" style={{ padding: '28px 32px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <Network size={18} style={{ color: 'var(--accent-cyan)' }} />
            <h3 style={{ fontSize: '15px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Causal Evidence Graph
            </h3>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Click any node to inspect the security evidence. Why did TraceGuard make this decision?
          </p>
        </div>
        <button className="btn-secondary" style={{ fontSize: '11.5px' }} onClick={() => setAnimKey(k => k + 1)}>
          <RotateCcw size={13} /> Replay
        </button>
      </div>

      {/* Evidence Node Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '20px' }}>
        {NODE_DEFS.map((node, idx) => {
          const state = getNodeState(node.id, rawData);
          const styles = stateStyle[state];
          const Icon = node.icon;
          const isSelected = selectedNode === node.id;
          const isFirewall = node.id === 'action_firewall';

          return (
            <motion.button
              key={node.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.06 }}
              whileHover={{ y: -3 }}
              onClick={() => handleNodeClick(node.id)}
              style={{
                padding: '16px 18px',
                background: isSelected ? (isFirewall ? 'rgba(6,182,212,0.18)' : styles.bg) : styles.bg,
                border: `1.5px solid ${isSelected ? (isFirewall ? 'var(--accent-cyan)' : styles.border) : styles.border}`,
                borderRadius: '12px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s ease',
                boxShadow: isSelected ? `0 0 20px ${styles.dot}44` : (isFirewall ? '0 0 16px rgba(6,182,212,0.15)' : 'none'),
                position: 'relative',
                ...(isFirewall && !isSelected ? { border: '2px solid var(--accent-cyan)', boxShadow: '0 0 20px rgba(6,182,212,0.2)' } : {}),
              }}
            >
              {/* Status dot */}
              <div style={{
                position: 'absolute', top: '10px', right: '10px',
                width: '8px', height: '8px', borderRadius: '50%',
                background: styles.dot, boxShadow: `0 0 8px ${styles.dot}`,
              }} />

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <div style={{
                  width: '34px', height: '34px', borderRadius: '9px', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(0,0,0,0.3)', border: `1px solid ${styles.border}`,
                  color: isFirewall ? 'var(--accent-cyan)' : styles.icon,
                }}>
                  <Icon size={17} />
                </div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#FFFFFF', lineHeight: 1.2 }}>
                  {node.label}
                </div>
              </div>

              <div style={{
                fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
                color: styles.icon,
              }}>
                {state === 'neutral' ? 'Not run' : state === 'ok' ? 'Passed' : state === 'error' ? 'Failed' : 'Warning'}
              </div>

              {isSelected && <ChevronUp size={13} style={{ position: 'absolute', bottom: '8px', right: '10px', color: 'var(--text-muted)' }} />}
            </motion.button>
          );
        })}
      </div>

      {/* Connector lines visual hint */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Evidence flow:</span>
        {['User Intent', '→', 'Source', '→', 'Injection', '→', 'Taint', '→', 'Agent Plan', '→', 'Firewall', '→', 'Decision'].map((item, i) => (
          <span key={i} style={{
            fontSize: '11px',
            color: item === '→' ? 'var(--text-muted)' : 'var(--accent-cyan)',
            fontWeight: item === '→' ? 400 : 600,
          }}>
            {item}
          </span>
        ))}
      </div>

      {/* Expandable evidence drawer */}
      <AnimatePresence>
        {selectedNode && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
          >
            <EvidenceDrawer nodeId={selectedNode} data={rawData} onClose={() => setSelectedNode(null)} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function EvidenceDrawer({ nodeId, data, onClose }) {
  const nodeDef = NODE_DEFS.find(n => n.id === nodeId);
  const evidence = getNodeEvidence(nodeId, data);
  const state = getNodeState(nodeId, data);
  const styles = stateStyle[state];
  if (!nodeDef || !evidence) return null;
  const Icon = nodeDef.icon;

  return (
    <div style={{
      background: 'rgba(6,10,20,0.8)',
      border: `1px solid ${styles.border}`,
      borderRadius: '12px',
      padding: '20px 24px',
      marginTop: '4px',
      boxShadow: `0 0 24px ${styles.dot}33`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '8px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: styles.bg, border: `1px solid ${styles.border}`, color: styles.icon,
          }}>
            <Icon size={16} />
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 800, color: '#FFFFFF' }}>{evidence.title}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '2px' }}>
              {state === 'ok' ? 'PASSED' : state === 'error' ? 'FAILED' : state === 'warning' ? 'WARNING' : 'NOT RUN'}
            </div>
          </div>
        </div>
        <button onClick={onClose} style={{ color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}>
          <XCircle size={18} />
        </button>
      </div>
      <div style={{
        padding: '14px 16px', borderRadius: '8px',
        background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', marginBottom: '10px',
      }}>
        <div style={{ fontSize: '14px', fontWeight: 700, color: styles.icon, marginBottom: '4px' }}>{evidence.body}</div>
        <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{evidence.detail}</div>
      </div>
    </div>
  );
}
