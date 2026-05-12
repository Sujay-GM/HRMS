import { useState, useEffect, useCallback, useRef } from 'react';

// ─── Constants ────────────────────────────────────────────────────────────────
const CATEGORIES = [
  'Development', 'Design', 'Testing', 'Meetings', 'Documentation',
  'Research', 'Support', 'Training', 'Administration', 'Other',
];
const STATUS_OPTIONS = ['completed', 'in_progress', 'pending'];
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

// ─── Helpers ──────────────────────────────────────────────────────────────────
const today = () => new Date().toISOString().split('T')[0];
const fmtHours = (h) => {
  const hrs = Math.floor(h);
  const mins = Math.round((h - hrs) * 60);
  return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
};
const calcHours = (start, end) => {
  if (!start || !end) return 0;
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  const diff = (eh * 60 + em) - (sh * 60 + sm);
  return diff > 0 ? +(diff / 60).toFixed(2) : 0;
};
const getWeekDates = (offset = 0) => {
  const now = new Date();
  now.setDate(now.getDate() + offset * 7);
  const day = now.getDay();
  const mon = new Date(now);
  mon.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(mon);
    d.setDate(mon.getDate() + i);
    return d.toISOString().split('T')[0];
  });
};
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const fmtDate = (d) => new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
const fmtDateLong = (d) => new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

// ─── Local Storage mock (no backend) ─────────────────────────────────────────
const LS_KEY = 'gully_hr_timesheets';
const loadEntries = () => {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); } catch { return []; }
};
const saveEntries = (entries) => localStorage.setItem(LS_KEY, JSON.stringify(entries));
let _nextId = Date.now();

// ─── Sub-components ───────────────────────────────────────────────────────────
function KPICard({ icon, label, value, sub, color, gradient }) {
  return (
    <div style={{
      background: gradient || 'var(--surface)',
      borderRadius: 'var(--radius-lg)',
      padding: '20px 22px',
      boxShadow: 'var(--shadow-md)',
      border: gradient ? 'none' : '1px solid var(--border)',
      color: gradient ? '#fff' : 'var(--text)',
      position: 'relative', overflow: 'hidden',
    }}>
      {gradient && <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', opacity: gradient ? 0.8 : undefined, color: gradient ? undefined : 'var(--text-muted)', marginBottom: 6 }}>{label}</div>
          <div style={{ fontSize: 28, fontWeight: 800, lineHeight: 1, color: gradient ? '#fff' : (color || 'var(--text)') }}>{value}</div>
          {sub && <div style={{ fontSize: 12, marginTop: 4, opacity: 0.7 }}>{sub}</div>}
        </div>
        <div style={{ fontSize: 24, opacity: 0.8 }}>{icon}</div>
      </div>
    </div>
  );
}

function StatusBadge({ status, type = 'task' }) {
  const meta = type === 'approval' ? APPROVAL_META[status] : STATUS_META[status];
  if (!meta) return null;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: meta.bg, color: meta.color }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: meta.color, display: 'inline-block' }} />
      {meta.label}
    </span>
  );
}

function LiveTimer({ onLog }) {
  const [running, setRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const interval = useRef(null);

  const start = () => {
    const now = new Date();
    setStartTime(now);
    setRunning(true);
    interval.current = setInterval(() => setSeconds(s => s + 1), 1000);
  };
  const stop = () => {
    clearInterval(interval.current);
    setRunning(false);
    const endTime = new Date();
    const st = `${String(startTime.getHours()).padStart(2,'0')}:${String(startTime.getMinutes()).padStart(2,'0')}`;
    const et = `${String(endTime.getHours()).padStart(2,'0')}:${String(endTime.getMinutes()).padStart(2,'0')}`;
    onLog({ startTime: st, endTime: et });
    setSeconds(0);
    setStartTime(null);
  };

  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const display = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;

  return (
    <div style={{ background: running ? 'linear-gradient(135deg,#064e3b,#065f46)' : 'var(--surface-2)', borderRadius: 'var(--radius-lg)', padding: '16px 20px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: running ? '#10b981' : '#94a3b8', boxShadow: running ? '0 0 0 4px rgba(16,185,129,0.2)' : 'none', animation: running ? 'pulse 1.5s infinite' : 'none' }} />
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 26, fontWeight: 700, color: running ? '#fff' : 'var(--text)', letterSpacing: 2 }}>{display}</span>
      </div>
      <div style={{ marginLeft: 'auto' }}>
        {!running ? (
          <button onClick={start} style={{ padding: '8px 20px', borderRadius: 'var(--radius)', background: 'var(--grad-secondary)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
            ▶ Start Timer
          </button>
        ) : (
          <button onClick={stop} style={{ padding: '8px 20px', borderRadius: 'var(--radius)', background: '#dc2626', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
            ■ Stop & Log
          </button>
        )}
      </div>
      {running && <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', width: '100%' }}>
        Started at {startTime?.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} · Stop to create a timesheet entry
      </span>}
      <style>{`@keyframes pulse { 0%,100%{box-shadow:0 0 0 4px rgba(16,185,129,0.2)} 50%{box-shadow:0 0 0 8px rgba(16,185,129,0.1)} }`}</style>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function MyTimesheet() {
  const [entries, setEntries] = useState([]);
  const [weekOffset, setWeekOffset] = useState(0);
  const [modal, setModal] = useState(false);
  const [editEntry, setEditEntry] = useState(null);
  const [activeTab, setActiveTab] = useState('weekly'); // weekly | list | log
  const [form, setForm] = useState({
    date: today(), startTime: '09:00', endTime: '17:00',
    taskTitle: '', description: '', category: 'Development',
    status: 'completed', project: '',
  });
  const [filterDate, setFilterDate] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [success, setSuccess] = useState('');

  const weekDates = getWeekDates(weekOffset);

  const load = useCallback(() => setEntries(loadEntries()), []);
  useEffect(() => { load(); }, [load]);

  const totalHours = form.startTime && form.endTime ? calcHours(form.startTime, form.endTime) : 0;

  const weekEntries = entries.filter(e => weekDates.includes(e.date));
  const weekTotal = weekEntries.reduce((s, e) => s + (e.hours || 0), 0);
  const overtimeHours = Math.max(0, weekTotal - 40);
  const thisWeekEntries = getWeekDates(0);
  const currentWeekHours = entries.filter(e => thisWeekEntries.includes(e.date)).reduce((s, e) => s + (e.hours || 0), 0);
  const pendingCount = entries.filter(e => e.approvalStatus === 'pending').length;

  const openModal = (entry = null) => {
    if (entry) {
      setEditEntry(entry);
      setForm({ date: entry.date, startTime: entry.startTime, endTime: entry.endTime, taskTitle: entry.taskTitle, description: entry.description || '', category: entry.category, status: entry.status, project: entry.project || '' });
    } else {
      setEditEntry(null);
      setForm({ date: today(), startTime: '09:00', endTime: '17:00', taskTitle: '', description: '', category: 'Development', status: 'completed', project: '' });
    }
    setModal(true);
  };

  const handleTimerLog = ({ startTime, endTime }) => {
    setForm(f => ({ ...f, startTime, endTime, date: today() }));
    setEditEntry(null);
    setModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.taskTitle || !form.date || !form.startTime || !form.endTime) return;
    const hours = calcHours(form.startTime, form.endTime);
    const all = loadEntries();
    if (editEntry) {
      const updated = all.map(en => en.id === editEntry.id ? { ...en, ...form, hours, updatedAt: new Date().toISOString() } : en);
      saveEntries(updated);
    } else {
      const newEntry = { id: ++_nextId, ...form, hours, approvalStatus: 'pending', createdAt: new Date().toISOString() };
      saveEntries([newEntry, ...all]);
    }
    setModal(false);
    setSuccess(editEntry ? 'Entry updated successfully!' : 'Timesheet entry logged!');
    setTimeout(() => setSuccess(''), 3000);
    load();
  };

  const handleDelete = (id) => {
    if (!window.confirm('Delete this entry?')) return;
    saveEntries(loadEntries().filter(e => e.id !== id));
    load();
  };

  const filteredEntries = entries.filter(e => {
    if (filterDate && !e.date.startsWith(filterDate)) return false;
    if (filterCat && e.category !== filterCat) return false;
    return true;
  });

  // Export CSV
  const exportCSV = () => {
    const rows = [['Date', 'Task', 'Project', 'Category', 'Start', 'End', 'Hours', 'Status', 'Approval']];
    filteredEntries.forEach(e => rows.push([e.date, e.taskTitle, e.project, e.category, e.startTime, e.endTime, e.hours, e.status, e.approvalStatus]));
    const csv = rows.map(r => r.join(',')).join('\n');
    const a = document.createElement('a');
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    a.download = `timesheet-${today()}.csv`;
    a.click();
  };

  const dayHours = (date) => weekEntries.filter(e => e.date === date).reduce((s, e) => s + (e.hours || 0), 0);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)', margin: 0 }}>My Timesheets</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>Track your daily work logs, hours, and tasks</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={exportCSV} style={{ padding: '9px 16px', borderRadius: 'var(--radius)', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
            ⬇ Export CSV
          </button>
          <button onClick={() => openModal()} style={{ padding: '9px 18px', borderRadius: 'var(--radius)', background: 'var(--grad-primary)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, boxShadow: 'var(--shadow-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
            + Log Time
          </button>
        </div>
      </div>

      {/* Success */}
      {success && (
        <div style={{ background: '#d1fae5', border: '1px solid #a7f3d0', color: '#065f46', padding: '10px 16px', borderRadius: 'var(--radius)', marginBottom: 20, fontSize: 13, fontWeight: 600 }}>
          ✓ {success}
        </div>
      )}

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 16, marginBottom: 28 }}>
        <KPICard icon="⏱" label="This Week" value={fmtHours(currentWeekHours)} sub="of 40h target" color="var(--primary)" gradient={currentWeekHours >= 40 ? 'var(--grad-primary)' : undefined} />
        <KPICard icon="🔥" label="Overtime" value={fmtHours(overtimeHours)} sub={overtimeHours > 0 ? 'This week' : 'None this week'} color={overtimeHours > 0 ? '#dc2626' : '#10b981'} />
        <KPICard icon="📋" label="Total Entries" value={entries.length} sub="All time" />
        <KPICard icon="⏳" label="Pending Approval" value={pendingCount} sub="Awaiting review" color={pendingCount > 0 ? '#f59e0b' : '#10b981'} />
      </div>

      {/* Live Timer */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)', marginBottom: 8 }}>Live Timer</div>
        <LiveTimer onLog={handleTimerLog} />
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 2, background: 'var(--surface-2)', padding: 4, borderRadius: 'var(--radius)', marginBottom: 24, width: 'fit-content' }}>
        {[{ id: 'weekly', label: '📅 Weekly View' }, { id: 'list', label: '📋 All Entries' }, { id: 'log', label: '+ Quick Log' }].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{ padding: '7px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, background: activeTab === t.id ? 'var(--surface)' : 'transparent', color: activeTab === t.id ? 'var(--primary)' : 'var(--text-muted)', boxShadow: activeTab === t.id ? 'var(--shadow)' : 'none', transition: 'var(--transition)' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── WEEKLY VIEW ─────────────────────────────────────────────────────── */}
      {activeTab === 'weekly' && (
        <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)', overflow: 'hidden' }}>
          {/* Week nav */}
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--surface-2)' }}>
            <button onClick={() => setWeekOffset(o => o - 1)} style={{ padding: '6px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--surface)', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>← Prev</button>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 800, fontSize: 15 }}>
                {weekOffset === 0 ? 'This Week' : weekOffset === -1 ? 'Last Week' : weekOffset === 1 ? 'Next Week' : `Week of ${fmtDate(weekDates[0])}`}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{fmtDate(weekDates[0])} – {fmtDate(weekDates[6])}</div>
            </div>
            <button onClick={() => setWeekOffset(o => o + 1)} style={{ padding: '6px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--surface)', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Next →</button>
          </div>

          {/* Day columns */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
              <thead>
                <tr>
                  {weekDates.map((d, i) => {
                    const isToday = d === today();
                    const hrs = dayHours(d);
                    return (
                      <th key={d} style={{ padding: '14px 10px', textAlign: 'center', borderBottom: '1px solid var(--border)', borderRight: i < 6 ? '1px solid var(--border)' : 'none', background: isToday ? '#eff6ff' : 'transparent', minWidth: 130 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: isToday ? 'var(--primary)' : 'var(--text-muted)' }}>{DAY_LABELS[i]}</div>
                        <div style={{ fontSize: 15, fontWeight: 800, color: isToday ? 'var(--primary)' : 'var(--text)', marginTop: 2 }}>{fmtDate(d)}</div>
                        <div style={{ marginTop: 6, padding: '2px 8px', borderRadius: 20, background: hrs > 0 ? '#d1fae5' : 'var(--surface-2)', color: hrs > 0 ? '#065f46' : 'var(--text-faint)', fontSize: 11, fontWeight: 700, display: 'inline-block' }}>
                          {hrs > 0 ? fmtHours(hrs) : '—'}
                        </div>
                        {i < 5 && hrs >= 8 && <div style={{ fontSize: 10, color: '#10b981', fontWeight: 700, marginTop: 2 }}>✓ Full day</div>}
                        {i < 5 && hrs > 0 && hrs < 8 && <div style={{ fontSize: 10, color: '#f59e0b', fontWeight: 700, marginTop: 2 }}>⚠ Partial</div>}
                        {(i === 5 || i === 6) && <div style={{ fontSize: 10, color: 'var(--text-faint)', marginTop: 2 }}>Weekend</div>}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                <tr>
                  {weekDates.map((d, i) => {
                    const dayEntries = weekEntries.filter(e => e.date === d);
                    return (
                      <td key={d} style={{ verticalAlign: 'top', padding: 10, borderRight: i < 6 ? '1px solid var(--border)' : 'none', background: d === today() ? '#fafcff' : 'transparent' }}>
                        {dayEntries.length === 0 ? (
                          <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-faint)', fontSize: 12 }}>
                            <div style={{ fontSize: 20, marginBottom: 4 }}>○</div>No entries
                          </div>
                        ) : dayEntries.map(e => (
                          <div key={e.id} onClick={() => openModal(e)} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 10px', marginBottom: 6, cursor: 'pointer', transition: 'var(--transition)', borderLeft: `3px solid ${STATUS_META[e.status]?.color || '#94a3b8'}' ` }}
                            onMouseEnter={el => el.currentTarget.style.boxShadow = 'var(--shadow-md)'}
                            onMouseLeave={el => el.currentTarget.style.boxShadow = 'none'}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.taskTitle}</div>
                            <div style={{ fontSize: 11, color: 'var(--primary)', fontWeight: 600 }}>{fmtHours(e.hours)}</div>
                            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{e.category}</div>
                            <StatusBadge status={e.approvalStatus} type="approval" />
                          </div>
                        ))}
                        <button onClick={() => { setForm(f => ({ ...f, date: d })); openModal(); }} style={{ width: '100%', padding: '6px', borderRadius: 6, border: '1px dashed var(--border-dark)', background: 'transparent', cursor: 'pointer', fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>+ Add</button>
                      </td>
                    );
                  })}
                </tr>
                {/* Weekly total row */}
                <tr style={{ background: 'var(--surface-2)' }}>
                  <td colSpan={7} style={{ padding: '12px 16px', borderTop: '2px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 800, fontSize: 14 }}>Weekly Total: <span style={{ color: weekTotal >= 40 ? '#10b981' : weekTotal > 0 ? '#f59e0b' : 'var(--text-muted)' }}>{fmtHours(weekTotal)}</span></span>
                      <div style={{ flex: 1, height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden', maxWidth: 300 }}>
                        <div style={{ height: '100%', width: `${Math.min(100, (weekTotal / 40) * 100)}%`, background: weekTotal >= 40 ? '#10b981' : 'var(--primary)', borderRadius: 3, transition: 'width 0.5s' }} />
                      </div>
                      <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{Math.round((weekTotal / 40) * 100)}% of 40h</span>
                      {overtimeHours > 0 && <span style={{ padding: '3px 10px', borderRadius: 20, background: '#fee2e2', color: '#dc2626', fontSize: 12, fontWeight: 700 }}>+{fmtHours(overtimeHours)} Overtime</span>}
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── LIST VIEW ───────────────────────────────────────────────────────── */}
      {activeTab === 'list' && (
        <div>
          {/* Filters */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
            <input type="month" value={filterDate} onChange={e => setFilterDate(e.target.value)} style={{ padding: '8px 12px', borderRadius: 'var(--radius)', border: '1px solid var(--border)', fontSize: 13, background: 'var(--surface)', color: 'var(--text)' }} />
            <select value={filterCat} onChange={e => setFilterCat(e.target.value)} style={{ padding: '8px 12px', borderRadius: 'var(--radius)', border: '1px solid var(--border)', fontSize: 13, background: 'var(--surface)', color: 'var(--text)' }}>
              <option value="">All Categories</option>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
            {(filterDate || filterCat) && <button onClick={() => { setFilterDate(''); setFilterCat(''); }} style={{ padding: '8px 12px', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--surface)', cursor: 'pointer', fontSize: 13, color: 'var(--text-muted)' }}>✕ Clear</button>}
          </div>

          <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', boxShadow: 'var(--shadow)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--border)' }}>
                  {['Date', 'Task / Project', 'Category', 'Time', 'Hours', 'Status', 'Approval', ''].map(h => (
                    <th key={h} style={{ padding: '11px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px', color: 'var(--text-muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredEntries.length === 0 ? (
                  <tr><td colSpan={8} style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
                    No timesheet entries yet. Click "Log Time" to get started.
                  </td></tr>
                ) : filteredEntries.map((e, i) => (
                  <tr key={e.id} style={{ borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? 'transparent' : 'var(--surface-2)' }}>
                    <td style={{ padding: '11px 14px', fontSize: 13 }}>
                      <div style={{ fontWeight: 600 }}>{fmtDate(e.date)}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{new Date(e.date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short' })}</div>
                    </td>
                    <td style={{ padding: '11px 14px', fontSize: 13 }}>
                      <div style={{ fontWeight: 700, color: 'var(--text)' }}>{e.taskTitle}</div>
                      {e.project && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{e.project}</div>}
                      {e.description && <div style={{ fontSize: 11, color: 'var(--text-faint)', maxWidth: 220, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.description}</div>}
                    </td>
                    <td style={{ padding: '11px 14px' }}>
                      <span style={{ background: 'var(--primary-light)', color: 'var(--primary)', padding: '3px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{e.category}</span>
                    </td>
                    <td style={{ padding: '11px 14px', fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'JetBrains Mono,monospace' }}>
                      {e.startTime} – {e.endTime}
                    </td>
                    <td style={{ padding: '11px 14px', fontWeight: 800, color: 'var(--primary)', fontSize: 14 }}>{fmtHours(e.hours)}</td>
                    <td style={{ padding: '11px 14px' }}><StatusBadge status={e.status} type="task" /></td>
                    <td style={{ padding: '11px 14px' }}><StatusBadge status={e.approvalStatus} type="approval" /></td>
                    <td style={{ padding: '11px 14px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => openModal(e)} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface)', cursor: 'pointer', fontSize: 12, color: 'var(--primary)', fontWeight: 600 }}>Edit</button>
                        <button onClick={() => handleDelete(e.id)} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #fecaca', background: '#fef2f2', cursor: 'pointer', fontSize: 12, color: '#dc2626', fontWeight: 600 }}>Del</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              {filteredEntries.length > 0 && (
                <tfoot>
                  <tr style={{ background: '#eff6ff', borderTop: '2px solid var(--border)' }}>
                    <td colSpan={4} style={{ padding: '10px 14px', fontWeight: 700, fontSize: 13 }}>Total ({filteredEntries.length} entries)</td>
                    <td style={{ padding: '10px 14px', fontWeight: 800, color: 'var(--primary)', fontSize: 15 }}>{fmtHours(filteredEntries.reduce((s, e) => s + (e.hours || 0), 0))}</td>
                    <td colSpan={3} />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

      {/* ── QUICK LOG TAB ───────────────────────────────────────────────────── */}
      {activeTab === 'log' && (
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)', padding: 28 }}>
            <h3 style={{ fontWeight: 800, fontSize: 18, marginBottom: 4 }}>Log Time Entry</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 24 }}>Record your work hours and task details</p>
            <TimesheetForm form={form} setForm={setForm} totalHours={totalHours} onSubmit={handleSubmit} />
          </div>
        </div>
      )}

      {/* ── MODAL ───────────────────────────────────────────────────────────── */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-xl)', width: '100%', maxWidth: 560, maxHeight: '90vh', overflow: 'auto' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontWeight: 800, fontSize: 17, margin: 0 }}>{editEntry ? 'Edit Entry' : 'Log Time'}</h3>
                {editEntry && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{fmtDateLong(editEntry.date)}</div>}
              </div>
              <button onClick={() => setModal(false)} style={{ background: 'var(--surface-2)', border: 'none', width: 32, height: 32, borderRadius: '50%', cursor: 'pointer', fontSize: 16, color: 'var(--text-muted)' }}>×</button>
            </div>
            <div style={{ padding: '24px' }}>
              <TimesheetForm form={form} setForm={setForm} totalHours={totalHours} onSubmit={handleSubmit} onCancel={() => setModal(false)} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Reusable Form ────────────────────────────────────────────────────────────
function TimesheetForm({ form, setForm, totalHours, onSubmit, onCancel }) {
  const f = (k) => (v) => setForm(prev => ({ ...prev, [k]: typeof v === 'string' ? v : v.target.value }));
  const hours = calcHours(form.startTime, form.endTime);

  return (
    <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div>
          <label style={lbl}>Date *</label>
          <input type="date" value={form.date} onChange={f('date')} required style={inp} />
        </div>
        <div>
          <label style={lbl}>Project / Team</label>
          <input type="text" value={form.project} onChange={f('project')} placeholder="e.g. Gully HR v2" style={inp} />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
        <div>
          <label style={lbl}>Start Time *</label>
          <input type="time" value={form.startTime} onChange={f('startTime')} required style={inp} />
        </div>
        <div>
          <label style={lbl}>End Time *</label>
          <input type="time" value={form.endTime} onChange={f('endTime')} required style={inp} />
        </div>
        <div>
          <label style={lbl}>Total Hours</label>
          <div style={{ ...inp, background: hours > 0 ? '#d1fae5' : 'var(--surface-2)', color: hours > 0 ? '#065f46' : 'var(--text-muted)', fontWeight: 700, display: 'flex', alignItems: 'center' }}>
            {hours > 0 ? fmtHours(hours) : '—'}
          </div>
        </div>
      </div>
      <div>
        <label style={lbl}>Task Title *</label>
        <input type="text" value={form.taskTitle} onChange={f('taskTitle')} placeholder="What did you work on?" required style={inp} />
      </div>
      <div>
        <label style={lbl}>Description / Notes</label>
        <textarea value={form.description} onChange={f('description')} placeholder="Details, blockers, progress notes..." rows={3} style={{ ...inp, resize: 'vertical' }} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div>
          <label style={lbl}>Category *</label>
          <select value={form.category} onChange={f('category')} style={inp}>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label style={lbl}>Status</label>
          <select value={form.status} onChange={f('status')} style={inp}>
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{STATUS_META[s].label}</option>)}
          </select>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
        {onCancel && <button type="button" onClick={onCancel} style={{ flex: 1, padding: '10px', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--surface)', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Cancel</button>}
        <button type="submit" style={{ flex: 2, padding: '10px', borderRadius: 'var(--radius)', background: 'var(--grad-primary)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, boxShadow: 'var(--shadow-primary)' }}>
          Save Entry
        </button>
      </div>
    </form>
  );
}

const lbl = { display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.3px' };
const inp = { width: '100%', padding: '9px 12px', borderRadius: 'var(--radius)', border: '1px solid var(--border)', fontSize: 13, background: 'var(--surface)', color: 'var(--text)', outline: 'none', boxSizing: 'border-box' };
