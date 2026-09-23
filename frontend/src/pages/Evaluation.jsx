import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, Loader2, CheckSquare, AlertTriangle, ShieldCheck, CheckCircle2, 
  XCircle, FileSpreadsheet, Activity, BarChart3, Shield, RefreshCw, Zap
} from 'lucide-react';
import DecisionBadge from '../components/DecisionBadge';
import { api } from '../services/api';

function MetricCard({ label, value, unit, color, icon: Icon, desc }) {
  return (
    <div style={{
      background: 'var(--surface)',
      border: `1px solid ${color}44`,
      borderRadius: '14px',
      padding: '22px 24px',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      boxShadow: `0 0 20px ${color}15`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
        <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>
          {label}
        </span>
        <div style={{ width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${color}18`, color }}>
          <Icon size={17} />
        </div>
      </div>
      <div>
        <span className="font-mono" style={{ fontSize: '32px', fontWeight: 900, color, lineHeight: 1.1 }}>
          {value !== null && value !== undefined ? value : '—'}
        </span>
        {unit && <span style={{ fontSize: '14px', color: 'var(--text-secondary)', marginLeft: '4px' }}>{unit}</span>}
      </div>
      {desc && <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.4 }}>{desc}</div>}
    </div>
  );
}

export default function Evaluation() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState(null);

  const loadReport = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getEvaluationReport();
      setReport(data);
    } catch (err) {
      setReport(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadReport(); }, []);

  const handleRunEvaluation = async () => {
    try {
      setRunning(true);
      setError(null);
      const data = await api.runFullEvaluation();
      setReport(data);
    } catch (err) {
      setError(err.message || 'Evaluation failed. Ensure backend is running.');
    } finally {
      setRunning(false);
    }
  };

  const metrics = report?.metrics;
  const results = report?.scenario_results || [];
  const tp = results.filter(r => r.expected_decision === 'BLOCK' && r.actual_decision === 'BLOCK').length;
  const tn = results.filter(r => r.expected_decision === 'ALLOW' && r.actual_decision === 'ALLOW').length;
  const fp = results.filter(r => r.expected_decision === 'ALLOW' && r.actual_decision === 'BLOCK').length;
  const fn = results.filter(r => r.expected_decision === 'BLOCK' && r.actual_decision === 'ALLOW').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <CheckSquare size={22} style={{ color: 'var(--accent-cyan)' }} />
            <h1 style={{ fontSize: '26px', fontWeight: 900, letterSpacing: '-0.02em' }}>SECURITY BENCHMARK</h1>
            {report && <span className="badge badge-allow" style={{ fontSize: '10px' }}>Evaluated</span>}
          </div>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', maxWidth: '700px' }}>
            Empirical validation of the TraceGuard zero-trust action firewall across N=25 adversarial and benign control scenarios.
          </p>
        </div>
        <button className="btn-primary" onClick={handleRunEvaluation} disabled={running}>
          {running ? <><Loader2 size={16} className="animate-spin" /> Running Suite...</> : <><Play size={16} /> RUN BENCHMARK (N=25)</>}
        </button>
      </div>

      {/* ── Error ── */}
      {error && (
        <div style={{ padding: '14px 18px', background: 'var(--block-soft)', border: '1px solid var(--block-border)', borderRadius: '10px', color: 'var(--block)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <AlertTriangle size={17} /> {error}
        </div>
      )}

      {/* ── Loading State ── */}
      {loading && !report && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
          <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 12px', color: 'var(--accent-cyan)' }} />
          <div style={{ fontSize: '14px', fontWeight: 600 }}>Loading security benchmark evaluation report...</div>
        </div>
      )}

      {/* ── No report yet ── */}
      {!report && !loading && !error && (
        <div style={{
          textAlign: 'center', padding: '60px 20px',
          background: 'var(--surface)', border: '1px dashed var(--border)', borderRadius: '14px',
        }}>
          <CheckSquare size={40} style={{ color: 'var(--accent-cyan)', opacity: 0.4, margin: '0 auto 14px' }} />
          <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
            No evaluation report available yet
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>
            Run the full benchmark suite to generate measured accuracy metrics.
          </div>
          <button className="btn-primary" onClick={handleRunEvaluation} disabled={running}>
            <Play size={15} /> Run Full Benchmark (N=25)
          </button>
        </div>
      )}

      {/* ── Metric Cards ── */}
      {metrics && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
          <MetricCard 
            label="Block Rate" 
            value={metrics.block_rate != null ? (metrics.block_rate <= 1.0 && metrics.block_rate > 0 ? (metrics.block_rate * 100).toFixed(1) : Number(metrics.block_rate).toFixed(1)) : '—'} 
            unit="%" 
            color="var(--block)" 
            icon={ShieldCheck} 
            desc="True attack detection rate" 
          />
          <MetricCard 
            label="False Positive Rate" 
            value={metrics.false_positive_rate != null ? (metrics.false_positive_rate <= 1.0 && metrics.false_positive_rate > 0 ? (metrics.false_positive_rate * 100).toFixed(1) : Number(metrics.false_positive_rate).toFixed(1)) : '—'} 
            unit="%" 
            color="var(--ask)" 
            icon={AlertTriangle} 
            desc="Clean actions incorrectly blocked" 
          />
          <MetricCard 
            label="Intent Catch Rate" 
            value={metrics.intent_violation_catch_rate != null ? (metrics.intent_violation_catch_rate <= 1.0 && metrics.intent_violation_catch_rate > 0 ? (metrics.intent_violation_catch_rate * 100).toFixed(1) : Number(metrics.intent_violation_catch_rate).toFixed(1)) : '—'} 
            unit="%" 
            color="var(--accent-cyan)" 
            icon={Shield} 
            desc="Intent violations correctly caught" 
          />
          <MetricCard 
            label="Avg Latency" 
            value={(metrics.avg_latency_ms ?? metrics.average_latency_ms) != null ? Number(metrics.avg_latency_ms ?? metrics.average_latency_ms).toFixed(1) : '—'} 
            unit="ms" 
            color="var(--accent-blue-light)" 
            icon={Activity} 
            desc="Per-scenario evaluation time" 
          />
          <MetricCard 
            label="Total Scenarios" 
            value={results.length || metrics.total_scenarios || 25} 
            color="var(--text-secondary)" 
            icon={FileSpreadsheet} 
            desc="Evaluated in this benchmark run" 
          />
          <MetricCard 
            label="Passed (TP+TN)" 
            value={metrics.passed_scenarios != null ? metrics.passed_scenarios : (tp + tn)} 
            color="var(--allow)" 
            icon={CheckCircle2} 
            desc="Correctly classified decisions" 
          />
        </div>
      )}

      {/* ── Confusion Matrix ── */}
      {results.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div className="card-panel" style={{ padding: '22px 24px' }}>
            <div style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '16px' }}>Confusion Matrix</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {[
                { label: 'True Positive', desc: 'Correctly blocked attacks', value: tp, color: 'var(--allow)' },
                { label: 'True Negative', desc: 'Correctly allowed clean', value: tn, color: 'var(--allow)' },
                { label: 'False Positive', desc: 'Clean incorrectly blocked', value: fp, color: 'var(--ask)' },
                { label: 'False Negative', desc: 'Attack incorrectly allowed', value: fn, color: 'var(--block)' },
              ].map((item, i) => (
                <div key={i} style={{ padding: '14px', borderRadius: '10px', background: 'rgba(0,0,0,0.3)', border: `1px solid ${item.color}33`, textAlign: 'center' }}>
                  <div className="font-mono" style={{ fontSize: '26px', fontWeight: 800, color: item.color }}>{item.value}</div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#FFFFFF', marginTop: '4px' }}>{item.label}</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>{item.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Summary stats */}
          <div className="card-panel" style={{ padding: '22px 24px' }}>
            <div style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '16px' }}>Benchmark Summary</div>
            {[
              { label: 'Accuracy', value: results.length > 0 ? `${((tp + tn) / results.length * 100).toFixed(1)}%` : '—', color: 'var(--allow)' },
              { label: 'Precision', value: (tp + fp) > 0 ? `${(tp / (tp + fp) * 100).toFixed(1)}%` : '—', color: 'var(--accent-cyan)' },
              { label: 'Recall (Sensitivity)', value: (tp + fn) > 0 ? `${(tp / (tp + fn) * 100).toFixed(1)}%` : '—', color: 'var(--accent-blue-light)' },
              { label: 'Total Tests', value: String(results.length), color: 'var(--text-secondary)' },
            ].map((row, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: i < 3 ? '1px solid var(--border)' : 'none' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{row.label}</span>
                <span className="font-mono" style={{ fontSize: '16px', fontWeight: 800, color: row.color }}>{row.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Scenario Results Table ── */}
      {results.length > 0 && (
        <div className="card-panel" style={{ padding: '24px 28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
            <BarChart3 size={18} style={{ color: 'var(--accent-cyan)' }} />
            <h3 style={{ fontSize: '15px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Scenario Results Matrix</h3>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Scenario', 'Category', 'Expected', 'Actual', 'Result', 'Latency'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: '10.5px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {results.map((row, idx) => {
                  const passed = row.expected_decision === row.actual_decision;
                  return (
                    <motion.tr
                      key={row.scenario_id || idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.025 }}
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: idx % 2 === 0 ? 'rgba(0,0,0,0.2)' : 'transparent' }}
                    >
                      <td style={{ padding: '10px 14px', color: '#FFFFFF', fontWeight: 600 }}>{row.name || row.scenario_id}</td>
                      <td style={{ padding: '10px 14px', color: 'var(--text-muted)' }}>{row.category || '—'}</td>
                      <td style={{ padding: '10px 14px' }}><DecisionBadge decision={row.expected_decision} /></td>
                      <td style={{ padding: '10px 14px' }}><DecisionBadge decision={row.actual_decision} /></td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{
                          fontSize: '10.5px', padding: '3px 9px', borderRadius: '999px', fontWeight: 800,
                          background: passed ? 'rgba(16,185,129,0.14)' : 'rgba(239,68,68,0.14)',
                          color: passed ? 'var(--allow)' : 'var(--block)',
                          border: `1px solid ${passed ? 'var(--allow-border)' : 'var(--block-border)'}`,
                        }}>
                          {passed ? '✓ PASS' : '✗ FAIL'}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px' }} className="font-mono">
                        <span style={{ color: (row.latency_ms || 0) < 200 ? 'var(--allow)' : 'var(--ask)', fontSize: '12px' }}>
                          {row.latency_ms ? `${row.latency_ms.toFixed(0)}ms` : '—'}
                        </span>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
