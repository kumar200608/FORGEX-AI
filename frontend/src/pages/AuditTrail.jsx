import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, Filter, RefreshCw, ShieldAlert, CheckCircle2, AlertTriangle,
  Search, X, Copy, Check, Code2, Terminal, Shield, Hash
} from 'lucide-react';
import DecisionBadge from '../components/DecisionBadge';
import { api } from '../services/api';

const TIMELINE_ICONS = {
  BLOCK: { icon: ShieldAlert, color: 'var(--block)', bg: 'rgba(239,68,68,0.14)' },
  ALLOW: { icon: CheckCircle2, color: 'var(--allow)', bg: 'rgba(16,185,129,0.12)' },
  ASK_USER: { icon: AlertTriangle, color: 'var(--ask)', bg: 'rgba(245,158,11,0.12)' },
};

export default function AuditTrail() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterDecision, setFilterDecision] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [error, setError] = useState(null);
  const [copiedKey, setCopiedKey] = useState(null);

  const loadAuditEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getAuditTrail(100);
      setEvents(data || []);
    } catch (err) {
      setError('Unable to load audit trail. Ensure backend is running on http://127.0.0.1:8000');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAuditEvents(); }, []);

  const filteredEvents = useMemo(() => {
    return events.filter(e => {
      const dec = e.decision || e.overall_decision;
      if (filterDecision !== 'ALL' && dec !== filterDecision) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        (e.event_id && e.event_id.toLowerCase().includes(q)) ||
        (e.action_name && e.action_name.toLowerCase().includes(q)) ||
        (e.action_type && e.action_type.toLowerCase().includes(q)) ||
        (e.reason && e.reason.toLowerCase().includes(q)) ||
        (e.source_id && e.source_id.toLowerCase().includes(q))
      );
    });
  }, [events, filterDecision, searchQuery]);

  const counts = {
    ALL: events.length,
    BLOCK: events.filter(e => (e.decision || e.overall_decision) === 'BLOCK').length,
    ALLOW: events.filter(e => (e.decision || e.overall_decision) === 'ALLOW').length,
    ASK_USER: events.filter(e => (e.decision || e.overall_decision) === 'ASK_USER').length,
  };

  const copy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <Clock size={22} style={{ color: 'var(--accent-cyan)' }} />
            <h1 style={{ fontSize: '26px', fontWeight: 900, letterSpacing: '-0.02em' }}>FORENSIC AUDIT TRAIL</h1>
          </div>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', maxWidth: '700px' }}>
            Immutable, cryptographically hashed enforcement ledger. Every intercepted and authorized agent action recorded.
          </p>
        </div>
        <button className="btn-secondary" onClick={loadAuditEvents} disabled={loading}>
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh Ledger
        </button>
      </div>

      {/* ── Metrics strip ── */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        {[
          { label: 'Total Events', value: counts.ALL, color: 'var(--accent-cyan)' },
          { label: 'Blocked', value: counts.BLOCK, color: 'var(--block)' },
          { label: 'Allowed', value: counts.ALLOW, color: 'var(--allow)' },
          { label: 'Escalated', value: counts.ASK_USER, color: 'var(--ask)' },
        ].map((m, i) => (
          <div key={i} style={{ padding: '10px 18px', borderRadius: '10px', background: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="font-mono" style={{ fontSize: '20px', fontWeight: 800, color: m.color }}>{m.value}</span>
            <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{m.label}</span>
          </div>
        ))}
      </div>

      {/* ── Search + Filter ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '280px', maxWidth: '400px' }}>
          <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '34px', fontSize: '12.5px' }}
            placeholder="Filter by event ID, action, reason, source..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', cursor: 'pointer' }}>
              <X size={14} />
            </button>
          )}
        </div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {['ALL', 'BLOCK', 'ALLOW', 'ASK_USER'].map(f => (
            <button
              key={f}
              onClick={() => setFilterDecision(f)}
              style={{
                padding: '7px 14px', borderRadius: '999px', fontSize: '11.5px', fontWeight: 700,
                cursor: 'pointer', transition: 'all 0.18s ease',
                background: filterDecision === f ? (f === 'BLOCK' ? 'rgba(239,68,68,0.2)' : f === 'ALLOW' ? 'rgba(16,185,129,0.2)' : f === 'ASK_USER' ? 'rgba(245,158,11,0.2)' : 'rgba(29,99,237,0.2)') : 'var(--surface)',
                border: `1px solid ${filterDecision === f ? (f === 'BLOCK' ? 'var(--block)' : f === 'ALLOW' ? 'var(--allow)' : f === 'ASK_USER' ? 'var(--ask)' : 'var(--accent-blue-light)') : 'var(--border)'}`,
                color: filterDecision === f ? '#FFFFFF' : 'var(--text-secondary)',
              }}
            >
              {f === 'ALL' ? 'All' : f === 'ASK_USER' ? 'Ask User' : f} ({counts[f]})
            </button>
          ))}
        </div>
      </div>

      {/* ── Error ── */}
      {error && (
        <div style={{ padding: '14px 18px', background: 'var(--block-soft)', border: '1px solid var(--block-border)', borderRadius: '10px', color: 'var(--block)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <ShieldAlert size={17} /> {error}
        </div>
      )}

      {/* ── Timeline ── */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[1,2,3,4,5].map(i => <div key={i} className="skeleton-line" style={{ height: '72px', borderRadius: '10px' }} />)}
        </div>
      ) : filteredEvents.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
          <Shield size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
          <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
            {events.length === 0 ? 'No audit events recorded yet' : 'No events match filter'}
          </div>
          <div style={{ fontSize: '13px' }}>
            {events.length === 0 ? 'Run a scenario to populate the immutable ledger.' : 'Try clearing your search or filter.'}
          </div>
        </div>
      ) : (
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '0' }}>
          {/* Vertical timeline line */}
          <div style={{
            position: 'absolute', left: '26px', top: '28px', bottom: '28px', width: '2px',
            background: 'linear-gradient(180deg, var(--accent-cyan), var(--accent-blue), rgba(29,99,237,0.1))',
            opacity: 0.3, zIndex: 0,
          }} />

          {filteredEvents.map((ev, idx) => {
            const dec = ev.decision || ev.overall_decision || 'BLOCK';
            const cfg = TIMELINE_ICONS[dec] || TIMELINE_ICONS.BLOCK;
            const Icon = cfg.icon;
            const isExpanded = selectedEvent === ev.event_id;
            const timeStr = ev.timestamp ? new Date(ev.timestamp).toLocaleString() : 'Unknown';

            return (
              <motion.div
                key={ev.event_id || idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: Math.min(idx * 0.03, 0.5) }}
                style={{ position: 'relative', zIndex: 1, marginBottom: '8px' }}
              >
                <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                  {/* Timeline node */}
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: cfg.bg, border: `1.5px solid ${cfg.color}44`,
                    color: cfg.color, boxShadow: `0 0 14px ${cfg.color}33`,
                    zIndex: 1, marginTop: '10px',
                  }}>
                    <Icon size={16} />
                  </div>

                  {/* Event card */}
                  <div
                    style={{
                      flex: 1, background: 'var(--surface)', border: `1px solid ${isExpanded ? cfg.color + '44' : 'var(--border)'}`,
                      borderRadius: '12px', overflow: 'hidden', cursor: 'pointer', transition: 'all 0.2s ease',
                      boxShadow: isExpanded ? `0 0 20px ${cfg.color}22` : 'none',
                    }}
                    onClick={() => setSelectedEvent(isExpanded ? null : ev.event_id)}
                  >
                    <div style={{ padding: '12px 18px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                      {/* Time */}
                      <code className="font-mono" style={{ fontSize: '10.5px', color: 'var(--text-dim)', minWidth: '130px' }}>{timeStr}</code>
                      {/* Action */}
                      <div style={{ flex: 1, minWidth: '120px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF' }}>
                          {ev.action_type || ev.action_name || 'action'}
                        </span>
                        {ev.source_id && (
                          <span className="font-mono" style={{ fontSize: '10.5px', color: 'var(--accent-cyan)', marginLeft: '8px', opacity: 0.7 }}>
                            {ev.source_id}
                          </span>
                        )}
                      </div>
                      {/* Reason preview */}
                      <div style={{ flex: 2, fontSize: '12px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '300px' }}
                        title={ev.reason}>
                        {ev.reason || 'Policy evaluation'}
                      </div>
                      {/* Decision */}
                      <DecisionBadge decision={dec} />
                    </div>

                    {/* Expanded detail */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: 'auto' }}
                          exit={{ height: 0 }}
                          style={{ overflow: 'hidden' }}
                        >
                          <div style={{ padding: '14px 18px 16px', borderTop: '1px solid var(--border)', background: 'rgba(0,0,0,0.3)' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                              {[
                                { label: 'Event ID', value: ev.event_id, mono: true },
                                { label: 'Source ID', value: ev.source_id || '—', mono: true },
                                { label: 'Decision', value: dec },
                                { label: 'Timestamp', value: timeStr, mono: true },
                              ].map((field, i) => (
                                <div key={i} style={{ padding: '10px 12px', background: 'rgba(6,10,20,0.6)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                                  <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '3px' }}>{field.label}</div>
                                  <div style={{ fontSize: '12px', color: '#FFFFFF', fontFamily: field.mono ? 'var(--font-mono)' : 'inherit', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {field.value}
                                  </div>
                                </div>
                              ))}
                            </div>
                            {ev.reason && (
                              <div style={{ padding: '10px 14px', background: 'rgba(6,10,20,0.6)', borderRadius: '8px', border: '1px solid var(--border)', marginBottom: '10px' }}>
                                <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '4px' }}>Reason</div>
                                <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{ev.reason}</div>
                              </div>
                            )}
                            {ev.sha256 && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: 'rgba(6,10,20,0.8)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                                <Hash size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                                <code className="font-mono" style={{ fontSize: '10.5px', color: 'var(--text-muted)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {ev.sha256}
                                </code>
                                <button onClick={() => copy(ev.sha256, ev.event_id)} style={{ color: 'var(--text-muted)', cursor: 'pointer', flexShrink: 0 }}>
                                  {copiedKey === ev.event_id ? <Check size={13} style={{ color: 'var(--allow)' }} /> : <Copy size={13} />}
                                </button>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
