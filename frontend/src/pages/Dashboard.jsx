import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Activity,
  ArrowRight,
  CheckCircle2,
  RefreshCw,
  AlertTriangle,
  Lock,
  Zap,
  FileText,
  Fingerprint,
  Building,
  Terminal,
  ChevronRight,
  Play,
  Shield
} from 'lucide-react';
import DecisionBadge from '../components/DecisionBadge';
import { api } from '../services/api';

// Animated security flow particle
function FlowParticle({ animKey }) {
  return (
    <motion.div
      key={animKey}
      style={{
        position: 'absolute',
        top: '50%',
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        background: 'var(--accent-cyan)',
        boxShadow: '0 0 10px var(--accent-cyan), 0 0 20px var(--accent-cyan)',
        transform: 'translateY(-50%)',
        zIndex: 10,
      }}
      initial={{ left: '0%', opacity: 0 }}
      animate={{ left: '100%', opacity: [0, 1, 1, 0] }}
      transition={{ duration: 2.5, ease: 'easeInOut', times: [0, 0.1, 0.9, 1] }}
    />
  );
}

// Large hero pipeline node
function HeroPipelineNode({ icon: Icon, label, sublabel, color = 'var(--accent-cyan)', active = false, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        gap: '10px',
        minWidth: '90px',
      }}
    >
      <div style={{
        width: '60px',
        height: '60px',
        borderRadius: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: active ? `rgba(6,182,212,0.18)` : 'rgba(13,22,41,0.9)',
        border: `1.5px solid ${active ? color : 'rgba(255,255,255,0.1)'}`,
        color: active ? color : 'var(--text-muted)',
        boxShadow: active ? `0 0 20px ${color}55` : 'none',
        transition: 'all 0.4s ease',
      }}>
        <Icon size={24} />
      </div>
      <div>
        <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '0.03em' }}>{label}</div>
        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '1px' }}>{sublabel}</div>
      </div>
    </motion.div>
  );
}

// Animated connector beam
function BeamConnector({ active, particleKey }) {
  return (
    <div style={{ flex: 1, height: '2px', background: 'rgba(255,255,255,0.08)', position: 'relative', minWidth: '20px', alignSelf: 'center', marginBottom: '38px' }}>
      {active && (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(90deg, var(--accent-blue) 0%, var(--accent-cyan) 100%)',
          boxShadow: '0 0 10px var(--accent-cyan)',
        }} />
      )}
      {active && <FlowParticle animKey={particleKey} />}
    </div>
  );
}

export default function Dashboard({ setActiveTab, isOnline = true }) {
  const [auditEvents, setAuditEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [particleKey, setParticleKey] = useState(0);

  // Cycle the hero particle animation
  useEffect(() => {
    const interval = setInterval(() => setParticleKey(k => k + 1), 3200);
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const events = await api.getAuditTrail(25);
      setAuditEvents(events || []);
    } catch (err) {
      setError('Backend offline. Start FastAPI on port 8000.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadDashboardData(); }, []);

  const totalEvents = auditEvents.length;
  const blockedEvents = auditEvents.filter(e => (e.decision || e.overall_decision || '').toUpperCase() === 'BLOCK');
  const allowedEvents = auditEvents.filter(e => (e.decision || e.overall_decision || '').toUpperCase() === 'ALLOW');
  const askUserEvents = auditEvents.filter(e => (e.decision || e.overall_decision || '').toUpperCase().includes('ASK'));
  const latestBlocked = blockedEvents[0];
  const recentEvents = auditEvents.slice(0, 6);

  const pipelineNodes = [
    { icon: Lock, label: 'USER INTENT', sublabel: 'Ground Truth', color: 'var(--accent-cyan)' },
    { icon: FileText, label: 'SOURCE', sublabel: 'Untrusted Input', color: 'var(--accent-cyan)' },
    { icon: Zap, label: 'INJECTION', sublabel: 'Attack Analysis', color: 'var(--accent-blue-light)' },
    { icon: Fingerprint, label: 'TAINT', sublabel: 'Lineage Track', color: 'var(--accent-blue-light)' },
    { icon: Terminal, label: 'AGENT PLAN', sublabel: 'Tool Calls', color: '#8B5CF6' },
    { icon: Building, label: 'VENDOR', sublabel: 'Verify Identity', color: '#8B5CF6' },
    { icon: Shield, label: 'FIREWALL', sublabel: 'Zero-Trust Gate', color: 'var(--accent-cyan)' },
    { icon: CheckCircle2, label: 'DECISION', sublabel: 'Allow/Block', color: 'var(--allow)' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>

      {/* ═══════════════════════════════════════════════
          HERO SECTION — Command Center Landing
          ═══════════════════════════════════════════════ */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        style={{
          background: 'radial-gradient(ellipse at 50% 0%, #0D1E40 0%, #08101E 100%)',
          border: '1px solid rgba(29, 99, 237, 0.25)',
          borderRadius: '20px',
          padding: '52px 52px 44px 52px',
          display: 'flex',
          flexDirection: 'column',
          gap: '36px',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 16px 60px rgba(0,0,0,0.7), 0 0 60px rgba(29,99,237,0.08)',
        }}
      >
        {/* Background mesh decoration */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: `radial-gradient(circle at 80% 20%, rgba(6,182,212,0.06) 0%, transparent 50%), radial-gradient(circle at 10% 80%, rgba(29,99,237,0.06) 0%, transparent 50%)`,
        }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: '720px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '5px 14px', borderRadius: '999px',
            background: 'rgba(6,182,212,0.12)', border: '1px solid rgba(6,182,212,0.35)',
            color: 'var(--accent-cyan-light)', fontSize: '11px', fontWeight: 800,
            letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '20px',
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--accent-cyan)', boxShadow: '0 0 8px var(--accent-cyan)' }} />
            Explainable Action Firewall for AI Agents
          </div>

          <h1 style={{
            fontSize: '44px', fontWeight: 900, lineHeight: 1.1,
            letterSpacing: '-0.03em', color: '#FFFFFF', marginBottom: '12px',
          }}>
            From Untrusted Content
            <br />
            <span style={{
              background: 'linear-gradient(90deg, #22D3EE 0%, #3B82F6 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>
              to Trusted Action.
            </span>
          </h1>

          <p style={{ fontSize: '16px', color: 'var(--text-secondary)', lineHeight: 1.65, marginBottom: '28px', maxWidth: '600px' }}>
            Protect tool-using AI agents from indirect prompt injection and unauthorized actions. 
            Every proposed tool call is verified against the immutable user intent contract before execution.
          </p>

          <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
            <button
              className="btn-primary"
              style={{ padding: '14px 28px', fontSize: '14px', fontWeight: 800, letterSpacing: '0.04em' }}
              onClick={() => setActiveTab('live-security')}
            >
              <Play size={17} />
              LIVE SECURITY DEMO
            </button>
            <button
              className="btn-secondary"
              style={{ padding: '14px 24px', fontSize: '14px', fontWeight: 700 }}
              onClick={() => setActiveTab('architecture')}
            >
              EXPLORE ARCHITECTURE
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Animated Security Pipeline */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '16px' }}>
            Security Enforcement Pipeline
          </div>
          <div style={{ display: 'flex', alignItems: 'center', overflowX: 'auto', paddingBottom: '8px', gap: '4px' }}>
            {pipelineNodes.map((node, idx) => (
              <React.Fragment key={idx}>
                <HeroPipelineNode {...node} active delay={idx * 0.06} />
                {idx < pipelineNodes.length - 1 && (
                  <BeamConnector active particleKey={`${particleKey}-${idx}`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </motion.section>

      {/* ═══════════════════════════════════════════════
          SYSTEM STATUS INDICATORS
          ═══════════════════════════════════════════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '18px' }}>
        {[
          {
            label: 'FIREWALL', status: 'ENFORCING', desc: 'Zero-Trust action gating',
            color: 'var(--allow)', icon: Shield, borderColor: 'rgba(16,185,129,0.3)',
          },
          {
            label: 'TAINT TRACKING', status: 'ACTIVE', desc: 'Lineage propagation running',
            color: 'var(--accent-cyan)', icon: Fingerprint, borderColor: 'rgba(6,182,212,0.3)',
          },
          {
            label: 'AUDIT', status: 'RECORDING', desc: `${totalEvents} events in immutable ledger`,
            color: 'var(--accent-blue-light)', icon: Activity, borderColor: 'rgba(29,99,237,0.3)',
          },
        ].map((item, i) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 + 0.3 }}
              style={{
                background: 'var(--surface)',
                border: `1px solid ${item.borderColor}`,
                borderRadius: '14px',
                padding: '22px 24px',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                boxShadow: `0 0 24px ${item.borderColor}`,
              }}
            >
              <div style={{
                width: '48px', height: '48px', borderRadius: '12px', flexShrink: 0,
                background: `rgba(${item.color === 'var(--allow)' ? '16,185,129' : item.color === 'var(--accent-cyan)' ? '6,182,212' : '29,99,237'},0.12)`,
                border: `1px solid ${item.borderColor}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: item.color,
              }}>
                <Icon size={22} />
              </div>
              <div>
                <div style={{ fontSize: '10.5px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.07em', color: item.color }}>
                  {item.label}
                </div>
                <div style={{ fontSize: '17px', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.01em', margin: '2px 0' }}>
                  {item.status}
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>{item.desc}</div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ═══════════════════════════════════════════════
          KPI METRICS STRIP
          ═══════════════════════════════════════════════ */}
      <div className="status-grid">
        {[
          { label: 'Monitored Actions', value: totalEvents, sub: 'Total decisions in ledger', color: 'var(--accent-cyan)', icon: Activity },
          { label: 'Actions Blocked', value: blockedEvents.length, sub: 'Intercepted rogue actions', color: 'var(--block)', icon: ShieldAlert },
          { label: 'Actions Authorized', value: allowedEvents.length, sub: 'Compliant with intent', color: 'var(--allow)', icon: CheckCircle2 },
          { label: 'Human Escalations', value: askUserEvents.length, sub: 'Required confirmation', color: 'var(--ask)', icon: AlertTriangle },
        ].map((m, i) => {
          const Icon = m.icon;
          return (
            <motion.div
              key={i}
              className="kpi-card"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 + 0.2 }}
            >
              <div className="kpi-header">
                <span className="kpi-label">{m.label}</span>
                <div className="kpi-icon-wrap" style={{ color: m.color }}>
                  <Icon size={17} />
                </div>
              </div>
              <div className="kpi-value font-mono" style={{ color: m.value > 0 ? m.color : 'inherit' }}>
                {loading ? '—' : m.value}
              </div>
              <div className="kpi-subtext">{m.sub}</div>
            </motion.div>
          );
        })}
      </div>

      {/* ═══════════════════════════════════════════════
          CRITICAL INTERCEPT ALERT
          ═══════════════════════════════════════════════ */}
      <AnimatePresence>
        {latestBlocked && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              background: 'linear-gradient(135deg, rgba(239,68,68,0.12) 0%, rgba(13,22,41,0.99) 100%)',
              border: '1.5px solid var(--block)',
              borderRadius: '14px',
              padding: '20px 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '16px',
              boxShadow: '0 0 32px rgba(239,68,68,0.2)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                width: '44px', height: '44px', borderRadius: '10px', flexShrink: 0,
                background: 'rgba(239,68,68,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--block)',
              }}>
                <ShieldAlert size={22} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span className="badge badge-block">Critical Intercept</span>
                  <code className="font-mono" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {latestBlocked.event_id || 'evt_latest'}
                  </code>
                </div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#FFFFFF' }}>
                  Action: <code className="font-mono" style={{ color: '#FCA5A5' }}>{latestBlocked.action_type || latestBlocked.action_name || 'unauthorized_action'}</code>
                </div>
                <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginTop: '2px', maxWidth: '640px' }}>
                  {latestBlocked.reason || 'Exceeded authorized User Intent Contract boundary.'}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button className="btn-secondary" style={{ fontSize: '12px', borderColor: 'rgba(239,68,68,0.4)', color: 'var(--block)' }} onClick={() => setActiveTab('live-security')}>
                Open Action Firewall <ArrowRight size={13} />
              </button>
              <button className="btn-secondary" style={{ fontSize: '12px' }} onClick={() => setActiveTab('audit-trail')}>
                View Audit Ledger
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════
          QUICK ACCESS CARDS
          ═══════════════════════════════════════════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '18px' }}>
        {[
          {
            id: 'live-security',
            badge: 'Main Demo',
            title: 'Live Security Pipeline',
            desc: 'Watch TraceGuard intercept prompt injections, beneficiary fraud, and data exfiltration in real time.',
            color: 'rgba(29,99,237,0.2)',
            border: 'rgba(29,99,237,0.35)',
            icon: Shield,
            iconColor: 'var(--accent-blue-light)',
            btn: 'Open Live Demo',
            primary: true,
          },
          {
            id: 'attack-playground',
            badge: '25 Scenarios',
            title: 'Attack Playground',
            desc: 'Test adversarial attack patterns against the action firewall. Simulate prompt injection, homoglyph fraud, and exfiltration.',
            color: 'rgba(139,92,246,0.12)',
            border: 'rgba(139,92,246,0.3)',
            icon: Zap,
            iconColor: '#A78BFA',
            btn: 'Enter Lab',
            primary: false,
          },
          {
            id: 'evaluation',
            badge: 'Benchmark',
            title: 'Security Evaluation',
            desc: 'Run the full benchmark suite across N=25 adversarial scenarios. View block rates, latency, and intent-violation catch rates.',
            color: 'rgba(16,185,129,0.1)',
            border: 'rgba(16,185,129,0.3)',
            icon: Activity,
            iconColor: 'var(--allow)',
            btn: 'Run Benchmark',
            primary: false,
          },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.id}
              whileHover={{ y: -3 }}
              transition={{ duration: 0.2 }}
              style={{
                background: `linear-gradient(135deg, ${card.color} 0%, var(--surface) 100%)`,
                border: `1px solid ${card.border}`,
                borderRadius: '16px',
                padding: '26px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '16px',
                minHeight: '180px',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span className="badge badge-cyan" style={{ fontSize: '10px' }}>{card.badge}</span>
                  <Icon size={20} style={{ color: card.iconColor }} />
                </div>
                <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#FFFFFF', marginBottom: '8px' }}>{card.title}</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{card.desc}</p>
              </div>
              <button
                className={card.primary ? 'btn-primary' : 'btn-secondary'}
                style={{ width: '100%' }}
                onClick={() => setActiveTab(card.id)}
              >
                {card.btn} <ArrowRight size={14} />
              </button>
            </motion.div>
          );
        })}
      </div>

      {/* ═══════════════════════════════════════════════
          RECENT SECURITY DECISIONS
          ═══════════════════════════════════════════════ */}
      <div className="card-panel" style={{ padding: '24px 28px' }}>
        <div className="panel-header" style={{ marginBottom: '18px' }}>
          <div className="panel-title">
            <Activity size={18} style={{ color: 'var(--accent-cyan)' }} />
            Recent Security Decisions
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn-secondary" style={{ fontSize: '11.5px', padding: '6px 12px' }} onClick={loadDashboardData} disabled={loading}>
              <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
            <button className="btn-secondary" style={{ fontSize: '12px', color: 'var(--accent-cyan)', borderColor: 'rgba(6,182,212,0.4)' }} onClick={() => setActiveTab('audit-trail')}>
              View All <ArrowRight size={13} />
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[1,2,3].map(i => <div key={i} className="skeleton-line" style={{ height: '48px', borderRadius: '8px' }} />)}
          </div>
        ) : error ? (
          <div style={{ padding: '20px', background: 'var(--block-soft)', border: '1px solid var(--block-border)', borderRadius: '8px', color: 'var(--block)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShieldAlert size={18} /> {error}
          </div>
        ) : recentEvents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            <Shield size={36} style={{ margin: '0 auto 12px', color: 'var(--accent-cyan)', opacity: 0.5 }} />
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>No security events yet</div>
            <div style={{ fontSize: '13px' }}>Run a scenario in Live Security to populate the audit ledger.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {recentEvents.map((ev, idx) => {
              const dec = ev.decision || ev.overall_decision || 'BLOCK';
              const timeStr = ev.timestamp ? new Date(ev.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Recent';
              return (
                <motion.div
                  key={ev.event_id || idx}
                  className="decision-preview-row"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.04 }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: '200px' }}>
                    <code className="font-mono" style={{ fontSize: '10.5px', color: 'var(--text-dim)', minWidth: '65px' }}>{timeStr}</code>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF' }}>{ev.action_type || ev.action_name || 'action'}</div>
                      {ev.source_id && <div className="font-mono" style={{ fontSize: '10.5px', color: 'var(--accent-cyan)', opacity: 0.7 }}>src: {ev.source_id}</div>}
                    </div>
                  </div>
                  <div style={{ flex: 1, fontSize: '12.5px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {ev.reason || 'Evaluated against security policy'}
                  </div>
                  <DecisionBadge decision={dec} />
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
