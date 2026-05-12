import { useState, useEffect, useCallback } from 'react';
import { attendanceService } from '../../services/attendanceService';

const statusBadge = { present: 'badge-green', absent: 'badge-red', leave: 'badge-yellow', 'half-day': 'badge-blue' };

export default function Attendance() {
  const [attendance, setAttendance] = useState([]);
  const [report, setReport] = useState([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [filter, setFilter] = useState('all');
  const [view, setView] = useState('daily'); // 'daily' | 'report'

  const fetchDaily = useCallback(async () => {
    setLoading(true);
    try {
      const res = await attendanceService.getAll({ date });
      setAttendance(res.data.attendance || []);
    } catch {
      setAttendance([]);
    }
    setLoading(false);
  }, [date]);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const res = await attendanceService.getReport({ month });
      setReport(res.data.report || []);
    } catch {
      setReport([]);
    }
    setLoading(false);
  }, [month]);

  useEffect(() => {
    if (view === 'daily') fetchDaily();
    else fetchReport();
  }, [view, fetchDaily, fetchReport]);

  const filtered = filter === 'all' ? attendance : attendance.filter(r => r.status === filter);
  const counts = {
    present: attendance.filter(r => r.status === 'present').length,
    absent: attendance.filter(r => r.status === 'absent').length,
    leave: attendance.filter(r => r.status === 'leave').length,
    halfday: attendance.filter(r => r.status === 'half-day').length,
  };

  const fmtHours = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) return '-';
    try {
      const [ih, im] = checkIn.split(':').map(Number);
      const [oh, om] = checkOut.split(':').map(Number);
      const mins = (oh * 60 + om) - (ih * 60 + im);
      if (mins < 0) return '-';
      return `${Math.floor(mins / 60)}h ${mins % 60}m`;
    } catch { return '-'; }
  };

  return (
    <div>
      <div className="page-header">
        <div><h1>Attendance</h1><p>Track employee daily attendance</p></div>
        <div style={{ display: 'flex', gap: 10 }}>
          {view === 'daily'
            ? <input type="date" value={date} onChange={e => setDate(e.target.value)}
                style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, outline: 'none' }} />
            : <input type="month" value={month} onChange={e => setMonth(e.target.value)}
                style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, outline: 'none' }} />
          }
          <button className={`btn ${view === 'daily' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setView('daily')}>Daily</button>
          <button className={`btn ${view === 'report' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setView('report')}>Monthly Report</button>
        </div>
      </div>

      {view === 'daily' && (
        <>
          <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 20 }}>
            {[
              { label: 'Present', value: counts.present, color: 'var(--success)', bg: '#f0fdf4' },
              { label: 'Absent', value: counts.absent, color: 'var(--danger)', bg: '#fef2f2' },
              { label: 'On Leave', value: counts.leave, color: 'var(--warning)', bg: '#fefce8' },
              { label: 'Half Day', value: counts.halfday, color: 'var(--primary)', bg: '#eff6ff' },
            ].map(s => (
              <div key={s.label} className="stat-card" style={{ padding: 16 }}>
                <div><div className="stat-value" style={{ color: s.color, fontSize: 22 }}>{s.value}</div><div className="stat-label">{s.label}</div></div>
              </div>
            ))}
          </div>

          <div className="card">
            <div className="card-header">
              <h3>Attendance — {new Date(date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h3>
              <div style={{ display: 'flex', gap: 6 }}>
                {['all', 'present', 'absent', 'leave', 'half-day'].map(s => (
                  <button key={s} className={`btn btn-sm ${filter === s ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setFilter(s)} style={{ textTransform: 'capitalize' }}>{s}</button>
                ))}
              </div>
            </div>
            <div className="table-wrap">
              {loading ? <div className="loading-overlay"><div className="spinner" /></div> : (
                <table>
                  <thead><tr><th>#</th><th>Employee</th><th>Department</th><th>Check In</th><th>Check Out</th><th>Hours</th><th>Status</th></tr></thead>
                  <tbody>
                    {filtered.map((r, i) => (
                      <tr key={r.id}>
                        <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{i + 1}</td>
                        <td><strong>{r.employee}</strong></td>
                        <td><span className="badge badge-gray">{r.department}</span></td>
                        <td style={{ fontFamily: 'monospace', fontSize: 13 }}>{r.check_in || '-'}</td>
                        <td style={{ fontFamily: 'monospace', fontSize: 13 }}>{r.check_out || '-'}</td>
                        <td style={{ fontWeight: 600 }}>{fmtHours(r.check_in, r.check_out)}</td>
                        <td><span className={`badge ${statusBadge[r.status] || 'badge-gray'}`} style={{ textTransform: 'capitalize' }}>{r.status}</span></td>
                      </tr>
                    ))}
                    {filtered.length === 0 && (
                      <tr><td colSpan={7}><div className="empty-state"><h3>No records</h3><p>No attendance data for this date.</p></div></td></tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}

      {view === 'report' && (
        <div className="card">
          <div className="card-header">
            <h3>Monthly Report — {new Date(month + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h3>
            <span className="badge badge-blue">{report.length} employees</span>
          </div>
          <div className="table-wrap">
            {loading ? <div className="loading-overlay"><div className="spinner" /></div> : (
              <table>
                <thead><tr><th>Employee</th><th>Department</th><th>Present</th><th>Absent</th><th>Leave</th><th>Half Day</th><th>Attendance %</th></tr></thead>
                <tbody>
                  {report.map((r, i) => {
                    const total = parseInt(r.present_days) + parseInt(r.absent_days) + parseInt(r.leave_days) + parseInt(r.half_days);
                    const pct = total > 0 ? Math.round((parseInt(r.present_days) / total) * 100) : 0;
                    return (
                      <tr key={i}>
                        <td><strong>{r.name}</strong></td>
                        <td><span className="badge badge-gray">{r.department}</span></td>
                        <td style={{ color: 'var(--success)', fontWeight: 600 }}>{r.present_days}</td>
                        <td style={{ color: 'var(--danger)', fontWeight: 600 }}>{r.absent_days}</td>
                        <td style={{ color: 'var(--warning)', fontWeight: 600 }}>{r.leave_days}</td>
                        <td style={{ color: 'var(--primary)', fontWeight: 600 }}>{r.half_days}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ flex: 1, height: 6, background: '#f1f5f9', borderRadius: 3, overflow: 'hidden' }}>
                              <div style={{ width: `${pct}%`, height: '100%', background: pct >= 80 ? 'var(--success)' : pct >= 60 ? 'var(--warning)' : 'var(--danger)', borderRadius: 3 }} />
                            </div>
                            <span style={{ fontSize: 12, fontWeight: 600, minWidth: 36 }}>{pct}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {report.length === 0 && (
                    <tr><td colSpan={7}><div className="empty-state"><h3>No data</h3><p>No attendance records for this month.</p></div></td></tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
