import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { formatINR } from '../../utils/currency';

export default function Payroll() {
  const [payroll, setPayroll] = useState([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [paying, setPaying] = useState(null);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [filter, setFilter] = useState('all');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const fetchPayroll = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/payroll', { params: { month } });
      setPayroll(res.data.payroll || []);
    } catch {
      setPayroll([]);
    }
    setLoading(false);
  }, [month]);

  useEffect(() => { fetchPayroll(); }, [fetchPayroll]);

  const showMsg = (setter, msg) => { setter(msg); setTimeout(() => setter(''), 4000); };

  const handleRunPayroll = async () => {
    if (!window.confirm(`Run payroll for ${new Date(month + '-01').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}?`)) return;
    setRunning(true);
    try {
      const res = await api.post('/payroll/run', { month });
      showMsg(setSuccess, `✅ ${res.data.message}`);
      await fetchPayroll();
    } catch (err) {
      showMsg(setError, err.response?.data?.message || 'Failed to run payroll.');
    }
    setRunning(false);
  };

  const handleMarkPaid = async (id) => {
    setPaying(id);
    try {
      await api.put(`/payroll/${id}/pay`);
      showMsg(setSuccess, 'Marked as paid.');
      await fetchPayroll();
    } catch (err) {
      showMsg(setError, err.response?.data?.message || 'Failed to mark as paid.');
    }
    setPaying(null);
  };

  const filtered = filter === 'all' ? payroll : payroll.filter(p => p.status === filter);
  const totalNet   = payroll.reduce((s, p) => s + parseFloat(p.net_pay  || 0), 0);
  const totalGross = payroll.reduce((s, p) => s + parseFloat(p.gross_pay || p.basic || 0), 0);
  const totalBonus = payroll.reduce((s, p) => s + parseFloat(p.bonus    || 0), 0);

  return (
    <div>
      <div className="page-header">
        <div><h1>Payroll</h1><p>Manage employee salary disbursements (₹ INR)</p></div>
        <div style={{ display: 'flex', gap: 10 }}>
          <input type="month" value={month} onChange={e => setMonth(e.target.value)}
            style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, outline: 'none' }} />
          <button className="btn btn-primary" onClick={handleRunPayroll} disabled={running}>
            {running ? 'Running...' : '▶ Run Payroll'}
          </button>
        </div>
      </div>

      {success && <div className="alert alert-success" style={{ marginBottom: 16 }}>{success}</div>}
      {error && <div style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 13 }}>{error}</div>}

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 20 }}>
        {[
          { label: 'Total Net Payroll', value: formatINR(totalNet),   color: 'var(--primary)' },
          { label: 'Total Gross',       value: formatINR(totalGross), color: 'var(--secondary)' },
          { label: 'Paid',             value: payroll.filter(p => p.status === 'paid').length,    color: 'var(--success)' },
          { label: 'Pending',          value: payroll.filter(p => p.status === 'pending').length, color: 'var(--warning)' },
        ].map(s => (
          <div key={s.label} className="stat-card" style={{ padding: 16 }}>
            <div>
              <div className="stat-value" style={{ color: s.color, fontSize: 20 }}>{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-header">
          <h3>Payroll — {new Date(month + '-01').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</h3>
          <div style={{ display: 'flex', gap: 6 }}>
            {['all', 'paid', 'pending'].map(s => (
              <button key={s} className={`btn btn-sm ${filter === s ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setFilter(s)} style={{ textTransform: 'capitalize' }}>{s}</button>
            ))}
          </div>
        </div>
        <div className="table-wrap">
          {loading ? <div className="loading-overlay"><div className="spinner" /></div> : (
            <table>
              <thead>
                <tr>
                  <th>Employee</th><th>Department</th>
                  <th>Basic</th><th>HRA</th><th>Gross Pay</th>
                  <th>PF</th><th>ESI</th><th>Tax</th>
                  <th>Net Pay</th><th>Status</th><th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{p.employee}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.position}</div>
                    </td>
                    <td><span className="badge badge-blue">{p.department}</span></td>
                    <td>{formatINR(p.basic)}</td>
                    <td>{formatINR(p.hra)}</td>
                    <td style={{ fontWeight: 600 }}>{formatINR(p.gross_pay || (parseFloat(p.basic||0)+parseFloat(p.hra||0)+parseFloat(p.allowances||0)))}</td>
                    <td style={{ color: 'var(--danger)', fontSize: 12 }}>-{formatINR(p.pf || 0)}</td>
                    <td style={{ color: 'var(--danger)', fontSize: 12 }}>-{formatINR(p.esi || 0)}</td>
                    <td style={{ color: 'var(--danger)', fontSize: 12 }}>-{formatINR(p.tax)}</td>
                    <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{formatINR(p.net_pay)}</td>
                    <td>
                      <span className={`badge ${p.status === 'paid' ? 'badge-green' : 'badge-yellow'}`} style={{ textTransform: 'capitalize' }}>
                        {p.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {p.status === 'pending' && (
                          <button className="btn btn-primary btn-sm" disabled={paying === p.id}
                            onClick={() => handleMarkPaid(p.id)}>
                            {paying === p.id ? '...' : '✓ Pay'}
                          </button>
                        )}
                        {p.status === 'paid' && (
                          <span style={{ fontSize: 11, color: 'var(--success)' }}>
                            Paid {p.paid_on ? new Date(p.paid_on).toLocaleDateString('en-IN') : ''}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={11}>
                    <div className="empty-state">
                      <h3>No payroll records</h3>
                      <p>{payroll.length === 0 ? 'Click "Run Payroll" to generate records for this month.' : `No ${filter} records.`}</p>
                    </div>
                  </td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
