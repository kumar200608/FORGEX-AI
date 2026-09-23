import React from 'react';
import { 
  Bot, 
  ShieldCheck, 
  Radio, 
  Fingerprint, 
  Gauge, 
  GitFork,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  XOctagon
} from 'lucide-react';

export default function SecurityPipeline({ lastResult, isChecking }) {
  const trust = lastResult?.trust;
  const taint = lastResult?.taint;
  const injection = lastResult?.injection;
  const risk = lastResult?.risk;
  const policy = lastResult?.policy;
  const decision = policy?.decision?.toUpperCase();

  const hasResult = Boolean(lastResult);

  return (
    <div className="pipeline-card">
      <div className="pipeline-header">
        <div>
          <h2 className="section-title">
            <GitFork size={20} style={{ color: 'var(--accent-cyan)' }} />
            Indirect Prompt Injection Security Pipeline
          </h2>
          <span className="section-subtitle">
            Zero-Trust Inspection Engine & Flow Telemetry
          </span>
        </div>
        {isChecking && (
          <span className="form-badge-static" style={{ borderColor: 'var(--accent-cyan)', color: 'var(--accent-cyan)' }}>
            Processing Pipeline Inspection...
          </span>
        )}
      </div>

      <div className="pipeline-flow">
        {/* Node 1: Agent / User */}
        <div className={`pipeline-node ${hasResult ? 'active' : ''}`}>
          <div className="pipeline-node-icon">
            <Bot size={22} />
          </div>
          <span className="pipeline-node-name">AI Agent</span>
          <span className="pipeline-node-val">
            {hasResult ? `Src: ${lastResult.source}` : 'Waiting Action'}
          </span>
        </div>

        <div className={`pipeline-arrow ${hasResult || isChecking ? 'active' : ''}`}>
          <ArrowRight size={20} />
        </div>

        {/* Node 2: Trust Check */}
        <div className={`pipeline-node ${hasResult ? 'active' : ''}`}>
          <div className="pipeline-node-icon">
            <ShieldCheck size={22} />
          </div>
          <span className="pipeline-node-name">Trust Check</span>
          <span
            className="pipeline-node-val"
            style={{
              color: trust?.trust_level === 'TRUSTED'
                ? 'var(--color-allow)'
                : trust?.trust_level === 'UNTRUSTED'
                ? 'var(--color-block)'
                : 'inherit'
            }}
          >
            {hasResult ? trust?.trust_level : 'Source Audit'}
          </span>
        </div>

        <div className={`pipeline-arrow ${hasResult || isChecking ? 'active' : ''}`}>
          <ArrowRight size={20} />
        </div>

        {/* Node 3: Taint Check */}
        <div className={`pipeline-node ${hasResult ? 'active' : ''}`}>
          <div className="pipeline-node-icon">
            <Radio size={22} />
          </div>
          <span className="pipeline-node-name">Taint Check</span>
          <span
            className="pipeline-node-val"
            style={{
              color: taint?.tainted ? 'var(--color-confirm)' : hasResult ? 'var(--color-allow)' : 'inherit'
            }}
          >
            {hasResult ? (taint?.tainted ? 'TAINTED' : 'CLEAN') : 'Data Flow'}
          </span>
        </div>

        <div className={`pipeline-arrow ${hasResult || isChecking ? 'active' : ''}`}>
          <ArrowRight size={20} />
        </div>

        {/* Node 4: Injection Detection */}
        <div className={`pipeline-node ${hasResult ? 'active' : ''}`}>
          <div className="pipeline-node-icon">
            <Fingerprint size={22} />
          </div>
          <span className="pipeline-node-name">Injection Det.</span>
          <span
            className="pipeline-node-val"
            style={{
              color: injection?.injection_detected ? 'var(--color-block)' : hasResult ? 'var(--color-allow)' : 'inherit'
            }}
          >
            {hasResult
              ? injection?.injection_detected
                ? `DETECTED (${Math.round((injection?.confidence || 0.95) * 100)}%)`
                : 'NOT DETECTED'
              : 'Regex / Patterns'}
          </span>
        </div>

        <div className={`pipeline-arrow ${hasResult || isChecking ? 'active' : ''}`}>
          <ArrowRight size={20} />
        </div>

        {/* Node 5: Risk Engine */}
        <div className={`pipeline-node ${hasResult ? 'active' : ''}`}>
          <div className="pipeline-node-icon">
            <Gauge size={22} />
          </div>
          <span className="pipeline-node-name">Risk Engine</span>
          <span
            className="pipeline-node-val"
            style={{
              color: risk?.risk_level === 'HIGH'
                ? 'var(--color-block)'
                : risk?.risk_level === 'MEDIUM'
                ? 'var(--color-confirm)'
                : hasResult ? 'var(--color-allow)' : 'inherit'
            }}
          >
            {hasResult ? `Score: ${risk?.risk_score} (${risk?.risk_level})` : 'Scoring 0-100'}
          </span>
        </div>

        <div className={`pipeline-arrow ${hasResult || isChecking ? 'active' : ''}`}>
          <ArrowRight size={20} />
        </div>

        {/* Node 6: Policy Branching */}
        <div className="policy-branches">
          <div className={`policy-branch-node allow ${decision === 'ALLOW' ? 'active' : ''}`}>
            ✓ ALLOW
          </div>
          <div className={`policy-branch-node confirm ${decision === 'CONFIRM' ? 'active' : ''}`}>
            ⚠ CONFIRM
          </div>
          <div className={`policy-branch-node block ${decision === 'BLOCK' ? 'active' : ''}`}>
            ✕ BLOCK
          </div>
        </div>
      </div>
    </div>
  );
}
