import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, ShieldAlert, ShieldCheck, RefreshCw, AlertCircle,
  Filter, CheckCircle2, XCircle, Terminal, Play, Loader2, Shield,
  SkullIcon, Siren, Bug, Code2
} from 'lucide-react';
import DecisionBadge from '../components/DecisionBadge';
import { api } from '../services/api';

const CATEGORY_CONFIG = {
  'PROMPT_INJECTION': { label: 'Prompt Injection', color: 'var(--block)', bg: 'rgba(239,68,68,0.12)', icon: Zap },
  'BENEFICIARY_FRAUD': { label: 'Beneficiary Fraud', color: '#F97316', bg: 'rgba(249,115,22,0.12)', icon: ShieldAlert },
  'DATA_EXFILTRATION': { label: 'Data Exfiltration', color: '#A78BFA', bg: 'rgba(167,139,250,0.12)', icon: Terminal },
  'VENDOR_FRAUD': { label: 'Vendor Fraud', color: 'var(--ask)', bg: 'rgba(245,158,11,0.12)', icon: ShieldAlert },
  'ROLE_IMPERSONATION': { label: 'Role Impersonation', color: '#38BDF8', bg: 'rgba(56,189,248,0.12)', icon: Bug },
  'COMBINED_ATTACK': { label: 'Combined Attack', color: 'var(--block)', bg: 'rgba(239,68,68,0.12)', icon: Code2 },
  'CONTROL': { label: 'Clean Control', color: 'var(--allow)', bg: 'rgba(16,185,129,0.12)', icon: CheckCircle2 },
};

const THREAT_LEVELS = {
  CRITICAL: { color: 'var(--block)', label: 'CRITICAL' },
  HIGH: { color: '#F97316', label: 'HIGH' },
  MEDIUM: { color: 'var(--ask)', label: 'MEDIUM' },
  LOW: { color: 'var(--allow)', label: 'LOW' },
  NONE: { color: 'var(--allow)', label: 'NONE' },
};

export default function AttackPlayground() {
  const [scenarios, setScenarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [runningId, setRunningId] = useState(null);
  const [resultMap, setResultMap] = useState({});
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [error, setError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  const loadScenarios = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getScenarios();
      setScenarios(data || []);
    } catch (err) {
      setError('Unable to load scenarios. Ensure backend is running on http://127.0.0.1:8000');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadScenarios(); }, []);

  const handleRunScenario = async (scenarioId) => {
    try {
      setRunningId(scenarioId);
      setExpandedId(scenarioId);
      const res = await api.runScenario(scenarioId);
      setResultMap(prev => ({ ...prev, [scenarioId]: res }));
    } catch (err) {
      setResultMap(prev => ({ ...prev, [scenarioId]: { error: err.message } }));
    } finally {
      setRunningId(null);
    }
  };

  const categories = ['ALL', ...new Set(scenarios.map(s => s.category).filter(Boolean))];
  const filtered = filterCategory === 'ALL' ? scenarios : scenarios.filter(s => s.category === filterCategory);

  const totalRun = Object.keys(resultMap).length;
  const totalBlocked = Object.values(resultMap).filter(r => (r.overall_decision || '').toUpperCase() === 'BLOCK').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>

      {/* ── Header ── */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
          <Zap size={22} style={{ color: '#A78BFA' }} />
          <h1 style={{ fontSize: '26px', fontWeight: 900, letterSpacing: '-0.02em' }}>ATTACK PLAYGROUND</h1>
          <span className="badge badge-neutral" style={{ fontSize: '10px' }}>N=25 SCENARIOS</span>
        </div>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', maxWidth: '700px' }}>
          Test TraceGuard against adversarial agent scenarios. Each attack attempts to bypass the Action Firewall through different manipulation vectors.
        </p>
      </div>

      {/* ── Stats bar ── */}
      {totalRun > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
          {[
            { label: 'Attacks Run', value: totalRun, color: 'var(--accent-cyan)' },
            { label: 'Blocked by Firewall', value: totalBlocked, color: 'var(--block)' },
            { label: 'Block Rate', value: totalRun > 0 ? `${Math.round(totalBlocked / totalRun * 100)}%` : '—', color: totalBlocked === totalRun ? 'var(--allow)' : 'var(--ask)' },
          ].map((s, i) => (
            <div key={i} style={{
              padding: '12px 20px', borderRadius: '10px',
              background: 'var(--surface)', border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', gap: '12px',
            }}>
              <span className="font-mono" style={{ fontSize: '22px', fontWeight: 800, color: s.color }}>{s.value}</span>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</span>
            </div>
          ))}
        </motion.div>
      )}

      {/* ── Category filter ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        <Filter size={14} style={{ color: 'var(--text-muted)' }} />
        {categories.map(cat => {
          const cfg = CATEGORY_CONFIG[cat];
          return (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`btn-secondary ${filterCategory === cat ? 'active' : ''}`}
              style={{ fontSize: '11.5px', padding: '5px 12px' }}
            >
              {cfg ? cfg.label : cat}
            </button>
          );
        })}
        <button className="btn-secondary" style={{ fontSize: '11.5px', padding: '5px 12px', marginLeft: 'auto' }} onClick={loadScenarios} disabled={loading}>
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* ── Error ── */}
      {error && (
        <div style={{ padding: '16px 20px', background: 'var(--block-soft)', border: '1px solid var(--block-border)', borderRadius: '10px', color: 'var(--block)', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px' }}>
          <AlertCircle size={18} /> {error}
        </div>
      )}

      {/* ── Skeleton / Scenarios ── */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
          {[1,2,3,4,5,6].map(i => <div key={i} className="skeleton-line" style={{ height: '180px', borderRadius: '12px' }} />)}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
          {filtered.map((scenario, idx) => {
            const cat = CATEGORY_CONFIG[scenario.category] || CATEGORY_CONFIG['COMBINED_ATTACK'];
            const threat = THREAT_LEVELS[scenario.threat_level?.toUpperCase()] || THREAT_LEVELS.MEDIUM;
            const result = resultMap[scenario.scenario_id];
            const isRunning = runningId === scenario.scenario_id;
            const isExpanded = expandedId === scenario.scenario_id;
            const decision = result?.overall_decision;
            const isBlocked = decision === 'BLOCK';
            const isAllow = decision === 'ALLOW';
            const hasError = result?.error;

            return (
              <motion.div
                key={scenario.scenario_id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
                style={{
                  background: result 
                    ? (isBlocked ? 'linear-gradient(135deg, rgba(239,68,68,0.1), var(--surface))' : 'linear-gradient(135deg, rgba(16,185,129,0.08), var(--surface))')
                    : 'var(--surface)',
                  border: `1.5px solid ${result ? (isBlocked ? 'rgba(239,68,68,0.4)' : 'rgba(16,185,129,0.35)') : cat.color + '33'}`,
                  borderRadius: '14px',
                  overflow: 'hidden',
                  transition: 'all 0.25s ease',
                  boxShadow: result && isBlocked ? '0 0 20px rgba(239,68,68,0.15)' : 'none',
                }}
              >
                {/* Card header */}
                <div style={{ padding: '18px 20px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{
                        width: '32px', height: '32px', borderRadius: '8px', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: cat.bg, color: cat.color,
                      }}>
                        <cat.icon size={16} />
                      </div>
                      <div style={{ fontSize: '9.5px', fontWeight: 800, letterSpacing: '0.06em', color: cat.color, textTransform: 'uppercase' }}>
                        {cat.label}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{
                        fontSize: '9.5px', padding: '2px 7px', borderRadius: '999px',
                        fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em',
                        background: threat.color + '22', color: threat.color, border: `1px solid ${threat.color}55`,
                      }}>
                        {threat.label}
                      </span>
                      {result && <DecisionBadge decision={decision} />}
                    </div>
                  </div>

                  <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#FFFFFF', marginBottom: '6px', lineHeight: 1.3 }}>
                    {scenario.name || scenario.scenario_id}
                  </h3>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {scenario.description || 'Adversarial attack scenario.'}
                  </p>
                </div>

                {/* Expanded result */}
                <AnimatePresence>
                  {isExpanded && result && !hasError && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      style={{ overflow: 'hidden' }}
                    >
                      <div style={{ padding: '0 20px 14px', borderTop: '1px solid var(--border)', paddingTop: '14px' }}>
                        <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '8px' }}>
                          Firewall Evidence
                        </div>
                        {(result.evaluations || []).slice(0, 3).map((ev, i) => (
                          <div key={i} style={{
                            fontSize: '11.5px', color: ev.decision === 'BLOCK' ? '#FCA5A5' : 'var(--text-secondary)',
                            padding: '4px 0', borderBottom: '1px solid var(--border)',
                          }}>
                            <strong className="font-mono">{ev.action_name || ev.action_type}</strong>: {ev.decision}
                            {ev.violated_constraints?.[0] && <span style={{ color: 'var(--text-muted)' }}> — {ev.violated_constraints[0]}</span>}
                          </div>
                        ))}
                        {result.explanation && (
                          <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '8px', lineHeight: 1.5 }}>
                            {result.explanation}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {hasError && (
                  <div style={{ padding: '10px 20px', background: 'var(--block-soft)', fontSize: '11.5px', color: 'var(--block)' }}>
                    Error: {result.error}
                  </div>
                )}

                {/* Action row */}
                <div style={{ padding: '12px 20px 18px', display: 'flex', gap: '8px' }}>
                  <button
                    className="btn-primary"
                    style={{ flex: 1, fontSize: '12.5px', padding: '9px' }}
                    onClick={() => handleRunScenario(scenario.scenario_id)}
                    disabled={isRunning}
                  >
                    {isRunning ? <><Loader2 size={14} className="animate-spin" /> Running...</> : <><Play size={14} /> Run Attack</>}
                  </button>
                  {result && (
                    <button
                      className="btn-secondary"
                      style={{ fontSize: '11.5px', padding: '9px 14px' }}
                      onClick={() => setExpandedId(isExpanded ? null : scenario.scenario_id)}
                    >
                      {isExpanded ? 'Collapse' : 'Evidence'}
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
