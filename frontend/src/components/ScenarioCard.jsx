import React from 'react';
import { Play, Loader2, ShieldAlert, ShieldCheck, Eye, Terminal } from 'lucide-react';
import DecisionBadge from './DecisionBadge';

export default function ScenarioCard({ scenario, onRun, onInspect, isRunning, isSelected }) {
  const isBlockExpected = scenario.expected_decision === 'BLOCK';

  return (
    <div 
      className="card-panel"
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '20px',
        border: isSelected ? '1px solid var(--accent-copper)' : '1px solid var(--border)',
        boxShadow: isSelected ? 'var(--shadow-glow-copper)' : 'var(--shadow-sm)',
        transition: 'all 0.2s ease',
        cursor: 'pointer',
        background: 'var(--surface)'
      }}
      onClick={() => onInspect && onInspect(scenario)}
    >
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--accent-copper)', fontWeight: 700 }}>
              {scenario.scenario_id}
            </span>
            <span className="badge badge-neutral" style={{ fontSize: '10px' }}>
              {scenario.category}
            </span>
          </div>
          <DecisionBadge decision={scenario.expected_decision} />
        </div>

        <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.3, marginBottom: '8px' }}>
          {scenario.name}
        </h3>

        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.4, marginBottom: '16px' }}>
          {scenario.description}
        </p>
      </div>

      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '12px', borderTop: '1px solid var(--border-faint)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {isBlockExpected ? (
              <span className="badge badge-block" style={{ fontSize: '10px' }}>
                <ShieldAlert size={10} style={{ marginRight: '3px' }} />
                {scenario.threat_level || 'HIGH'} THREAT
              </span>
            ) : (
              <span className="badge badge-allow" style={{ fontSize: '10px' }}>
                <ShieldCheck size={10} style={{ marginRight: '3px' }} />
                BENIGN / SAFE
              </span>
            )}
          </div>

          <div style={{ display: 'flex', gap: '6px' }} onClick={(e) => e.stopPropagation()}>
            <button
              className="btn-secondary"
              style={{ padding: '6px 10px', fontSize: '11px' }}
              onClick={() => onInspect && onInspect(scenario)}
              title="Inspect Scenario Details"
            >
              <Eye size={12} />
              <span>Details</span>
            </button>

            <button
              className="btn-primary"
              style={{ padding: '6px 12px', fontSize: '11px' }}
              onClick={() => onRun(scenario.scenario_id)}
              disabled={isRunning}
            >
              {isRunning ? (
                <>
                  <Loader2 size={12} className="animate-spin" />
                  <span>Evaluating...</span>
                </>
              ) : (
                <>
                  <Play size={12} />
                  <span>RUN</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

