import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { leaveService } from '../../services/leaveService';

const ADMIN_CSS = `
  /* KPI Strip */
  .ad-kpi-strip {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 14px;
    margin-bottom: 24px;
  }
  .ad-kpi {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 15px 16px;
    display: flex;
    align-items: center;
    gap: 13px;
    box-shadow: var(--shadow);
    transition: box-shadow 0.18s, transform 0.18s, border-color 0.18s;
    position: relative;
    overflow: hidden;
  }
  .ad-kpi:hover { box-shadow: var(--shadow-md); transform: translateY(-2px); border-color: var(--border-dark); }
  .ad-kpi::before {
    content: '';
    position: absolute; top: 0; left: 0; right: 0; height: 3px;
    border-radius: 10px 10px 0 0;
    background: var(--ad-accent, var(--primary));
  }
  .ad-kpi-icon {
    width: 40px; height: 40px; border-radius: 9px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; background: var(--ad-bg, var(--primary-light));
  }
  .ad-kpi-icon svg { width: 17px; height: 17px; }
  .ad-kpi-body { flex: 1; }
  .ad-kpi-val { font-size: 24px; font-weight: 800; line-height: 1; letter-spacing: -0.6px; color: var(--text); }
  .ad-kpi-lbl { font-size: 11px; color: var(--text-muted); font-weight: 500; margin-top: 3px; }
  .ad-kpi-sub {
    font-size: 10.5px; font-weight: 600; padding: 2px 6px;
    border-radius: 20px; margin-top: 5px; display: inline-block;
  }

  /* Main grid */
  .ad-main-grid { display: grid; grid-template-columns: 1fr 320px; gap: 20px; align-items: start; }

  /* Table cards */
  .ad-card {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 10px; box-shadow: var(--shadow); overflow: hidden;
    margin-bottom: 20px;
  }
  .ad-card:last-child { margin-bottom: 0; }
  .ad-card-hd {
    padding: 15px 20px; border-bottom: 1px solid var(--border);
    display: flex; align-items: center; justify-content: space-between;
  }
  .ad-card-hd-left { display: flex; align-items: center; gap: 9px; }
  .ad-card-hd h3 { font-size: 13.5px; font-weight: 700; color: var(--text); }
  .ad-view-lnk {
    font-size: 12px; color: var(--primary); font-weight: 600;
    display: flex; align-items: center; gap: 4px;
    padding: 5px 10px; border-radius: 6px; transition: background 0.15s;
  }
  .ad-view-lnk:hover { background: var(--primary-light); }
  .ad-tbl table { width: 100%; border-collapse: collapse; }
  .ad-tbl th {
    padding: 10px 16px; text-align: left;
    font-size: 10.5px; font-weight: 700;
    text-transform: uppercase; letter-spacing: 0.6px;
    color: var(--text-muted); background: var(--surface-2);
    border-bottom: 1px solid var(--border); white-space: nowrap;
  }
  .ad-tbl td {
    padding: 12px 16px; border-bottom: 1px solid var(--border);
    font-size: 13px; color: var(--text-secondary); vertical-align: middle;
  }
  .ad-tbl tr:last-child td { border-bottom: none; }
  .ad-tbl tbody tr { transition: background 0.12s; }
  .ad-tbl tbody tr:hover td { background: #f0f5ff; }

  .emp-av {
    width: 32px; height: 32px; border-radius: 50%;
    background: var(--grad-primary); color: white;
    display: flex; align-items: center; justify-content: center;
    font-weight: 700; font-size: 11px; flex-shrink: 0;
  }
  .emp-name { font-weight: 600; font-size: 13px; color: var(--text); }
  .emp-email { font-size: 11px; color: var(--text-muted); margin-top: 1px; }

  .st-badge {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 3px 9px; border-radius: 20px;
    font-size: 11.5px; font-weight: 600;
  }
  .st-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
  .st-active { background: #dcfce7; color: #166534; }
  .st-active .st-dot { background: #16a34a; }
  .st-inactive { background: #fee2e2; color: #991b1b; }
  .st-inactive .st-dot { background: #dc2626; }

  /* Right panel */
  .ad-right { display: flex; flex-direction: column; gap: 16px; }
  .ad-panel {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 10px; box-shadow: var(--shadow); overflow: hidden;
  }
  .ad-panel-hd {
    padding: 14px 18px; border-bottom: 1px solid var(--border);
    display: flex; align-items: center; gap: 8px;
  }
  .ad-panel-hd h4 { font-size: 13px; font-weight: 700; color: var(--text); flex: 1; }
  .ad-pi {
    width: 28px; height: 28px; border-radius: 7px;
    display: flex; align-items: center; justify-content: center;
    background: var(--surface-2);
  }
  .ad-pi svg { width: 13px; height: 13px; }
  .ad-pb { padding: 14px 18px; }

  /* Attendance breakdown */
  .att-row {
    display: flex; align-items: center; justify-content: space-between;
    padding: 10px 0; border-bottom: 1px solid var(--border);
  }
  .att-row:last-child { border-bottom: none; }
  .att-left { display: flex; align-items: center; gap: 10px; }
  .att-icon {
    width: 30px; height: 30px; border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
  }
  .att-lbl { font-size: 13px; font-weight: 500; color: var(--text-secondary); }
  .att-num { font-size: 20px; font-weight: 800; }

  /* Progress */
  .prog-wrap { margin-top: 14px; }
  .prog-bar-bg { height: 6px; background: var(--border); border-radius: 3px; overflow: hidden; }
  .prog-bar-fill { height: 100%; border-radius: 3px; background: var(--grad-secondary); transition: width 0.7s ease; }
  .prog-caption { font-size: 11px; color: var(--text-muted); margin-top: 6px; font-weight: 600; }

  /* Quick Actions */
  .ad-qa-btn {
    display: flex; align-items: center; gap: 9px;
    padding: 9px 12px; border-radius: 8px;
    font-size: 12.5px; font-weight: 600; cursor: pointer;
    border: 1.5px solid var(--border);
    background: var(--surface); color: var(--text-secondary);
    transition: all 0.15s; font-family: 'Outfit', sans-serif;
    text-align: left; width: 100%; margin-bottom: 7px; position: relative;
  }
  .ad-qa-btn:last-child { margin-bottom: 0; }
  .ad-qa-btn svg { width: 15px; height: 15px; flex-shrink: 0; }
  .ad-qa-btn:hover { background: var(--surface-2); color: var(--text); border-color: var(--border-dark); transform: translateX(2px); }
  .ad-qa-primary {
    background: var(--grad-primary); color: white;
    border-color: transparent; box-shadow: 0 2px 8px rgba(37,99,235,0.2);
  }
  .ad-qa-primary:hover { box-shadow: 0 4px 14px rgba(37,99,235,0.3); color: white; background: var(--grad-primary); filter: brightness(1.06); transform: translateY(-1px); }
  .notif-pill {
    margin-left: auto; background: var(--danger); color: white;
    border-radius: 20px; padding: 1px 7px; font-size: 10px; font-weight: 700;
  }

  /* Page header */
  .ad-page-hd {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 24px; gap: 16px;
  }
  .ad-page-hd h1 { font-size: 22px; font-weight: 800; color: var(--text); letter-spacing: -0.5px; }
  .ad-page-hd p { font-size: 12.5px; color: var(--text-muted); margin-top: 3px; }
  .ad-hd-right { display: flex; align-items: center; gap: 10px; }

  .pending-count { background: #fffbeb; border: 1px solid #fcd34d; color: #92400e; border-radius: 20px; padding: 2px 9px; font-size: 11px; font-weight: 600; }

  @media (max-width: 1100px) {
    .ad-kpi-strip { grid-template-columns: repeat(2, 1fr); }
    .ad-main-grid { grid-template-columns: 1fr; }
    .ad-right { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  }
  @media (max-width: 640px) {
    .ad-kpi-strip { grid-template-columns: repeat(2, 1fr); }
    .ad-right { grid-template-columns: 1fr; }
  }
`;

const StatKpi = ({ label, value, accentColor, bgColor, icon, trend, trendColor, loading }) => (
  <div className="ad-kpi" style={{ '--ad-accent': accentColor, '--ad-bg': bgColor }}>
    <div className="ad-kpi-icon">
      <svg viewBox="0 0 24 24" fill="none" stroke={accentColor} strokeWidth="2">
        <path d={icon} />
      </svg>
    </div>
    <div className="ad-kpi-body">
      {loading
        ? <div className="skeleton" style={{ height: 24, width: 52, borderRadius: 4, marginBottom: 8 }} />
        : <div className="ad-kpi-val">{value ?? '—'}</div>
      }
      <div className="ad-kpi-lbl">{label}</div>
      {trend && !loading && (
        <span className="ad-kpi-sub" style={{ background: trendColor + '18', color: trendColor }}>{trend}</span>
      )}
    </div>
  </div>
);

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats]                   = useState(null);
  const [recentEmployees, setRecentEmployees] = useState([]);
  const [pendingLeaves, setPendingLeaves]   = useState([]);
  const [loading, setLoading]               = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, empRes, leavesRes] = await Promise.allSettled([
        api.get('/dashboard/admin/stats'),
        api.get('/employees?limit=5'),
        leaveService.getAll({ status: 'pending' }),
      ]);
      if (statsRes.status === 'fulfilled') setStats(statsRes.value.data);
      if (empRes.status === 'fulfilled')
        setRecentEmployees(empRes.value.data.employees || empRes.value.data || []);
      if (leavesRes.status === 'fulfilled')
        setPendingLeaves(leavesRes.value.data.leaves || leavesRes.value.data || []);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const s = stats || { total_employees: 0, present_today: 0, on_leave: 0, pending_leaves: 0 };
  const attendanceRate = s.total_employees > 0
    ? Math.round((s.present_today / s.total_employees) * 100) : 0;
  const absent = Math.max(0, (s.total_employees || 0) - (s.present_today || 0) - (s.on_leave || 0));

  const kpis = [
    { label: 'Total Employees', value: s.total_employees, accentColor: '#2563eb', bgColor: '#eff6ff',
      icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
      trendColor: '#2563eb' },
    { label: 'Present Today', value: s.present_today, accentColor: '#059669', bgColor: '#ecfdf5',
      icon: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8',
      trend: `${attendanceRate}% rate`, trendColor: '#059669' },
    { label: 'On Leave', value: s.on_leave, accentColor: '#d97706', bgColor: '#fffbeb',
      icon: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
      trendColor: '#d97706' },
    { label: 'Pending Approvals', value: s.pending_leaves ?? pendingLeaves.length,
      accentColor: '#dc2626', bgColor: '#fef2f2',
      icon: 'M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01',
      trend: (s.pending_leaves ?? pendingLeaves.length) > 0 ? 'Needs review' : null,
      trendColor: '#dc2626' },
  ];

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });

  if (loading) return (
    <>
      <style>{ADMIN_CSS}</style>
      <div className="ad-page-hd">
        <div><h1>Admin Dashboard</h1><p>{today}</p></div>
      </div>
      <div className="ad-kpi-strip">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="ad-kpi" style={{ '--ad-accent': '#e2e8f0', '--ad-bg': '#f8fafc' }}>
            <div className="skeleton" style={{ width: 40, height: 40, borderRadius: 9, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div className="skeleton" style={{ height: 22, width: 55, borderRadius: 4, marginBottom: 8 }} />
              <div className="skeleton" style={{ height: 12, width: 80, borderRadius: 4 }} />
            </div>
          </div>
        ))}
      </div>
      <div className="loading-overlay"><div className="spinner" /></div>
    </>
  );

  return (
    <>
      <style>{ADMIN_CSS}</style>

      {/* Page Header */}
      <div className="ad-page-hd">
        <div>
          <h1>Admin Dashboard</h1>
          <p>{today}</p>
        </div>
        <div className="ad-hd-right">
          <span className="badge badge-blue" style={{ gap: 6 }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            Admin
          </span>
          {pendingLeaves.length > 0 && (
            <span className="pending-count">⚠ {pendingLeaves.length} pending</span>
          )}
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/employees/create')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Add Employee
          </button>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="ad-kpi-strip">
        {kpis.map(k => <StatKpi key={k.label} {...k} loading={false} />)}
      </div>

      {/* Main grid */}
      <div className="ad-main-grid">
        {/* Left column */}
        <div>
          {/* Recent Employees Table */}
          <div className="ad-card">
            <div className="ad-card-hd">
              <div className="ad-card-hd-left">
                <h3>Recent Employees</h3>
                {recentEmployees.length > 0 && (
                  <span style={{ background: '#eff6ff', color: '#1e40af', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>
                    {recentEmployees.length}
                  </span>
                )}
              </div>
              <a href="/employees" className="ad-view-lnk">
                View all
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="11" height="11">
                  <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                </svg>
              </a>
            </div>
            <div className="ad-tbl">
              <table>
                <thead>
                  <tr><th>Employee</th><th>Department</th><th>Position</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {recentEmployees.length > 0 ? (
                    recentEmployees.map(e => (
                      <tr key={e.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div className="emp-av">
                              {e.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="emp-name">{e.name}</div>
                              <div className="emp-email">{e.email}</div>
                            </div>
                          </div>
                        </td>
                        <td><span className="badge badge-blue">{e.department || '—'}</span></td>
                        <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{e.position || '—'}</td>
                        <td>
                          <span className={`st-badge ${e.is_active !== false ? 'st-active' : 'st-inactive'}`}>
                            <span className="st-dot" />
                            {e.is_active !== false ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', padding: 44, color: 'var(--text-muted)' }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                          style={{ width: 32, height: 32, margin: '0 auto 10px', display: 'block', opacity: 0.25 }}>
                          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8"/>
                        </svg>
                        No employees yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pending Leaves */}
          {pendingLeaves.length > 0 && (
            <div className="ad-card">
              <div className="ad-card-hd">
                <div className="ad-card-hd-left">
                  <h3>Pending Leave Requests</h3>
                  <span className="badge badge-yellow">
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#d97706', display: 'inline-block' }} />
                    {pendingLeaves.length} pending
                  </span>
                </div>
                <a href="/leaves" className="ad-view-lnk">Review all →</a>
              </div>
              <div className="ad-tbl">
                <table>
                  <thead>
                    <tr><th>Employee</th><th>Type</th><th>Duration</th><th>Action</th></tr>
                  </thead>
                  <tbody>
                    {pendingLeaves.slice(0, 5).map(l => (
                      <tr key={l.id}>
                        <td style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)' }}>{l.employee_name}</td>
                        <td><span className="badge badge-yellow">{l.leave_type}</span></td>
                        <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{l.days} day{l.days > 1 ? 's' : ''}</td>
                        <td><a href="/leaves" className="btn btn-sm btn-primary">Review</a></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="ad-right">
          {/* Attendance Today */}
          <div className="ad-panel">
            <div className="ad-panel-hd">
              <div className="ad-pi">
                <svg viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
              </div>
              <h4>Attendance Today</h4>
              <span className="badge badge-green" style={{ fontSize: 10 }}>{attendanceRate}%</span>
            </div>
            <div className="ad-pb">
              {[
                { label: 'Present', value: s.present_today, color: '#059669', bg: '#ecfdf5', dotBg: '#059669' },
                { label: 'Absent',  value: absent,          color: '#dc2626', bg: '#fef2f2', dotBg: '#dc2626' },
                { label: 'On Leave',value: s.on_leave,      color: '#d97706', bg: '#fffbeb', dotBg: '#d97706' },
              ].map(item => (
                <div key={item.label} className="att-row">
                  <div className="att-left">
                    <div className="att-icon" style={{ background: item.bg }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: item.dotBg }} />
                    </div>
                    <span className="att-lbl">{item.label}</span>
                  </div>
                  <span className="att-num" style={{ color: item.color }}>{item.value}</span>
                </div>
              ))}
              <div className="prog-wrap">
                <div className="prog-bar-bg">
                  <div className="prog-bar-fill" style={{ width: `${attendanceRate}%` }} />
                </div>
                <div className="prog-caption">{attendanceRate}% attendance rate today</div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="ad-panel">
            <div className="ad-panel-hd">
              <div className="ad-pi">
                <svg viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                </svg>
              </div>
              <h4>Quick Actions</h4>
            </div>
            <div className="ad-pb">
              <button className="ad-qa-btn ad-qa-primary" onClick={() => navigate('/employees/create')}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Add Employee
              </button>
              <a href="/leaves" className="ad-qa-btn">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
                </svg>
                Leave Requests
                {pendingLeaves.length > 0 && (
                  <span className="notif-pill">{pendingLeaves.length}</span>
                )}
              </a>
              <a href="/attendance" className="ad-qa-btn">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
                View Attendance
              </a>
              <a href="/payroll" className="ad-qa-btn">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="1" x2="12" y2="23"/>
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                </svg>
                Run Payroll
              </a>
              <a href="/company-profile" className="ad-qa-btn">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                  <polyline points="9 22 9 12 15 12 15 22"/>
                </svg>
                Company Settings
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
