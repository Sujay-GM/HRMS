import { useState, useEffect, useCallback } from 'react';
import { leaveService } from '../../services/leaveService';
import { employeeService } from '../../services/employeeService';

const statusBadge = { pending: 'badge-yellow', approved: 'badge-green', rejected: 'badge-red' };
const leaveTypes = ['Annual Leave', 'Sick Leave', 'Personal Leave', 'Maternity Leave', 'Paternity Leave', 'Emergency Leave'];

export default function Leaves() {
  const [leaves, setLeaves] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [modal, setModal] = useState(false);
  const [rejectModal, setRejectModal] = useState(null); // holds leave id
  const [rejectReason, setRejectReason] = useState('');
  const [form, setForm] = useState({ employee_id: '', leave_type: '', from_date: '', to_date: '', reason: '' });
  const [submitting, setSubmitting] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

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

  const fetchEmployees = useCallback(async () => {
    try {
      const res = await employeeService.getAll();
      setEmployees(res.data.employees || res.data || []);
    } catch {
      setEmployees([]);
    }
  }, []);

  useEffect(() => {
    fetchLeaves();
    fetchEmployees();
  }, [fetchLeaves, fetchEmployees]);

  const showSuccess = (msg) => { setSuccess(msg); setTimeout(() => setSuccess(''), 4000); };
  const showError = (msg) => { setError(msg); setTimeout(() => setError(''), 4000); };

  const handleApprove = async (id) => {
    setActionLoading(id + '_approve');
    try {
      await leaveService.approve(id);
      showSuccess('Leave approved. Attendance updated automatically.');
      await fetchLeaves();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to approve leave.');
    }
    setActionLoading(null);
  };

  const handleReject = async () => {
    if (!rejectModal) return;
    setActionLoading(rejectModal + '_reject');
    try {
      await leaveService.reject(rejectModal, rejectReason || 'Not approved');
      showSuccess('Leave rejected.');
      setRejectModal(null);
      setRejectReason('');
      await fetchLeaves();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to reject leave.');
    }
    setActionLoading(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.employee_id || !form.leave_type || !form.from_date || !form.to_date) {
      showError('All fields are required.'); return;
    }
    setSubmitting(true);
    try {
      await leaveService.create(form);
      setModal(false);
      setForm({ employee_id: '', leave_type: '', from_date: '', to_date: '', reason: '' });
      showSuccess('Leave request created successfully.');
      await fetchLeaves();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to create leave request.');
    }
    setSubmitting(false);
  };

  const filtered = filter === 'all' ? leaves : leaves.filter(l => l.status === filter);
  const pendingCount = leaves.filter(l => l.status === 'pending').length;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Leave Management</h1>
          <p>{pendingCount > 0 ? `${pendingCount} leave request(s) pending review` : 'All leave requests are reviewed'}</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setModal(true); setError(''); }}>+ Apply Leave</button>
      </div>

      {success && <div className="alert alert-success" style={{ marginBottom: 16 }}>{success}</div>}
      {error && <div style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 13 }}>{error}</div>}

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 20 }}>
        {[
          { label: 'Total Requests', value: leaves.length, color: 'var(--primary)' },
          { label: 'Pending', value: leaves.filter(l => l.status === 'pending').length, color: 'var(--warning)' },
          { label: 'Approved', value: leaves.filter(l => l.status === 'approved').length, color: 'var(--success)' },
          { label: 'Rejected', value: leaves.filter(l => l.status === 'rejected').length, color: 'var(--danger)' },
        ].map(s => (
          <div key={s.label} className="stat-card" style={{ padding: 16 }}>
            <div><div className="stat-value" style={{ color: s.color, fontSize: 22 }}>{s.value}</div><div className="stat-label">{s.label}</div></div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-header">
          <h3>Leave Requests</h3>
          <div style={{ display: 'flex', gap: 6 }}>
            {['all', 'pending', 'approved', 'rejected'].map(s => (
              <button key={s} className={`btn btn-sm ${filter === s ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setFilter(s)} style={{ textTransform: 'capitalize' }}>
                {s}{s === 'pending' && pendingCount > 0 ? ` (${pendingCount})` : ''}
              </button>
            ))}
          </div>
        </div>
        <div className="table-wrap">
          {loading ? <div className="loading-overlay"><div className="spinner" /></div> : (
            <table>
              <thead><tr><th>Employee</th><th>Type</th><th>From</th><th>To</th><th>Days</th><th>Reason</th><th>Applied On</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {filtered.map(l => (
                  <tr key={l.id}>
                    <td>
                      <div>
                        <strong>{l.employee_name || l.employee}</strong>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{l.department || l.dept}</div>
                      </div>
                    </td>
                    <td><span className="badge badge-blue">{l.leave_type || l.type}</span></td>
                    <td style={{ fontSize: 12 }}>{new Date(l.from_date || l.from).toLocaleDateString()}</td>
                    <td style={{ fontSize: 12 }}>{new Date(l.to_date || l.to).toLocaleDateString()}</td>
                    <td style={{ fontWeight: 600 }}>{l.days || '-'}</td>
                    <td style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 12 }}>{l.reason}</td>
                    <td style={{ fontSize: 11, color: 'var(--text-muted)' }}>{l.applied_on ? new Date(l.applied_on).toLocaleDateString() : '-'}</td>
                    <td><span className={`badge ${statusBadge[l.status]}`} style={{ textTransform: 'capitalize' }}>{l.status}</span></td>
                    <td>
                      {l.status === 'pending' && (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            className="btn btn-success btn-sm"
                            disabled={actionLoading === l.id + '_approve'}
                            onClick={() => handleApprove(l.id)}>
                            {actionLoading === l.id + '_approve' ? '...' : '✓ Approve'}
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            disabled={actionLoading === l.id + '_reject'}
                            onClick={() => { setRejectModal(l.id); setRejectReason(''); }}>
                            ✗ Reject
                          </button>
                        </div>
                      )}
                      {l.status === 'approved' && <span style={{ fontSize: 11, color: 'var(--success)' }}>✓ Approved</span>}
                      {l.status === 'rejected' && <span style={{ fontSize: 11, color: 'var(--danger)' }}>✗ Rejected{l.review_note ? `: ${l.review_note}` : ''}</span>}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={9}><div className="empty-state"><h3>No {filter === 'all' ? '' : filter} leave requests</h3><p>Nothing to show here.</p></div></td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Apply Leave Modal */}
      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h3>Apply Leave for Employee</h3>
              <button className="close-btn" onClick={() => setModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group">
                    <label>Employee *</label>
                    <select value={form.employee_id} onChange={e => setForm({ ...form, employee_id: e.target.value })}>
                      <option value="">Select Employee</option>
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.id}>{emp.name} — {emp.department}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Leave Type *</label>
                    <select value={form.leave_type} onChange={e => setForm({ ...form, leave_type: e.target.value })}>
                      <option value="">Select Type</option>
                      {leaveTypes.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="form-grid form-grid-2">
                    <div className="form-group"><label>From Date *</label><input type="date" value={form.from_date} onChange={e => setForm({ ...form, from_date: e.target.value })} /></div>
                    <div className="form-group"><label>To Date *</label><input type="date" value={form.to_date} min={form.from_date} onChange={e => setForm({ ...form, to_date: e.target.value })} /></div>
                  </div>
                  <div className="form-group">
                    <label>Reason</label>
                    <textarea value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} rows={3} placeholder="Describe the reason for leave..." style={{ resize: 'vertical' }} />
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

      {/* Reject Reason Modal */}
      {rejectModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setRejectModal(null)}>
          <div className="modal" style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <h3>Reject Leave Request</h3>
              <button className="close-btn" onClick={() => setRejectModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Reason for Rejection (optional)</label>
                <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={3}
                  placeholder="Provide a reason for rejection..." style={{ resize: 'vertical' }} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setRejectModal(null)}>Cancel</button>
              <button className="btn btn-danger" disabled={actionLoading} onClick={handleReject}>
                {actionLoading ? 'Rejecting...' : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
