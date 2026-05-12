import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { attendanceService } from '../../services/attendanceService';
import { leaveService } from '../../services/leaveService';
import toast from 'react-hot-toast';

const ClockIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const [profile, setProfile]       = useState(null);
  const [attendance, setAttendance] = useState(null);
  const [recentAtt, setRecentAtt]   = useState([]);
  const [checking, setChecking]     = useState(false);
  const [loading, setLoading]       = useState(true);
  const [myLeaves, setMyLeaves]     = useState([]);
  const [clock, setClock]           = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const [profileRes, attRes, leavesRes] = await Promise.all([
        api.get('/auth/profile'),
        attendanceService.getMe(),
        leaveService.getAll(),
      ]);
      setProfile(profileRes.data);
      setAttendance(attRes.data.today);
      setRecentAtt(attRes.data.attendance?.slice(0, 7) || []);
      setMyLeaves(leavesRes.data.leaves || leavesRes.data || []);
    } catch {
      setProfile({ name: user?.name, email: user?.email, department: '-', position: '-' });
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCheckIn = async () => {
    setChecking(true);
    try {
      await attendanceService.checkIn();
      toast.success('✓ Checked in successfully!');
      fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Check-in failed'); }
    finally { setChecking(false); }
  };

  const handleCheckOut = async () => {
    setChecking(true);
    try {
      await attendanceService.checkOut();
      toast.success('✓ Checked out successfully!');
      fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Check-out failed'); }
    finally { setChecking(false); }
  };

  const p = profile || {};
  const initials = (p.name || user?.name || 'U').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const today = new Date();
  const isCheckedIn  = attendance?.check_in_time && !attendance?.check_out_time;
  const isCheckedOut = attendance?.check_in_time && attendance?.check_out_time;
  const notCheckedIn = !attendance?.check_in_time;

  const fmtTime = (ts) => {
    if (!ts) return '--:--';
    try { return new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }); }
    catch { return ts; }
  };

  const hoursWorked = () => {
    if (!attendance?.check_in_time || !attendance?.check_out_time) return null;
    const diff = (new Date(attendance.check_out_time) - new Date(attendance.check_in_time)) / 1000;
    return `${Math.floor(diff / 3600)}h ${Math.floor((diff % 3600) / 60)}m`;
  };

  const statusLabel = isCheckedIn ? 'Checked In' : isCheckedOut ? 'Day Complete' : 'Not Checked In';
  const statusColor = isCheckedIn ? 'var(--secondary)' : isCheckedOut ? 'var(--primary)' : 'var(--text-muted)';
  const statusBg    = isCheckedIn ? 'var(--secondary-light)' : isCheckedOut ? 'var(--primary-light)' : '#f1f5f9';

  if (loading) return <div className="loading-overlay"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>My Dashboard</h1>
          <p>{today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
        </div>
        <span className="badge badge-teal">Employee</span>
      </div>

      {/* Welcome Banner */}
      <div className="card" style={{ marginBottom: 20, background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))', border: 'none', overflow: 'hidden', position: 'relative' }}>
        <div style={{ position: 'absolute', right: -40, top: -40, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', right: 40, bottom: -60, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />
        <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap', position: 'relative' }}>
          <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 22, flexShrink: 0, border: '2px solid rgba(255,255,255,0.3)' }}>{initials}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ color: 'white', fontSize: 20, fontWeight: 700 }}>Welcome back, {p.name || user?.name}! 👋</h2>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 3 }}>{p.position || 'Employee'} · {p.department || 'General'}</p>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ color: 'rgba(255,255,255,0.95)', fontSize: 26, fontFamily: 'monospace', fontWeight: 700, letterSpacing: 2 }}>
              {clock.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, marginTop: 2 }}>Current Time</div>
          </div>
        </div>
      </div>

      {/* Attendance Check-In Card */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
              <ClockIcon />
            </div>
            <h3>Today's Attendance</h3>
          </div>
          <span style={{ padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: statusBg, color: statusColor, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: statusColor, display: 'inline-block', animation: isCheckedIn ? 'pulse 1.4s infinite' : 'none' }} />
            {statusLabel}
          </span>
        </div>
        <div className="card-body">
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
            {/* Time Boxes */}
            <div style={{ display: 'flex', gap: 12, flex: 1, flexWrap: 'wrap' }}>
              <div style={{ textAlign: 'center', padding: '16px 24px', background: 'var(--background)', borderRadius: 'var(--radius-lg)', minWidth: 120, border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 8 }}>Check In</div>
                <div style={{ fontSize: 22, fontWeight: 800, fontFamily: 'monospace', color: attendance?.check_in_time ? 'var(--secondary)' : 'var(--text-muted)' }}>
                  {fmtTime(attendance?.check_in_time)}
                </div>
              </div>
              <div style={{ textAlign: 'center', padding: '16px 24px', background: 'var(--background)', borderRadius: 'var(--radius-lg)', minWidth: 120, border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 8 }}>Check Out</div>
                <div style={{ fontSize: 22, fontWeight: 800, fontFamily: 'monospace', color: isCheckedOut ? 'var(--primary)' : 'var(--text-muted)' }}>
                  {fmtTime(attendance?.check_out_time)}
                </div>
              </div>
              {isCheckedOut && hoursWorked() && (
                <div style={{ textAlign: 'center', padding: '16px 24px', background: 'var(--accent-light)', borderRadius: 'var(--radius-lg)', minWidth: 120, border: '1px solid rgba(233,176,41,0.2)' }}>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 8 }}>Hours Worked</div>
                  <div style={{ fontSize: 22, fontWeight: 800, fontFamily: 'monospace', color: 'var(--accent)' }}>
                    {hoursWorked()}
                  </div>
                </div>
              )}
            </div>

            {/* Action Button */}
            <div style={{ flexShrink: 0 }}>
              {notCheckedIn && (
                <button
                  className="btn btn-success btn-lg checkin-btn"
                  onClick={handleCheckIn}
                  disabled={checking}
                  style={{ minWidth: 170, justifyContent: 'center', fontSize: 14, fontWeight: 700, letterSpacing: '0.3px', padding: '13px 24px' }}
                >
                  {checking ? (
                    <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2, borderTopColor: 'white' }} /> Checking in...</>
                  ) : (
                    <>▶ &nbsp;Check In</>
                  )}
                </button>
              )}
              {isCheckedIn && (
                <button
                  className="btn btn-danger btn-lg"
                  onClick={handleCheckOut}
                  disabled={checking}
                  style={{ minWidth: 170, justifyContent: 'center', fontSize: 14, fontWeight: 700, letterSpacing: '0.3px', padding: '13px 24px' }}
                >
                  {checking ? (
                    <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2, borderTopColor: 'white' }} /> Checking out...</>
                  ) : (
                    <>■ &nbsp;Check Out</>
                  )}
                </button>
              )}
              {isCheckedOut && (
                <div style={{ padding: '13px 22px', background: 'var(--success-light)', borderRadius: 'var(--radius-lg)', color: 'var(--secondary-dark)', fontWeight: 700, fontSize: 14, border: '1px solid rgba(48,182,125,0.2)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 18 }}>✓</span> Attendance Complete
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Recent Attendance Table */}
        <div className="card">
          <div className="card-header">
            <h3>Recent Attendance</h3>
            <a href="/my-attendance" style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 600 }}>View all →</a>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Date</th><th>Check In</th><th>Check Out</th><th>Status</th></tr>
              </thead>
              <tbody>
                {recentAtt.length > 0 ? recentAtt.map((r, i) => (
                  <tr key={i}>
                    <td style={{ fontSize: 12 }}>{new Date(r.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: 13 }}>{r.check_in || '--:--'}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: 13 }}>{r.check_out || '--:--'}</td>
                    <td><span className={`badge ${r.status === 'present' ? 'badge-green' : r.status === 'absent' ? 'badge-red' : 'badge-gray'}`}>{r.status}</span></td>
                  </tr>
                )) : (
                  <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 24 }}>No attendance records yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* My Info */}
          <div className="card">
            <div className="card-header"><h3>My Info</h3></div>
            <div className="card-body">
              {[
                ['Department', p.department || 'N/A'],
                ['Position', p.position || 'N/A'],
                ['Email', p.email || user?.email],
                ['Work Location', p.work_location || 'N/A'],
              ].map(([label, val]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                  <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                  <strong style={{ textAlign: 'right', maxWidth: '55%', wordBreak: 'break-all' }}>{val}</strong>
                </div>
              ))}
            </div>
          </div>

          {/* Leave Summary */}
          <div className="card">
            <div className="card-header">
              <h3>Leave Summary</h3>
              <a href="/my-leaves" style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 600 }}>View all →</a>
            </div>
            <div className="card-body">
              {[
                { label: 'Pending', value: myLeaves.filter(l => l.status === 'pending').length, color: 'var(--accent)' },
                { label: 'Approved', value: myLeaves.filter(l => l.status === 'approved').length, color: 'var(--secondary)' },
                { label: 'Rejected', value: myLeaves.filter(l => l.status === 'rejected').length, color: 'var(--danger)' },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 13 }}>{item.label}</span>
                  <span style={{ fontWeight: 700, color: item.color, fontSize: 16 }}>{item.value}</span>
                </div>
              ))}
              {myLeaves.filter(l => l.status === 'pending').length > 0 && (
                <div style={{ marginTop: 10, padding: '8px 12px', background: 'var(--warning-light)', borderRadius: 6, fontSize: 12, color: '#92400e' }}>
                  ⏳ {myLeaves.filter(l => l.status === 'pending').length} request(s) awaiting approval
                </div>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div className="card">
            <div className="card-header"><h3>Quick Links</h3></div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <a href="/my-attendance" className="btn btn-secondary" style={{ justifyContent: 'center' }}>View Attendance</a>
              <a href="/my-leaves" className="btn btn-primary" style={{ justifyContent: 'center' }}>Apply for Leave</a>
              <a href="/my-salary" className="btn btn-secondary" style={{ justifyContent: 'center' }}>View Payslip</a>
              <a href="/profile" className="btn btn-secondary" style={{ justifyContent: 'center' }}>Edit Profile</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
