import { useState, useEffect, useCallback } from 'react';

// ─── Constants ────────────────────────────────────────────────────────────────
const STATUS_META = {
  completed:   { label: 'Completed',   color: '#10b981', bg: '#d1fae5' },
  in_progress: { label: 'In Progress', color: '#f59e0b', bg: '#fef3c7' },
  pending:     { label: 'Pending',     color: '#94a3b8', bg: '#f1f5f9' },
};
const APPROVAL_META = {
  approved: { label: 'Approved', color: '#10b981', bg: '#d1fae5' },
  rejected: { label: 'Rejected', color: '#dc2626', bg: '#fee2e2' },
  pending:  { label: 'Pending',  color: '#f59e0b', bg: '#fef3c7' },
};

const fmtHours = (h) => {
  const hrs = Math.floor(h);
  const mins = Math.round((h - hrs) * 60);
  return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
};
const fmtDate = (d) => new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
const today = () => new Date().toISOString().split('T')[0];
const LS_KEY = 'gully_hr_timesheets';

// Pull from ALL employees (shared localStorage key – in real app would be API)
const loadAllEntries = () => {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); } catch { return []; }
};
const saveAllEntries = (entries) => localStorage.setItem(LS_KEY, JSON.stringify(entries));

// Mock employee data to simulate multi-employee
const MOCK_EMPLOYEES = [
  { id: 1, name: 'Ravi Kumar', department: 'Engineering', position: 'Sr. Developer' },
  { id: 2, name: 'Priya Sharma', department: 'Design', position: 'UI/UX Designer' },
  { id: 3, name: 'Arjun Mehta', department: 'QA', position: 'QA Engineer' },
];

function Badge({ status, type = 'task' }) {
  const meta = type === 'approval' ? APPROVAL_META[status] : STATUS_META[status];
  if (!meta) return null;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: meta.bg, color: meta.color }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: meta.color, display: 'inline-block' }} />
      {meta.label}
    </span>
  );
}

function KPI({ label, value, icon, color }) {
  return (
    <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-lg)', padding: '18px 20px', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>{label}</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: color || 'var(--text)' }}>{value}</div>
        </div>
        <div style={{ fontSize: 28, opacity: 0.7 }}>{icon}</div>
      </div>
    </div>
  );
}

export default function AdminTimesheets() {
  const [entries, setEntries] = useState([]);
  const [filterEmp, setFilterEmp] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterApproval, setFilterApproval] = useState('');
  const [selected, setSelected] = useState(null);
  const [rejectNote, setRejectNote] = useState('');
  const [bulkSelected, setBulkSelected] = useState([]);
  const [tab, setTab] = useState('all'); // all | pending | approved | rejected

  const load = useCallback(() => {
    // Enrich entries with mock employee data for demo
    const raw = loadAllEntries();
    const enriched = raw.map((e, i) => ({
      ...e,
      employeeName: e.employeeName || MOCK_EMPLOYEES[i % MOCK_EMPLOYEES.length].name,
      department: e.department || MOCK_EMPLOYEES[i % MOCK_EMPLOYEES.length].department,
      employeeId: e.employeeId || MOCK_EMPLOYEES[i % MOCK_EMPLOYEES.length].id,
    }));
    setEntries(enriched);
  }, []);

  useEffect(() => { load(); }, [load]);

  const totalHours = entries.reduce((s, e) => s + (e.hours || 0), 0);
  const pendingCount = entries.filter(e => e.approvalStatus === 'pending').length;
  const approvedCount = entries.filter(e => e.approvalStatus === 'approved').length;
  const uniqueEmps = [...new Set(entries.map(e => e.employeeName).filter(Boolean))];

  const updateApproval = (id, status, note = '') => {
    const all = loadAllEntries();
    const updated = all.map(e => e.id === id ? { ...e, approvalStatus: status, reviewNote: note, reviewedAt: new Date().toISOString() } : e);
    saveAllEntries(updated);
    load();
    setSelected(null);
  };

  const bulkApprove = () => {
    const all = loadAllEntries();
    const updated = all.map(e => bulkSelected.includes(e.id) ? { ...e, approvalStatus: 'approved', reviewedAt: new Date().toISOString() } : e);
    saveAllEntries(updated);
    setBulkSelected([]);
    load();
  };

  const exportCSV = () => {
    const rows = [['Employee', 'Dept', 'Date', 'Task', 'Category', 'Hours', 'Status', 'Approval']];
    filtered.forEach(e => rows.push([e.employeeName, e.department, e.date, e.taskTitle, e.category, e.hours, e.status, e.approvalStatus]));
    const csv = rows.map(r => r.join(',')).join('\n');
    const a = document.createElement('a');
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    a.download = `admin-timesheets-${today()}.csv`;
    a.click();
  };

  const tabFiltered = entries.filter(e => {
    if (tab === 'pending') return e.approvalStatus === 'pending';
    if (tab === 'approved') return e.approvalStatus === 'approved';
    if (tab === 'rejected') return e.approvalStatus === 'rejected';
    return true;
  });

  const filtered = tabFiltered.filter(e => {
    if (filterEmp && e.employeeName !== filterEmp) return false;
    if (filterDate && !e.date.startsWith(filterDate)) return false;
    if (filterApproval && e.approvalStatus !== filterApproval) return false;
    return true;
  });

  const toggleBulk = (id) => setBulkSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const toggleAll = () => setBulkSelected(prev => prev.length === filtered.length ? [] : filtered.map(e => e.id));

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>Timesheet Management</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>Review, approve, or reject employee timesheets</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {bulkSelected.length > 0 && (
            <button onClick={bulkApprove} style={{ padding: '9px 16px', borderRadius: 'var(--radius)', background: '#d1fae5', border: '1px solid #a7f3d0', color: '#065f46', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
              ✓ Approve {bulkSelected.length} Selected
            </button>
          )}
          <button onClick={exportCSV} style={{ padding: '9px 16px', borderRadius: 'var(--radius)', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
            ⬇ Export
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 16, marginBottom: 28 }}>
        <KPI label="Total Entries" value={entries.length} icon="📋" />
        <KPI label="Total Hours" value={fmtHours(totalHours)} icon="⏱" color="var(--primary)" />
        <KPI label="Pending Review" value={pendingCount} icon="⏳" color={pendingCount > 0 ? '#f59e0b' : '#10b981'} />
        <KPI label="Approved" value={approvedCount} icon="✅" color="#10b981" />
        <KPI label="Active Employees" value={uniqueEmps.length} icon="👥" />
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 2, background: 'var(--surface-2)', padding: 4, borderRadius: 'var(--radius)', marginBottom: 20, width: 'fit-content' }}>
        {[
          { id: 'all', label: `All (${entries.length})` },
          { id: 'pending', label: `Pending (${entries.filter(e => e.approvalStatus === 'pending').length})` },
          { id: 'approved', label: `Approved (${entries.filter(e => e.approvalStatus === 'approved').length})` },
          { id: 'rejected', label: `Rejected (${entries.filter(e => e.approvalStatus === 'rejected').length})` },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: '7px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, background: tab === t.id ? 'var(--surface)' : 'transparent', color: tab === t.id ? 'var(--primary)' : 'var(--text-muted)', boxShadow: tab === t.id ? 'var(--shadow)' : 'none', transition: 'var(--transition)' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <select value={filterEmp} onChange={e => setFilterEmp(e.target.value)} style={inp}>
          <option value="">All Employees</option>
          {uniqueEmps.map(n => <option key={n}>{n}</option>)}
        </select>
        <input type="month" value={filterDate} onChange={e => setFilterDate(e.target.value)} style={inp} />
        {(filterEmp || filterDate) && (
          <button onClick={() => { setFilterEmp(''); setFilterDate(''); }} style={{ padding: '8px 12px', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--surface)', cursor: 'pointer', fontSize: 13, color: 'var(--text-muted)' }}>✕ Clear</button>
        )}
      </div>

      {/* Table */}
      <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', boxShadow: 'var(--shadow)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--surface-2)', borderBottom: '2px solid var(--border)' }}>
              <th style={th}><input type="checkbox" checked={bulkSelected.length === filtered.length && filtered.length > 0} onChange={toggleAll} /></th>
              {['Employee', 'Date', 'Task / Project', 'Time', 'Hours', 'Category', 'Status', 'Approval', 'Actions'].map(h => (
                <th key={h} style={th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={10} style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>📭</div>
                No timesheet entries found.
                {entries.length === 0 && <div style={{ marginTop: 8, fontSize: 13 }}>Employees must log time from their dashboard first.</div>}
              </td></tr>
            ) : filtered.map((e, i) => (
              <tr key={e.id} style={{ borderBottom: '1px solid var(--border)', background: bulkSelected.includes(e.id) ? '#eff6ff' : i % 2 === 0 ? 'transparent' : 'var(--surface-2)', transition: 'background 0.15s' }}>
                <td style={td}><input type="checkbox" checked={bulkSelected.includes(e.id)} onChange={() => toggleBulk(e.id)} /></td>
                <td style={td}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--grad-primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13, flexShrink: 0 }}>
                      {(e.employeeName || 'U').split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13 }}>{e.employeeName || 'Employee'}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{e.department}</div>
                    </div>
                  </div>
                </td>
                <td style={td}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{fmtDate(e.date)}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{new Date(e.date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short' })}</div>
                </td>
                <td style={td}>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{e.taskTitle}</div>
                  {e.project && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{e.project}</div>}
                  {e.description && <div style={{ fontSize: 11, color: 'var(--text-faint)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.description}</div>}
                </td>
                <td style={{ ...td, fontFamily: 'JetBrains Mono,monospace', fontSize: 12 }}>{e.startTime}–{e.endTime}</td>
                <td style={{ ...td, fontWeight: 800, color: 'var(--primary)', fontSize: 15 }}>{fmtHours(e.hours || 0)}</td>
                <td style={td}><span style={{ background: 'var(--primary-light)', color: 'var(--primary)', padding: '3px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{e.category}</span></td>
                <td style={td}><Badge status={e.status} type="task" /></td>
                <td style={td}>
                  <div>
                    <Badge status={e.approvalStatus || 'pending'} type="approval" />
                    {e.reviewNote && <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>"{e.reviewNote}"</div>}
                  </div>
                </td>
                <td style={td}>
                  {e.approvalStatus === 'pending' ? (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => updateApproval(e.id, 'approved')} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #a7f3d0', background: '#d1fae5', cursor: 'pointer', fontSize: 12, color: '#065f46', fontWeight: 700 }}>✓</button>
                      <button onClick={() => setSelected(e)} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #fecaca', background: '#fee2e2', cursor: 'pointer', fontSize: 12, color: '#dc2626', fontWeight: 700 }}>✗</button>
                    </div>
                  ) : (
                    <button onClick={() => updateApproval(e.id, 'pending')} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface)', cursor: 'pointer', fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>Reset</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
          {filtered.length > 0 && (
            <tfoot>
              <tr style={{ background: '#eff6ff', borderTop: '2px solid var(--border)' }}>
                <td colSpan={5} style={{ padding: '10px 14px', fontWeight: 700, fontSize: 13 }}>Total ({filtered.length} entries)</td>
                <td style={{ padding: '10px 14px', fontWeight: 800, color: 'var(--primary)', fontSize: 16 }}>{fmtHours(filtered.reduce((s, e) => s + (e.hours || 0), 0))}</td>
                <td colSpan={4} />
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Reject Modal */}
      {selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-xl)', width: '100%', maxWidth: 420, padding: 28 }}>
            <h3 style={{ fontWeight: 800, fontSize: 17, marginBottom: 6 }}>Reject Timesheet Entry</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 16 }}>
              Rejecting <strong>"{selected.taskTitle}"</strong> by <strong>{selected.employeeName}</strong>
            </p>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6, textTransform: 'uppercase' }}>Reason for Rejection</label>
              <textarea value={rejectNote} onChange={e => setRejectNote(e.target.value)} placeholder="Provide feedback to the employee..." rows={3} style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius)', border: '1px solid var(--border)', fontSize: 13, resize: 'vertical', boxSizing: 'border-box' }} />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => { setSelected(null); setRejectNote(''); }} style={{ flex: 1, padding: '10px', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--surface)', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Cancel</button>
              <button onClick={() => { updateApproval(selected.id, 'rejected', rejectNote); setRejectNote(''); }} style={{ flex: 1, padding: '10px', borderRadius: 'var(--radius)', background: '#dc2626', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>Reject Entry</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const inp = { padding: '8px 12px', borderRadius: 'var(--radius)', border: '1px solid var(--border)', fontSize: 13, background: 'var(--surface)', color: 'var(--text)', outline: 'none', minWidth: 160 };
const th = { padding: '11px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px', color: 'var(--text-muted)', whiteSpace: 'nowrap' };
const td = { padding: '11px 14px', fontSize: 13, verticalAlign: 'middle' };
