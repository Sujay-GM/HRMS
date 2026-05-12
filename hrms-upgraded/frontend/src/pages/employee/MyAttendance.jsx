import { useState, useEffect, useCallback } from 'react';
import { attendanceService } from '../../services/attendanceService';
import toast from 'react-hot-toast';

export default function MyAttendance() {
  const [attendance, setAttendance] = useState([]);
  const [today, setToday]           = useState(null);
  const [loading, setLoading]       = useState(true);
  const [checking, setChecking]     = useState(false);
  const [month, setMonth]           = useState(new Date().toISOString().slice(0, 7));

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await attendanceService.getMe({ month });
      setAttendance(res.data.attendance || []);
      setToday(res.data.today);
    } catch { setAttendance([]); }
    setLoading(false);
  }, [month]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCheckIn = async () => {
    setChecking(true);
    try { await attendanceService.checkIn(); toast.success('✓ Checked in!'); fetchData(); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed to check in'); }
    finally { setChecking(false); }
  };

  const handleCheckOut = async () => {
    setChecking(true);
    try { await attendanceService.checkOut(); toast.success('✓ Checked out!'); fetchData(); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed to check out'); }
    finally { setChecking(false); }
  };

  const fmtTime = (ts) => {
    if (!ts) return '--:--';
    try { return new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }); }
    catch { return ts; }
  };

  const calcHours = (a) => {
    if (!a.check_in_time || !a.check_out_time) return null;
    const diff = (new Date(a.check_out_time) - new Date(a.check_in_time)) / 1000;
    if (diff <= 0) return null;
    return `${Math.floor(diff / 3600)}h ${Math.floor((diff % 3600) / 60)}m`;
  };

  const present  = attendance.filter(a => a.status === 'present').length;
  const absent   = attendance.filter(a => a.status === 'absent').length;
  const onLeave  = attendance.filter(a => a.status === 'leave').length;
  const totalHrs = attendance.reduce((sum, a) => {
    if (!a.check_in_time || !a.check_out_time) return sum;
    return sum + (new Date(a.check_out_time) - new Date(a.check_in_time)) / 3600000;
  }, 0);

  const isCheckedIn  = today?.check_in_time && !today?.check_out_time;
  const isCheckedOut = today?.check_in_time && today?.check_out_time;
  const notChecked   = !today?.check_in_time;

  const statusLabel = isCheckedIn ? 'Currently Checked In' : isCheckedOut ? 'Day Complete' : 'Not Checked In';
  const statusColor = isCheckedIn ? 'var(--secondary)' : isCheckedOut ? 'var(--primary)' : 'var(--text-muted)';

  return (
    <div>
      <div className="page-header">
        <div><h1>My Attendance</h1><p>Track your daily attendance and working hours</p></div>
      </div>

      {/* Today's Status Card */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h3>Today's Status</h3>
            <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700,
              background: isCheckedIn ? 'var(--secondary-light)' : isCheckedOut ? 'var(--primary-light)' : '#f1f5f9',
              color: statusColor, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: statusColor, display: 'inline-block',
                animation: isCheckedIn ? 'pulse 1.4s infinite' : 'none' }} />
              {statusLabel}
            </span>
          </div>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </span>
        </div>
        <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ padding: '16px 24px', background: 'var(--background)', borderRadius: 'var(--radius-lg)', textAlign: 'center', minWidth: 120, border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.7px', marginBottom: 6 }}>Check In</div>
              <div style={{ fontSize: 22, fontWeight: 800, fontFamily: 'monospace', color: today?.check_in_time ? 'var(--secondary)' : 'var(--text-muted)' }}>
                {fmtTime(today?.check_in_time)}
              </div>
            </div>
            <div style={{ padding: '16px 24px', background: 'var(--background)', borderRadius: 'var(--radius-lg)', textAlign: 'center', minWidth: 120, border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.7px', marginBottom: 6 }}>Check Out</div>
              <div style={{ fontSize: 22, fontWeight: 800, fontFamily: 'monospace', color: isCheckedOut ? 'var(--primary)' : 'var(--text-muted)' }}>
                {fmtTime(today?.check_out_time)}
              </div>
            </div>
            {isCheckedOut && calcHours(today) && (
              <div style={{ padding: '16px 24px', background: 'var(--accent-light)', borderRadius: 'var(--radius-lg)', textAlign: 'center', minWidth: 120, border: '1px solid rgba(233,176,41,0.2)' }}>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.7px', marginBottom: 6 }}>Hours</div>
                <div style={{ fontSize: 22, fontWeight: 800, fontFamily: 'monospace', color: 'var(--accent)' }}>
                  {calcHours(today)}
                </div>
              </div>
            )}
          </div>

          <div style={{ marginLeft: 'auto', flexShrink: 0 }}>
            {notChecked && (
              <button className="btn btn-success btn-lg" onClick={handleCheckIn} disabled={checking}
                style={{ minWidth: 150, justifyContent: 'center', fontWeight: 700 }}>
                {checking ? <><span className="spinner" style={{ width: 14, height: 14, borderWidth: 2, borderTopColor: 'white' }} /> Checking...</> : '▶  Check In'}
              </button>
            )}
            {isCheckedIn && (
              <button className="btn btn-danger btn-lg" onClick={handleCheckOut} disabled={checking}
                style={{ minWidth: 150, justifyContent: 'center', fontWeight: 700 }}>
                {checking ? <><span className="spinner" style={{ width: 14, height: 14, borderWidth: 2, borderTopColor: 'white' }} /> Checking...</> : '■  Check Out'}
              </button>
            )}
            {isCheckedOut && (
              <div style={{ padding: '12px 20px', background: 'var(--success-light)', borderRadius: 'var(--radius-lg)', color: 'var(--secondary-dark)', fontWeight: 700, fontSize: 13, border: '1px solid rgba(48,182,125,0.2)' }}>
                ✓ Attendance recorded
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Monthly Stats */}
      <div className="stats-grid" style={{ marginBottom: 20 }}>
        {[
          { label: 'Present Days',  value: present,  color: 'var(--secondary)', bg: 'var(--secondary-light)' },
          { label: 'Absent Days',   value: absent,   color: 'var(--danger)',    bg: 'var(--danger-light)' },
          { label: 'On Leave',      value: onLeave,  color: 'var(--accent)',    bg: 'var(--accent-light)' },
          { label: 'Hours This Month', value: `${Math.floor(totalHrs)}h`, color: 'var(--primary)', bg: 'var(--primary-light)' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div style={{ width: 44, height: 44, borderRadius: 12, background: s.bg, flexShrink: 0 }} />
            <div>
              <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Attendance History Table */}
      <div className="card">
        <div className="card-header">
          <h3>Attendance History</h3>
          <input type="month" value={month} onChange={e => setMonth(e.target.value)}
            style={{ padding: '6px 10px', border: '1.5px solid var(--border)', borderRadius: 'var(--radius)', fontSize: 13, outline: 'none', background: 'var(--surface)' }} />
        </div>
        <div className="table-wrap">
          {loading ? (
            <div className="loading-overlay"><div className="spinner" /></div>
          ) : (
            <table>
              <thead>
                <tr><th>Date</th><th>Day</th><th>Check In</th><th>Check Out</th><th>Hours</th><th>Status</th></tr>
              </thead>
              <tbody>
                {attendance.length > 0 ? attendance.map((a, i) => (
                  <tr key={i}>
                    <td style={{ fontSize: 13, fontWeight: 600 }}>{new Date(a.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(a.date).toLocaleDateString('en-US', { weekday: 'short' })}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: 13, color: 'var(--secondary)' }}>{fmtTime(a.check_in_time)}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: 13, color: a.check_out_time ? 'var(--primary)' : 'var(--text-muted)' }}>{fmtTime(a.check_out_time)}</td>
                    <td style={{ fontWeight: 600 }}>{calcHours(a) || '—'}</td>
                    <td>
                      <span className={`badge ${a.status === 'present' ? 'badge-green' : a.status === 'absent' ? 'badge-red' : a.status === 'leave' ? 'badge-yellow' : 'badge-gray'}`}>
                        {a.status}
                      </span>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={6}>
                    <div className="empty-state">
                      <h3>No records found</h3>
                      <p>No attendance data for the selected month.</p>
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
