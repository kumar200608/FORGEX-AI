import React from 'react';
import { 
  FileText, 
  ShieldAlert, 
  ShieldCheck, 
  AlertOctagon, 
  Terminal, 
  CheckCircle2, 
  Clock, 
  Fingerprint,
  RotateCcw,
  ChevronRight,
  Eye
} from 'lucide-react';
import DecisionBadge from './DecisionBadge';

export default function AuditTimeline({ events = [], onSelectEvent }) {
  if (!events || events.length === 0) {
    return (
      <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '48px 24px', fontSize: '13px' }}>
        No security audit events recorded matching current filters.
      </div>
    );
  }

  const getEventIcon = (eventType, decision) => {
    if (decision === 'BLOCK') return AlertOctagon;
    if (decision === 'ALLOW') return CheckCircle2;
    const et = (eventType || '').toUpperCase();
    if (et.includes('INJECTION')) return ShieldAlert;
    if (et.includes('SOURCE')) return Fingerprint;
    if (et.includes('INTENT')) return FileText;
    if (et.includes('RECOVERY')) return RotateCcw;
    return Terminal;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {events.map((ev, idx) => {
        const eventKey = ev.event_id || `ev-${idx}`;
        const decision = ev.decision || ev.overall_decision;
        const Icon = getEventIcon(ev.event_type || ev.action_type || '', decision);
        const isBlock = decision === 'BLOCK';
        const isAllow = decision === 'ALLOW';

        return (
          <div
            key={eventKey}
            className="timeline-card"
            style={{
              padding: '16px 20px',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              transition: 'all 0.18s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px'
            }}
            onClick={() => onSelectEvent && onSelectEvent(ev)}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--accent-cyan)';
              e.currentTarget.style.boxShadow = 'var(--shadow-glow-cyan)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-subtle)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: 0 }}>
              <div 
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: isBlock ? 'var(--color-block-bg)' : (isAllow ? 'var(--color-allow-bg)' : 'rgba(255,255,255,0.05)'),
                  border: `1.5px solid ${isBlock ? 'var(--color-block)' : (isAllow ? 'var(--color-allow)' : 'var(--border-subtle)')}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: isBlock ? 'var(--color-block)' : (isAllow ? 'var(--color-allow)' : 'var(--text-muted)'),
                  flexShrink: 0
                }}
              >
                <Icon size={16} />
              </div>

              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                  <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)', fontWeight: 700 }}>
                    {ev.event_id || `EVENT-${idx + 1}`}
                  </span>
                  <span className="badge badge-muted" style={{ fontSize: '10px' }}>
                    {ev.event_type || ev.action_type || 'SECURITY_DECISION'}
                  </span>
                  {decision && <DecisionBadge decision={decision} />}
                </div>

                <div 
                  style={{ 
                    fontSize: '13px', 
                    color: '#ffffff', 
                    fontWeight: 600,
                    lineHeight: 1.3,
                    overflow: 'hidden', 
                    textOverflow: 'ellipsis', 
                    whiteSpace: 'nowrap' 
                  }}
                >
                  {ev.reason || ev.description || ev.user_message || `Action [${ev.action_name || ev.action_type || 'unspecified'}] evaluated by Action Firewall.`}
                </div>

                {ev.source_id && (
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                    Source: {ev.source_id} {ev.intent_id ? `| Intent: ${ev.intent_id}` : ''}
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexShrink: 0 }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                {ev.timestamp ? new Date(ev.timestamp).toLocaleTimeString() : 'Recent'}
              </span>
              <button 
                className="btn-secondary" 
                style={{ padding: '6px 10px', fontSize: '11px' }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (onSelectEvent) onSelectEvent(ev);
                }}
              >
                <Eye size={12} />
                <span>Forensics</span>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

