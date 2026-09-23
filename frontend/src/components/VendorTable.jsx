import React, { useState, useMemo } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Building, Eye, ShieldCheck, Copy, Check, Search } from 'lucide-react';

export default function VendorTable({ vendors, onSelectVendor }) {
  const [selected, setSelected] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedAccount, setCopiedAccount] = useState(null);

  const handleSelect = (v) => {
    setSelected(v);
    if (onSelectVendor) onSelectVendor(v);
  };

  const copyToClipboard = (account) => {
    if (!account) return;
    navigator.clipboard.writeText(account);
    setCopiedAccount(account);
    setTimeout(() => setCopiedAccount(null), 1800);
  };

  const filteredVendors = useMemo(() => {
    if (!searchQuery.trim()) return vendors;
    const q = searchQuery.toLowerCase();
    return vendors.filter(v => 
      (v.name && v.name.toLowerCase().includes(q)) ||
      (v.vendor_id && v.vendor_id.toLowerCase().includes(q)) ||
      ((v.approved_beneficiary || v.approved_beneficiary_account || '').toLowerCase().includes(q))
    );
  }, [vendors, searchQuery]);

  return (
    <div className="card-panel" style={{ padding: '24px' }}>
      {/* Search & Filter Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ position: 'relative', width: '100%', maxWidth: '380px' }}>
          <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '34px', fontSize: '12px' }}
            placeholder="Search vendor registry by name, ID, or account..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <span className="badge badge-cyan">
          {filteredVendors.length} of {vendors.length} Vendors Registered
        </span>
      </div>

      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Vendor ID</th>
              <th>Vendor Master Name</th>
              <th>Status</th>
              <th>Approved Beneficiary Account</th>
              <th>Registered Aliases</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredVendors.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                  No matching registered vendors found for "{searchQuery}".
                </td>
              </tr>
            ) : (
              filteredVendors.map((v) => {
                const isActive = v.status === 'ACTIVE';
                const beneficiary = v.approved_beneficiary || v.approved_beneficiary_account;
                const aliasList = v.aliases && v.aliases.length > 0 ? v.aliases.join(', ') : 'Exact match only';
                const isCopied = copiedAccount === beneficiary;

                return (
                  <tr key={v.vendor_id}>
                    <td className="font-mono" style={{ color: 'var(--accent-cyan)', fontWeight: 700 }}>{v.vendor_id}</td>
                    <td>
                      <div style={{ fontWeight: 700, color: '#ffffff' }}>{v.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{v.category || 'Approved Enterprise Vendor'}</div>
                    </td>
                    <td>
                      <span className={`badge ${isActive ? 'badge-allow' : 'badge-block'}`}>
                        {isActive ? <CheckCircle2 size={11} style={{ marginRight: '3px' }} /> : <XCircle size={11} style={{ marginRight: '3px' }} />}
                        {v.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="font-mono" style={{ color: isActive ? 'var(--color-allow)' : 'var(--text-secondary)', fontWeight: 600 }}>
                          {beneficiary}
                        </span>
                        <button
                          className="btn-secondary"
                          style={{ padding: '3px 6px', fontSize: '10px' }}
                          onClick={() => copyToClipboard(beneficiary)}
                          title="Copy Account Number"
                        >
                          {isCopied ? <Check size={11} color="var(--color-allow)" /> : <Copy size={11} />}
                        </button>
                      </div>
                    </td>
                    <td style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{aliasList}</td>
                    <td>
                      <button 
                        className="btn-secondary" 
                        style={{ padding: '6px 12px', fontSize: '11px' }}
                        onClick={() => handleSelect(v)}
                      >
                        <Eye size={12} />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {selected && (
        <div style={{ marginTop: '24px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '20px' }}>
          <div className="section-header" style={{ marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Building size={18} color="var(--accent-cyan)" />
              <div>
                <h3 className="section-title">MASTER RECORD: {selected.name}</h3>
                <p className="section-subtitle">Ground-truth enterprise vendor telemetry</p>
              </div>
            </div>
            <span className={`badge ${selected.status === 'ACTIVE' ? 'badge-allow' : 'badge-block'}`}>
              {selected.status}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '14px' }}>
            <div style={{ background: 'rgba(7, 11, 20, 0.6)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '12px' }}>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Vendor Identifier</div>
              <div style={{ fontSize: '13px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-cyan)', marginTop: '2px' }}>{selected.vendor_id}</div>
            </div>

            <div style={{ background: 'rgba(7, 11, 20, 0.6)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '12px' }}>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Approved Beneficiary Account</div>
              <div style={{ fontSize: '13px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--color-allow)', marginTop: '2px' }}>
                {selected.approved_beneficiary || selected.approved_beneficiary_account}
              </div>
            </div>

            <div style={{ background: 'rgba(7, 11, 20, 0.6)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '12px' }}>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Registered Aliases</div>
              <div style={{ fontSize: '12px', color: '#ffffff', marginTop: '2px' }}>
                {selected.aliases && selected.aliases.length > 0 ? selected.aliases.join(', ') : 'Exact match only'}
              </div>
            </div>

            <div style={{ background: 'rgba(7, 11, 20, 0.6)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '12px' }}>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Firewall Action Rule</div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: selected.status === 'ACTIVE' ? 'var(--color-allow)' : 'var(--color-block)', marginTop: '2px' }}>
                {selected.status === 'ACTIVE' ? 'STRICT MATCH ENFORCED (ALLOW)' : 'ALL ACTIONS DENIED (BLOCK)'}
              </div>
            </div>
          </div>

          <div style={{ padding: '12px 16px', background: 'rgba(34, 211, 238, 0.08)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(34, 211, 238, 0.25)', fontSize: '12px', color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShieldCheck size={18} color="var(--accent-cyan)" style={{ flexShrink: 0 }} />
            <span>
              <strong>Zero-Trust Security Enforcement:</strong> Agent payment recommendations require exact character-level consistency with this approved beneficiary account. Any deviation in routing or beneficiary number is flagged as financial redirection fraud and blocked at runtime.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

