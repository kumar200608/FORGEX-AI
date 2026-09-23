import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, ShieldAlert, Fingerprint, UserCheck,
  Building, ShieldCheck, CheckCircle2, AlertOctagon, AlertTriangle,
  Zap, Lock, Activity, ArrowRight
} from 'lucide-react';

const STAGES = [
  { id: 'source', title: 'Untrusted Source', sub: 'Input Ingestion', icon: FileText },
  { id: 'injection', title: 'Injection Detector', sub: 'Payload Analysis', icon: ShieldAlert },
  { id: 'taint', title: 'Taint Tracker', sub: 'Lineage Track', icon: Fingerprint },
  { id: 'intent', title: 'Intent Contract', sub: 'Ground Truth', icon: UserCheck },
  { id: 'vendor', title: 'Vendor Verify', sub: 'Registry Match', icon: Building },
  { id: 'firewall', title: 'Action Firewall', sub: 'Zero-Trust Gate', icon: ShieldCheck },
  { id: 'verdict', title: 'Decision', sub: 'Final Verdict', icon: CheckCircle2 },
];

// Animated glowing particle traversing the pipeline
function PipelineParticle({ progress }) {
  if (progress <= 0 || progress >= STAGES.length) return null;
  const pct = ((progress - 1) / (STAGES.length - 1)) * 100;
  return (
    <div style={{
      position: 'absolute',
      left: `${pct}%`,
      top: '50%',
      width: '12px',
      height: '12px',
      borderRadius: '50%',
      background: 'var(--accent-cyan)',
      boxShadow: '0 0 20px var(--accent-cyan), 0 0 40px var(--accent-cyan)',
      transform: 'translate(-50%, -50%)',
      zIndex: 10,
      transition: 'left 0.5s cubic-bezier(0.4,0,0.2,1)',
      pointerEvents: 'none',
    }} />
  );
}

function getStageState(stageId, data, allViolations) {
  if (!data) return 'neutral';
  const { source, injection_result, business_verification, plan, overall_decision, evaluations = [] } = data;
  const isInjection = injection_result?.detected ?? false;
  const isTainted = source?.taint_status === 'TAINTED' || isInjection;
  const vendorExists = business_verification?.vendor_exists;
  const vendorMatch = business_verification?.beneficiary_match;
  const isBlocked = overall_decision === 'BLOCK';
  const isAskUser = overall_decision === 'ASK_USER';
  const hasIntentViolation = allViolations.some(p => p.toLowerCase().includes('intent') || p.toLowerCase().includes('unauthorized'));

  switch (stageId) {
    case 'source': return source ? (source.trust_domain === 'INTERNAL_SYSTEM' ? 'passed' : 'warning') : 'neutral';
    case 'injection': return injection_result ? (isInjection ? 'blocked' : 'passed') : 'neutral';
    case 'taint': return source?.taint_status ? (isTainted ? 'blocked' : 'passed') : 'neutral';
    case 'intent': return plan ? (hasIntentViolation ? 'blocked' : 'passed') : 'neutral';
    case 'vendor': {
      if (!business_verification) return 'neutral';
      if (vendorExists && vendorMatch) return 'passed';
      if (vendorExists && !vendorMatch) return 'blocked';
      return 'warning';
    }
    case 'firewall': return isBlocked ? 'blocked' : isAskUser ? 'warning' : 'passed';
    case 'verdict': return isBlocked ? 'blocked' : isAskUser ? 'warning' : 'passed';
    default: return 'neutral';
  }
}

function getStageDetail(stageId, data, allViolations) {
  if (!data) return '';
  const { source, injection_result, business_verification, plan, overall_decision, evaluations = [] } = data;
  const isInjection = injection_result?.detected ?? false;
  const isTainted = source?.taint_status === 'TAINTED' || isInjection;
  const vendorExists = business_verification?.vendor_exists;
  const vendorMatch = business_verification?.beneficiary_match;
  const isBlocked = overall_decision === 'BLOCK';
  const isAskUser = overall_decision === 'ASK_USER';

  switch (stageId) {
    case 'source': return source?.filename || source?.original_filename || 'Payload';
    case 'injection': return isInjection ? `${injection_result?.threat_level || 'HIGH'} Threat` : 'Clean';
    case 'taint': return isTainted ? 'TAINTED' : 'Clean';
    case 'intent': return plan?.steps?.[0]?.action_name || 'Checked';
    case 'vendor': return !business_verification ? '—' : (vendorExists ? (vendorMatch ? 'Verified ✓' : 'MISMATCH ✗') : 'Unknown');
    case 'firewall': return isBlocked ? 'Policy Enforced' : 'Authorized';
    case 'verdict': return overall_decision || 'Pending';
    default: return '';
  }
}

const stateColors = {
  neutral: { bg: 'rgba(13,22,41,0.9)', border: 'rgba(255,255,255,0.1)', text: 'var(--text-muted)', glow: 'none' },
  passed: { bg: 'rgba(16,185,129,0.12)', border: 'var(--allow)', text: 'var(--allow)', glow: '0 0 18px rgba(16,185,129,0.35)' },
  blocked: { bg: 'rgba(239,68,68,0.14)', border: 'var(--block)', text: 'var(--block)', glow: '0 0 18px rgba(239,68,68,0.35)' },
  warning: { bg: 'rgba(245,158,11,0.14)', border: 'var(--ask)', text: 'var(--ask)', glow: '0 0 18px rgba(245,158,11,0.3)' },
};

const statusLabels = { neutral: 'Standby', passed: 'Passed', blocked: 'Blocked', warning: 'Warning' };

export default function SecurityPipeline({ pipelineData, scanningStep = -1 }) {
  const [particleStep, setParticleStep] = useState(0);

  // Advance particle for scanning animation
  useEffect(() => {
    if (scanningStep >= 0) {
      setParticleStep(scanningStep);
    } else if (pipelineData) {
      setParticleStep(STAGES.length);
    } else {
      setParticleStep(0);
    }
  }, [scanningStep, pipelineData]);

  // Idle particle loop when no pipeline data
  useEffect(() => {
    if (!pipelineData && scanningStep < 0) {
      const iv = setInterval(() => setParticleStep(s => (s + 0.2) % (STAGES.length + 1)), 60);
      return () => clearInterval(iv);
    }
  }, [pipelineData, scanningStep]);

  const allViolations = pipelineData ? [
    ...(pipelineData.violated_policies || []),
    ...(pipelineData.evaluations || []).flatMap(e => e.violated_constraints || [])
  ] : [];

  const overall = pipelineData?.overall_decision;
  const isBlocked = overall === 'BLOCK';
  const isAskUser = overall === 'ASK_USER';
  const isAllowed = overall === 'ALLOW';

  return (
    <div className="card-panel" style={{ padding: '28px 32px', borderRadius: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h3 style={{ fontSize: '15px', fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#FFFFFF' }}>
            Runtime Enforcement Pipeline
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '3px' }}>
            Real-time multi-stage inspection across 7 defense layers
          </p>
        </div>
        {overall && (
          <span className={`badge ${isBlocked ? 'badge-block' : isAskUser ? 'badge-ask' : 'badge-allow'}`} style={{ fontSize: '12px', padding: '6px 14px' }}>
            {overall}
          </span>
        )}
        {!pipelineData && (
          <span className="badge badge-neutral">Standby — Run a scenario above</span>
        )}
      </div>

      {/* Pipeline Track */}
      <div style={{ position: 'relative', overflowX: 'auto', paddingBottom: '8px' }}>
        {/* Beam track line */}
        <div style={{
          position: 'absolute', top: '42px', left: '40px', right: '40px', height: '2px',
          background: 'rgba(255,255,255,0.06)', borderRadius: '2px', zIndex: 0,
        }}>
          {/* Active beam fill */}
          {pipelineData && (
            <motion.div
              style={{
                position: 'absolute', left: 0, top: 0, bottom: 0,
                background: isBlocked
                  ? 'linear-gradient(90deg, var(--accent-blue) 0%, var(--block) 100%)'
                  : isAskUser
                    ? 'linear-gradient(90deg, var(--accent-blue) 0%, var(--ask) 100%)'
                    : 'linear-gradient(90deg, var(--accent-blue) 0%, var(--allow) 100%)',
                boxShadow: '0 0 12px var(--accent-cyan)',
              }}
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
            />
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0', position: 'relative', zIndex: 1, minWidth: '740px' }}>
          {STAGES.map((stage, idx) => {
            const state = getStageState(stage.id, pipelineData, allViolations);
            const detail = getStageDetail(stage.id, pipelineData, allViolations);
            const colors = stateColors[state];
            const Icon = stage.icon;
            const isActive = scanningStep === idx + 1;

            return (
              <motion.div
                key={stage.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: idx * 0.06 }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  flex: 1,
                  position: 'relative',
                }}
              >
                {/* Icon circle */}
                <motion.div
                  animate={isActive ? { scale: [1, 1.15, 1], boxShadow: ['0 0 0 0 var(--accent-cyan)', '0 0 0 12px transparent', '0 0 0 0 transparent'] } : {}}
                  transition={{ duration: 0.8, repeat: isActive ? Infinity : 0 }}
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: isActive ? 'rgba(6,182,212,0.2)' : colors.bg,
                    border: `1.5px solid ${isActive ? 'var(--accent-cyan)' : colors.border}`,
                    color: isActive ? 'var(--accent-cyan)' : colors.text,
                    boxShadow: isActive ? '0 0 20px rgba(6,182,212,0.5)' : colors.glow,
                    transition: 'all 0.3s ease',
                    marginBottom: '10px',
                    flexShrink: 0,
                    cursor: 'default',
                  }}
                >
                  <Icon size={22} />
                </motion.div>

                {/* Stage label */}
                <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#FFFFFF', letterSpacing: '0.01em', marginBottom: '3px', whiteSpace: 'nowrap' }}>
                  {stage.title}
                </div>

                {/* Status pill */}
                <span style={{
                  display: 'inline-block',
                  fontSize: '9.5px',
                  padding: '2px 7px',
                  borderRadius: '999px',
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  background: state === 'passed' ? 'var(--allow-soft)' : state === 'blocked' ? 'var(--block-soft)' : state === 'warning' ? 'var(--ask-soft)' : 'rgba(255,255,255,0.05)',
                  color: colors.text,
                  border: `1px solid ${state === 'neutral' ? 'var(--border)' : colors.border}`,
                  marginBottom: '2px',
                }}>
                  {isActive ? 'Scanning...' : statusLabels[state]}
                </span>

                {/* Detail text */}
                {detail && (
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', maxWidth: '90px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                    title={detail}>
                    {detail}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
