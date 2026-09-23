import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, ShieldCheck, AlertOctagon, CheckCircle2, RefreshCw, ArrowRight, AlertTriangle, X, ChevronDown, ChevronRight } from 'lucide-react';
import { api } from '../services/api';

export default function VendorTrust() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);

  const loadVendors = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getVendors();
      setVendors(data || []);
    } catch (err) {
      setError('Unable to load vendors. Ensure backend is running on http://127.0.0.1:8000');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadVendors(); }, []);

  const activeVendors = vendors.filter(v => (v.status || '').toUpperCase() === 'ACTIVE');
  const inactiveVendors = vendors.filter(v => (v.status || '').toUpperCase() !== 'ACTIVE');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <Building2 size={22} style={{ color: 'var(--accent-cyan)' }} />
            <h1 style={{ fontSize: '26px', fontWeight: 900, letterSpacing: '-0.02em' }}>VENDOR TRUST REGISTRY</h1>
          </div>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', maxWidth: '700px' }}>
            Ground-truth beneficiary verification. All invoiced payments are validated against approved vendor records before action clearance.
          </p>
        </div>
        <button className="btn-secondary" onClick={loadVendors} disabled={loading}>
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh Registry
        </button>
      </div>

      {/* ── Verification Rules ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
        {[
          {
            icon: CheckCircle2, color: 'var(--allow)', border: 'var(--allow-border)', bg: 'rgba(16,185,129,0.08)',
            label: 'Active + Beneficiary Match',
            desc: 'Vendor is in registry, status ACTIVE, and invoice account matches approved beneficiary → ALLOW',
            verdict: 'ALLOW',
          },
          {
            icon: AlertOctagon, color: 'var(--block)', border: 'var(--block-border)', bg: 'rgba(239,68,68,0.08)',
            label: 'Beneficiary Mismatch',
            desc: 'Vendor exists but submitted bank account differs from master record → CRITICAL FRAUD / BLOCK',
            verdict: 'BLOCK',
          },
          {
            icon: AlertTriangle, color: 'var(--ask)', border: 'var(--ask-border)', bg: 'rgba(245,158,11,0.08)',
            label: 'Unknown or Inactive Vendor',
            desc: 'Vendor is unregistered or status is INACTIVE / SUSPENDED → UNAUTHORIZED / BLOCK',
            verdict: 'BLOCK',
          },
        ].map((rule, i) => {
          const Icon = rule.icon;
          return (
            <div key={i} style={{ padding: '20px', borderRadius: '14px', background: rule.bg, border: `1px solid ${rule.border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', color: rule.color }}>
                <Icon size={18} />
                <span style={{ fontSize: '13px', fontWeight: 800 }}>{rule.label}</span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '10px' }}>{rule.desc}</p>
              <span style={{
                display: 'inline-block', fontSize: '10px', padding: '3px 9px', borderRadius: '999px',
                fontWeight: 800, background: rule.color + '22', color: rule.color, border: `1px solid ${rule.border}`,
              }}>
                → {rule.verdict}
              </span>
            </div>
          );
        })}
      </div>

      {/* ── Error ── */}
      {error && (
        <div style={{ padding: '14px 18px', background: 'var(--block-soft)', border: '1px solid var(--block-border)', borderRadius: '10px', color: 'var(--block)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <AlertOctagon size={17} /> {error}
        </div>
      )}

      {/* ── Vendor Cards ── */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
          {[1,2,3].map(i => <div key={i} className="skeleton-line" style={{ height: '160px', borderRadius: '12px' }} />)}
        </div>
      ) : vendors.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
          No vendors found in registry.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
          {vendors.map((vendor, idx) => {
            const isActive = (vendor.status || '').toUpperCase() === 'ACTIVE';
            const isSelected = selected === vendor.vendor_id;
            const statusColor = isActive ? 'var(--allow)' : 'var(--block)';

            return (
              <motion.div
                key={vendor.vendor_id || idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                style={{
                  background: 'var(--surface)',
                  border: `1.5px solid ${isActive ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`,
                  borderRadius: '14px',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: isActive ? '0 0 16px rgba(16,185,129,0.08)' : '0 0 16px rgba(239,68,68,0.08)',
                }}
                whileHover={{ y: -2 }}
                onClick={() => setSelected(isSelected ? null : vendor.vendor_id)}
              >
                <div style={{ padding: '20px 22px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '36px', height: '36px', borderRadius: '9px', flexShrink: 0,
                        background: `${statusColor}18`, border: `1px solid ${statusColor}44`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: statusColor,
                      }}>
                        <Building2 size={18} />
                      </div>
                      <div>
                        <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#FFFFFF' }}>{vendor.vendor_name || vendor.name || 'Unknown'}</div>
                        {vendor.vendor_id && (
                          <code className="font-mono" style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                            {vendor.vendor_id}
                          </code>
                        )}
                      </div>
                    </div>
                    <span style={{
                      fontSize: '10px', padding: '3px 9px', borderRadius: '999px', fontWeight: 800,
                      background: `${statusColor}18`, color: statusColor, border: `1px solid ${statusColor}44`,
                    }}>
                      {isActive ? '✓ ACTIVE' : '✗ INACTIVE'}
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div style={{ padding: '10px 12px', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)' }}>
                      <div style={{ fontSize: '9.5px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '3px' }}>
                        Approved Account
                      </div>
                      <code className="font-mono" style={{ fontSize: '11px', color: 'var(--accent-cyan)', fontWeight: 700 }}>
                        {vendor.approved_beneficiary_account || vendor.approved_account || '—'}
                      </code>
                    </div>
                    <div style={{ padding: '10px 12px', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)' }}>
                      <div style={{ fontSize: '9.5px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '3px' }}>
                        Risk Level
                      </div>
                      <span style={{
                        fontSize: '11px', fontWeight: 800,
                        color: vendor.risk_level === 'HIGH' ? 'var(--block)' : vendor.risk_level === 'MEDIUM' ? 'var(--ask)' : 'var(--allow)',
                      }}>
                        {vendor.risk_level || 'LOW'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Expanded detail */}
                <AnimatePresence>
                  {isSelected && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      style={{ overflow: 'hidden', borderTop: '1px solid var(--border)' }}
                    >
                      <div style={{ padding: '16px 22px' }}>
                        <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '10px' }}>
                          Full Registry Record
                        </div>
                        {Object.entries(vendor).map(([key, val]) => val && (
                          <div key={key} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid var(--border-faint)', gap: '10px' }}>
                            <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{key.replace(/_/g, ' ')}</span>
                            <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', textAlign: 'right', maxWidth: '60%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {String(val)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
