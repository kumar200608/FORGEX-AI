import React, { useState } from 'react';
import { History, RefreshCw, Filter, Clock, Shield, Search } from 'lucide-react';

export default function AuditLogTable({ logs = [], isLoading, onRefresh }) {
  const [filterDecision, setFilterDecision] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLogs = logs.filter((log) => {
    const decisionMatch =
      filterDecision === 'ALL' ||
      (log.decision || '').toUpperCase() === filterDecision;

    const term = searchTerm.toLowerCase();
    const searchMatch =
      !searchTerm ||
      (log.action || '').toLowerCase().includes(term) ||
      (log.source || '').toLowerCase().includes(term) ||
      (log.risk_level || '').toLowerCase().includes(term) ||
      (log.decision || '').toLowerCase().includes(term) ||
      (log.timestamp || '').toLowerCase().includes(term);

    return decisionMatch && searchMatch;
  });

  const formatTimestamp = (rawTs) => {
    if (!rawTs) return 'N/A';
    try {
      const d = new Date(rawTs);
      if (isNaN(d.getTime())) return rawTs;
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' ' + d.toLocaleDateString();
    } catch {
      return rawTs;
    }
  };

  return (
    <div className="logs-section">
      <div className="logs-toolbar">
        <div>
          <h2 className="section-title">
            <History size={20} style={{ color: 'var(--accent-cyan)' }} />
            Audit Log Ledger
          </h2>
          <span className="section-subtitle">
            Immutable SOC audit records from TrustGuard policy engine
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Decision Filters */}
          <div className="logs-filter-group">
            {['ALL', 'ALLOW', 'CONFIRM', 'BLOCK'].map((dec) => (
              <button
                key={dec}
                type="button"
                className={`filter-btn ${filterDecision === dec ? 'active' : ''}`}
                onClick={() => setFilterDecision(dec)}
              >
                {dec}
              </button>
            ))}
          </div>

          {/* Refresh Button */}
          <button
            type="button"
            className="btn-preset"
            onClick={onRefresh}
            disabled={isLoading}
            title="Refresh logs from GET /audit-logs"
          >
            <RefreshCw size={14} className={isLoading ? 'spin' : ''} />
            Refresh Logs
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <table className="soc-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Action</th>
              <th>Source</th>
              <th>Risk Level</th>
              <th>Risk Score</th>
              <th>Policy Decision</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                  {isLoading ? 'Fetching audit logs...' : 'No matching audit records found.'}
                </td>
              </tr>
            ) : (
              filteredLogs.slice().reverse().map((log, index) => {
                const dec = (log.decision || '').toLowerCase();
                const riskLvl = (log.risk_level || '').toUpperCase();
                return (
                  <tr key={index}>
                    <td className="font-mono" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {formatTimestamp(log.timestamp)}
                    </td>
                    <td>
                      <span className="font-mono" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {log.action}
                      </span>
                    </td>
                    <td>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border-subtle)',
                        fontSize: '0.75rem',
                        fontFamily: 'var(--font-mono)'
                      }}>
                        {log.source}
                      </span>
                    </td>
                    <td>
                      <span
                        style={{
                          fontWeight: 700,
                          fontSize: '0.775rem',
                          color:
                            riskLvl === 'HIGH'
                              ? 'var(--color-block)'
                              : riskLvl === 'MEDIUM'
                              ? 'var(--color-confirm)'
                              : 'var(--color-allow)',
                        }}
                      >
                        {riskLvl}
                      </span>
                    </td>
                    <td className="font-mono" style={{ fontWeight: 600 }}>
                      {log.risk_score}
                    </td>
                    <td>
                      <span className={`badge-decision ${dec}`}>
                        {log.decision}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
