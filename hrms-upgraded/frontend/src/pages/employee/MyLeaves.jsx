import { useState, useEffect, useCallback } from 'react';
import { leaveService } from '../../services/leaveService';

const leaveTypes = ['Annual Leave', 'Sick Leave', 'Personal Leave', 'Emergency Leave', 'Maternity Leave', 'Paternity Leave'];
const statusBadge = { pending: 'badge-yellow', approved: 'badge-green', rejected: 'badge-red' };

export default function MyLeaves() {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ leave_type: '', from_date: '', to_date: '', reason: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchLeaves = useCallback(async () => {
    setLoading(true);
    try {
      const res = await leaveService.getAll();
      setLeaves(res.data.leaves || res.data || []);
    } catch {
      setLeaves([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchLeaves(); }, [fetchLeaves]);

  const getDays = () => {
    if (!form.from_date || !form.to_date) return 0;
    const diff = new Date(form.to_date) - new Date(form.from_date);
    return Math.max(1, Math.round(diff / (1000 * 60 * 60 * 24)) + 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.leave_type || !form.from_date || !form.to_date || !form.reason) {
      setError('All fields are required.'); return;
    }
    setError('');
    setSubmitting(true);
    try {
      await leaveService.create(form);
      setModal(false);
      setForm({ leave_type: '', from_date: '', to_date: '', reason: '' });
      setSuccess('Leave request submitted! Waiting for admin approval.');
      setTimeout(() => setSuccess(''), 5000);
      await fetchLeaves(); // re-fetch real data from server
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit. Please try again.');
    }
    setSubmitting(false);
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this leave request?')) return;
    try {
      await leaveService.delete(id);
      setSuccess('Leave request cancelled.');
      setTimeout(() => setSuccess(''), 3000);
      await fetchLeaves();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cancel request.');
    }
  };

  const approvedDays = leaves.filter(l => l.status === 'approved').reduce((sum, l) => sum + (l.days || 0), 0);
  const leaveBalance = { annual: 14, sick: 7, personal: 3, used: approvedDays };

  return (
    <div>
      <div className="page-header">
        <div><h1>Leave Requests</h1><p>Apply and track your leave applications</p></div>
        <button className="btn btn-primary" onClick={() => { setModal(true); setError(''); }}>+ Apply Leave</button>
      </div>

      {success && <div className="alert alert-success">{success}</div>}

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 20 }}>
        {[
          { label: 'Annual Balance', value: leaveBalance.annual, color: 'var(--primary)' },
          { label: 'Sick Balance', value: leaveBalance.sick, color: 'var(--success)' },
          { label: 'Personal Balance', value: leaveBalance.personal, color: 'var(--warning)' },
          { label: 'Total Used', value: leaveBalance.used, color: 'var(--danger)' },
        ].map(s => (
          <div key={s.label} className="stat-card" style={{ padding: 16 }}>
            <div><div className="stat-value" style={{ color: s.color, fontSize: 22 }}>{s.value}</div><div className="stat-label">{s.label}</div></div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-header"><h3>My Leave History</h3><span className="badge badge-blue">{leaves.length} requests</span></div>
        <div className="table-wrap">
          {loading ? <div className="loading-overlay"><div className="spinner" /></div> : (
            <table>
              <thead><tr><th>Type</th><th>From</th><th>To</th><th>Days</th><th>Reason</th><th>Applied On</th><th>Status</th><th>Action</th></tr></thead>
              <tbody>
                {leaves.map(l => (
                  <tr key={l.id}>
                    <td><span className="badge badge-blue">{l.leave_type}</span></td>
                    <td style={{ fontSize: 12 }}>{new Date(l.from_date).toLocaleDateString()}</td>
                    <td style={{ fontSize: 12 }}>{new Date(l.to_date).toLocaleDateString()}</td>
                    <td style={{ fontWeight: 600 }}>{l.days}</td>
                    <td style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 12 }}>{l.reason}</td>
                    <td style={{ fontSize: 11, color: 'var(--text-muted)' }}>{new Date(l.applied_on).toLocaleDateString()}</td>
                    <td><span className={`badge ${statusBadge[l.status]}`} style={{ textTransform: 'capitalize' }}>{l.status}</span></td>
                    <td>
                      {l.status === 'pending' && (
                        <button className="btn btn-danger btn-sm" onClick={() => handleCancel(l.id)}>Cancel</button>
                      )}
                      {l.status === 'approved' && <span style={{ fontSize: 11, color: 'var(--success)' }}>✓ Approved</span>}
                      {l.status === 'rejected' && <span style={{ fontSize: 11, color: 'var(--danger)' }}>✗ Rejected</span>}
                    </td>
                  </tr>
                ))}
                {leaves.length === 0 && (
                  <tr><td colSpan={8}><div className="empty-state"><h3>No leave requests</h3><p>You haven't applied for any leaves yet.</p></div></td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h3>Apply for Leave</h3>
              <button className="close-btn" onClick={() => setModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {error && <div style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 13 }}>{error}</div>}
                <div className="form-grid">
                  <div className="form-group">
                    <label>Leave Type *</label>
                    <select value={form.leave_type} onChange={e => setForm({ ...form, leave_type: e.target.value })}>
                      <option value="">Select leave type</option>
                      {leaveTypes.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="form-grid form-grid-2">
                    <div className="form-group">
                      <label>From Date *</label>
                      <input type="date" value={form.from_date} min={new Date().toISOString().slice(0, 10)} onChange={e => setForm({ ...form, from_date: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label>To Date *</label>
                      <input type="date" value={form.to_date} min={form.from_date || new Date().toISOString().slice(0, 10)} onChange={e => setForm({ ...form, to_date: e.target.value })} />
                    </div>
                  </div>
                  {getDays() > 0 && (
                    <div style={{ padding: '8px 12px', background: '#eff6ff', borderRadius: 6, fontSize: 13, color: 'var(--primary)', fontWeight: 600 }}>
                      📅 Duration: {getDays()} day{getDays() > 1 ? 's' : ''}
                    </div>
                  )}
                  <div className="form-group">
                    <label>Reason *</label>
                    <textarea value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} rows={3} placeholder="Describe the reason for your leave request..." style={{ resize: 'vertical' }} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Submitting...' : 'Submit Request'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
