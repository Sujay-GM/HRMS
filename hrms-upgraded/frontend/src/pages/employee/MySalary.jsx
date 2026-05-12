import { useState, useEffect } from 'react';
import api from '../../services/api';
import { formatCurrency } from '../../utils/currency';

// Always display INR if currency is USD/missing (handles old seeded data)
function normalizeCurrency(c) {
  return (!c || c === 'USD') ? 'INR' : c;
}

function PayslipBreakdown({ slip }) {
  if (!slip) return (
    <div className="empty-state" style={{ padding: 32 }}>
      <h3>No payslip selected</h3>
      <p>Your payslips will appear here once payroll is processed.</p>
    </div>
  );

  const currency = normalizeCurrency(slip.currency);
  const fmt = (v) => formatCurrency(v, currency);

  const basic      = parseFloat(slip.basic      || 0);
  const hra        = parseFloat(slip.hra        || 0);
  const allowances = parseFloat(slip.allowances || 0);
  const bonus      = parseFloat(slip.bonus      || 0);
  const tax        = parseFloat(slip.tax        || 0);
  const pf         = parseFloat(slip.pf         || 0);
  const esi        = parseFloat(slip.esi        || 0);
  const deductions = parseFloat(slip.deductions || 0);

  const grossPay      = parseFloat(slip.gross_pay || 0) || basic + hra + allowances + bonus;
  const totalDed      = parseFloat(slip.total_deductions || 0) || (pf || deductions) + esi + tax;

  return (
    <div className="card-body">
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>
          {new Date(slip.month + '-01').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
        </div>
        <span className={`badge ${slip.status === 'paid' ? 'badge-green' : 'badge-yellow'}`}
          style={{ textTransform: 'capitalize' }}>{slip.status}</span>
        {slip.paid_on && (
          <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 8 }}>
            · Paid {new Date(slip.paid_on).toLocaleDateString('en-IN')}
          </span>
        )}
      </div>

      {/* Earnings */}
      {[
        { label: 'Basic Salary',  value: basic      },
        { label: 'HRA',           value: hra         },
        { label: 'Allowances',    value: allowances  },
        ...(bonus > 0 ? [{ label: 'Bonus', value: bonus }] : []),
      ].map(r => (
        <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
          <span style={{ color: 'var(--text-muted)' }}>{r.label}</span>
          <span style={{ fontWeight: 600, color: 'var(--secondary)' }}>{fmt(r.value)}</span>
        </div>
      ))}

      {/* Gross subtotal */}
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '2px solid var(--border)', fontSize: 13, background: 'var(--background)', margin: '0 -16px', padding: '9px 16px' }}>
        <span style={{ fontWeight: 700 }}>Gross Pay</span>
        <span style={{ fontWeight: 700 }}>{fmt(grossPay)}</span>
      </div>

      {/* Deductions */}
      {[
        { label: 'Provident Fund (PF)', value: pf || deductions },
        { label: 'ESI',                 value: esi              },
        { label: 'Income Tax (TDS)',    value: tax              },
      ].map(r => (
        <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
          <span style={{ color: 'var(--text-muted)' }}>{r.label}</span>
          <span style={{ fontWeight: 600, color: 'var(--danger)' }}>-{fmt(r.value)}</span>
        </div>
      ))}

      {/* Net Pay */}
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 0 4px', marginTop: 6, borderTop: '2px solid var(--border)', fontWeight: 800, fontSize: 16 }}>
        <span>Net Pay</span>
        <span style={{ color: 'var(--primary)' }}>{fmt(slip.net_pay)}</span>
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'right', marginTop: 2 }}>
        Total deductions: {fmt(totalDed)}
      </div>
    </div>
  );
}

export default function MySalary() {
  const [payroll, setPayroll]                 = useState([]);
  const [profile, setProfile]                 = useState(null);
  const [loading, setLoading]                 = useState(true);
  const [selectedPayslip, setSelectedPayslip] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [payRes, profRes] = await Promise.all([
          api.get('/payroll'),
          api.get('/auth/profile'),
        ]);
        const records = payRes.data.payroll || [];
        setPayroll(records);
        setProfile(profRes.data);
      } catch { setPayroll([]); }
      setLoading(false);
    };
    fetchData();
  }, []);

  const latest    = payroll[0];
  const currency  = normalizeCurrency(profile?.currency);
  const fmt       = (v) => formatCurrency(v, currency);
  const totalNet  = payroll.reduce((s, p) => s + parseFloat(p.net_pay || 0), 0);
  const paidCount = payroll.filter(p => p.status === 'paid').length;

  if (loading) return <div className="loading-overlay"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <div><h1>My Salary</h1><p>View your salary details and payslip history</p></div>
      </div>

      {/* Salary Banner */}
      <div className="card" style={{ marginBottom: 20, background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))', border: 'none', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', right: -40, top: -40, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.07)', pointerEvents: 'none' }} />
        <div className="card-body" style={{ position: 'relative' }}>
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 11, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700 }}>
            {profile?.salary_type === 'monthly' ? 'Monthly' : 'Annual'} Salary (INR)
          </p>
          <h2 style={{ color: 'white', fontSize: 34, fontWeight: 900, letterSpacing: '-0.5px' }}>
            {profile?.salary ? fmt(profile.salary) : '—'}
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13, marginTop: 5 }}>
            {profile?.salary && profile?.salary_type !== 'monthly'
              ? `≈ ${fmt(profile.salary / 12)}/month · `
              : ''}
            {profile?.position || 'Employee'} · {profile?.department || 'General'}
          </p>

          {latest && (() => {
            const basic      = parseFloat(latest.basic      || 0);
            const hra        = parseFloat(latest.hra        || 0);
            const allowances = parseFloat(latest.allowances || 0);
            const pf         = parseFloat(latest.pf         || 0);
            const esi        = parseFloat(latest.esi        || 0);
            const tax        = parseFloat(latest.tax        || 0);
            const deductions = parseFloat(latest.deductions || 0);
            const totalDed   = (pf || deductions) + esi + tax;
            return (
              <div style={{ display: 'flex', gap: 20, marginTop: 22, flexWrap: 'wrap', paddingTop: 18, borderTop: '1px solid rgba(255,255,255,0.15)' }}>
                {[
                  ['Basic',       basic      ],
                  ['HRA',         hra        ],
                  ['Allowances',  allowances ],
                  ['PF+ESI+Tax', -totalDed   ],
                ].map(([label, val]) => (
                  <div key={label}>
                    <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.7px', fontWeight: 700 }}>{label}</div>
                    <div style={{ color: 'white', fontWeight: 700, fontSize: 15, marginTop: 3 }}>
                      {val < 0 ? '-' : ''}{fmt(Math.abs(val))}
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: 20, gridTemplateColumns: 'repeat(3,1fr)' }}>
        {[
          { label: 'Total Earned (YTD)', value: fmt(totalNet),  color: 'var(--secondary)', bg: 'var(--secondary-light)' },
          { label: 'Payslips Paid',      value: paidCount,       color: 'var(--primary)',   bg: 'var(--primary-light)'   },
          { label: 'Payslips Pending',   value: payroll.filter(p => p.status !== 'paid').length, color: 'var(--accent)', bg: 'var(--accent-light)' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div style={{ width: 44, height: 44, borderRadius: 12, background: s.bg, flexShrink: 0 }} />
            <div>
              <div className="stat-value" style={{ color: s.color, fontSize: 22 }}>{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
        {/* History Table */}
        <div className="card">
          <div className="card-header">
            <h3>Payslip History</h3>
            <span className="badge badge-blue">{payroll.length} records</span>
          </div>
          <div className="table-wrap">
            {payroll.length === 0 ? (
              <div className="empty-state">
                <h3>No payslips yet</h3>
                <p>Your payslips will appear here once payroll is processed.</p>
              </div>
            ) : (
              <table>
                <thead>
                  <tr><th>Month</th><th>Gross</th><th>Deductions</th><th>Net Pay</th><th>Status</th><th></th></tr>
                </thead>
                <tbody>
                  {payroll.map(p => {
                    // Always use INR per row regardless of what's stored in DB
                    const rowFmt   = (v) => formatCurrency(v, 'INR');
                    const gross    = parseFloat(p.gross_pay || 0) ||
                                     parseFloat(p.basic||0)+parseFloat(p.hra||0)+parseFloat(p.allowances||0)+parseFloat(p.bonus||0);
                    const pfRow    = parseFloat(p.pf || 0);
                    const esiRow   = parseFloat(p.esi || 0);
                    const taxRow   = parseFloat(p.tax || 0);
                    const dedRow   = parseFloat(p.total_deductions || 0) ||
                                     (pfRow || parseFloat(p.deductions||0)) + esiRow + taxRow;
                    return (
                      <tr key={p.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedPayslip(p)}>
                        <td><strong>{new Date(p.month + '-01').toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</strong></td>
                        <td style={{ fontSize: 13 }}>{rowFmt(gross)}</td>
                        <td style={{ color: 'var(--danger)', fontSize: 13 }}>-{rowFmt(dedRow)}</td>
                        <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{rowFmt(p.net_pay)}</td>
                        <td><span className={`badge ${p.status === 'paid' ? 'badge-green' : 'badge-yellow'}`}>{p.status}</span></td>
                        <td>
                          <button className="btn btn-secondary btn-sm"
                            onClick={e => { e.stopPropagation(); setSelectedPayslip(p); }}>View</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Payslip Detail */}
        <div className="card">
          <div className="card-header">
            <h3>{selectedPayslip ? 'Payslip Detail' : 'Latest Payslip'}</h3>
            {selectedPayslip && selectedPayslip !== latest && (
              <button className="btn btn-secondary btn-sm" onClick={() => setSelectedPayslip(null)}>← Latest</button>
            )}
          </div>
          <PayslipBreakdown slip={selectedPayslip || latest} />
        </div>
      </div>
    </div>
  );
}
