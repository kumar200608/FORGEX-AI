import React from 'react';
import { motion } from 'framer-motion';
import { 
  ShieldAlert, ShieldCheck, AlertOctagon, CheckCircle2, 
  AlertTriangle, Lock, ChevronRight, Terminal, FileText, ArrowRight
} from 'lucide-react';
import DecisionBadge from './DecisionBadge';

export default function ActionFirewall({ result, setActiveTab }) {
  if (!result) return null;

  const decision = (result.overall_decision || 'UNKNOWN').toUpperCase();
  const isBlock = decision === 'BLOCK';
  const isAllow = decision === 'ALLOW';
  const isAsk = decision === 'ASK_USER' || decision.includes('ASK');

  const plan = result.plan;
  const source = result.source;
  const proposedStep = plan?.steps?.[0];
  const actionName = proposedStep?.action_name || 'prepare_payment_draft';
  const explanation = result.explanation;
  const recovery = result.recovery;
  const evaluations = result.evaluations || [];
  const allViolations = evaluations.flatMap(e => e.violated_constraints || []);

  const decisionConfig = {
    BLOCK: {
      title: 'ACTION BLOCKED',
      subtitle: 'Critical security violation intercepted. The AI agent attempted to execute an action exceeding the authorized boundary or originating from tainted input.',
      accentColor: 'var(--block)',
      bg: 'linear-gradient(135deg, rgba(239,68,68,0.16) 0%, #080E1C 100%)',
      border: 'var(--block)',
      glow: '0 0 60px rgba(239,68,68,0.25)',
      icon: ShieldAlert,
    },
    ALLOW: {
      title: 'ACTION AUTHORIZED',
      subtitle: 'Proposed actions strictly align with the immutable User Intent Contract and verified vendor master records. Safe for execution.',
      accentColor: 'var(--allow)',
      bg: 'linear-gradient(135deg, rgba(16,185,129,0.14) 0%, #080E1C 100%)',
      border: 'var(--allow)',
      glow: '0 0 60px rgba(16,185,129,0.2)',
      icon: ShieldCheck,
    },
    ASK: {
      title: 'HUMAN CONFIRMATION REQUIRED',
      subtitle: 'Elevated sensitivity detected. Execution is paused pending human-in-the-loop approval due to ambiguous directives or elevated risk.',
      accentColor: 'var(--ask)',
      bg: 'linear-gradient(135deg, rgba(245,158,11,0.14) 0%, #080E1C 100%)',
      border: 'var(--ask)',
      glow: '0 0 60px rgba(245,158,11,0.2)',
      icon: AlertTriangle,
    },
  };

  const cfg = isBlock ? decisionConfig.BLOCK : isAllow ? decisionConfig.ALLOW : decisionConfig.ASK;
  const Icon = cfg.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
    >
      {/* ── Cinematic Decision Banner ── */}
      <div style={{
        background: cfg.bg,
        border: `2px solid ${cfg.border}`,
        borderRadius: '18px',
        padding: '36px 40px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: cfg.glow,
        marginBottom: '20px',
      }}>
        {/* Ambient scan animation for block */}
        {isBlock && (
          <motion.div
            style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
              background: 'linear-gradient(90deg, transparent, var(--block), transparent)',
              opacity: 0.8,
            }}
            animate={{ top: ['0%', '100%', '0%'] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          />
        )}

        {/* Top row: verdict + action name */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '24px', flexWrap: 'wrap' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '12px' }}>
              <div style={{
                width: '52px', height: '52px', borderRadius: '14px', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: `rgba(${isBlock ? '239,68,68' : isAllow ? '16,185,129' : '245,158,11'},0.18)`,
                border: `1.5px solid ${cfg.accentColor}`,
                color: cfg.accentColor,
                boxShadow: `0 0 20px ${cfg.accentColor}55`,
              }}>
                <Icon size={28} />
              </div>
              <div>
                <h2 style={{ fontSize: '30px', fontWeight: 900, letterSpacing: '-0.02em', color: '#FFFFFF', lineHeight: 1.1 }}>
                  {cfg.title}
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                  <DecisionBadge decision={decision} size="lg" />
                  <code className="font-mono" style={{ fontSize: '12px', color: 'var(--text-muted)', padding: '2px 8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px' }}>
                    {result.run_id || 'RUN-LATEST'}
                  </code>
                </div>
              </div>
            </div>
            <p style={{ fontSize: '14.5px', color: 'var(--text-secondary)', lineHeight: 1.65, maxWidth: '680px' }}>
              {cfg.subtitle}
            </p>
          </div>

          {/* Stats panel */}
          <div style={{
            display: 'flex', gap: '16px', flexShrink: 0,
            background: 'rgba(6,10,20,0.7)', padding: '16px 22px', borderRadius: '12px', border: '1px solid var(--border)',
          }}>
            <div style={{ textAlign: 'center' }}>
              <div className="font-mono" style={{ fontSize: '24px', fontWeight: 800, color: cfg.accentColor }}>{evaluations.length}</div>
              <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Steps Checked</div>
            </div>
            <div style={{ width: '1px', background: 'var(--border)' }} />
            <div style={{ textAlign: 'center' }}>
              <div className="font-mono" style={{ fontSize: '24px', fontWeight: 800, color: isBlock ? 'var(--block)' : 'var(--allow)' }}>
                {evaluations.filter(e => e.decision === 'BLOCK').length}
              </div>
              <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Blocked Steps</div>
            </div>
            <div style={{ width: '1px', background: 'var(--border)' }} />
            <div style={{ textAlign: 'center' }}>
              <div className="font-mono" style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-secondary)' }}>
                {allViolations.length}
              </div>
              <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Violations</div>
            </div>
          </div>
        </div>

        {/* Inspection tiles */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginTop: '24px' }}>
          {[
            { label: 'Proposed Action', value: actionName, mono: true },
            { label: 'Source File', value: source?.original_filename || source?.filename || 'Document' },
            { label: 'Source Trust', value: source?.trust_domain || 'EXTERNAL' },
            { label: 'Taint Status', value: source?.taint_status || 'UNKNOWN', colored: source?.taint_status === 'TAINTED' ? 'block' : 'allow' },
          ].map((tile, i) => (
            <div key={i} style={{
              padding: '14px 16px', borderRadius: '10px',
              background: 'rgba(6,10,20,0.7)', border: '1px solid rgba(255,255,255,0.08)',
            }}>
              <div style={{ fontSize: '10.5px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '5px', fontWeight: 700 }}>{tile.label}</div>
              <div style={{
                fontSize: '13.5px', fontWeight: 700, fontFamily: tile.mono ? 'var(--font-mono)' : 'inherit',
                color: tile.colored === 'block' ? 'var(--block)' : tile.colored === 'allow' ? 'var(--allow)' : '#FFFFFF',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {tile.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Policy Violations List ── */}
      {(allViolations.length > 0 || explanation) && (
        <div style={{ display: 'grid', gridTemplateColumns: explanation ? '1fr 1fr' : '1fr', gap: '16px' }}>
          {/* Violations */}
          {allViolations.length > 0 && (
            <div className="card-panel" style={{ padding: '22px 24px', border: '1px solid var(--block-border)', background: 'rgba(239,68,68,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <AlertOctagon size={16} style={{ color: 'var(--block)' }} />
                <span style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--block)' }}>
                  Constraint Violations ({allViolations.length})
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {allViolations.map((v, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'flex-start', gap: '10px',
                    padding: '8px 12px', borderRadius: '8px',
                    background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                  }}>
                    <span style={{ color: 'var(--block)', fontSize: '14px', flexShrink: 0, marginTop: '1px' }}>✕</span>
                    <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Explanation */}
          {explanation && (
            <div className="card-panel" style={{ padding: '22px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <Terminal size={16} style={{ color: 'var(--accent-cyan)' }} />
                <span style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--accent-cyan)' }}>
                  Security Rationale
                </span>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.65 }}>{explanation}</p>
              {recovery && (
                <div style={{
                  marginTop: '14px', padding: '12px 14px', borderRadius: '8px',
                  background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.25)',
                }}>
                  <div style={{ fontSize: '10.5px', fontWeight: 800, color: 'var(--allow)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                    Safe Recovery Path
                  </div>
                  <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                    {recovery.description || recovery.action_taken || 'Manual review required.'}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Drilldown Actions ── */}
      <div style={{ display: 'flex', gap: '12px', marginTop: '4px', flexWrap: 'wrap' }}>
        <button className="btn-secondary" style={{ fontSize: '12.5px' }} onClick={() => setActiveTab && setActiveTab('audit-trail')}>
          View in Audit Ledger <ArrowRight size={13} />
        </button>
        <button className="btn-secondary" style={{ fontSize: '12.5px' }} onClick={() => setActiveTab && setActiveTab('architecture')}>
          Architecture Map <ChevronRight size={13} />
        </button>
      </div>
    </motion.div>
  );
}
