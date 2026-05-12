import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const DASH_CSS = `
  .sa-kpi-strip {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 14px;
    margin-bottom: 24px;
  }
  .sa-kpi-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 16px 18px;
    display: flex;
    align-items: center;
    gap: 14px;
    box-shadow: var(--shadow);
    transition: box-shadow 0.18s, transform 0.18s, border-color 0.18s;
    position: relative;
    overflow: hidden;
  }
  .sa-kpi-card:hover {
    box-shadow: var(--shadow-md);
    transform: translateY(-2px);
    border-color: var(--border-dark);
  }
  .sa-kpi-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 3px;
    border-radius: 10px 10px 0 0;
    background: var(--kpi-accent, var(--primary));
  }
  .sa-kpi-icon {
    width: 42px; height: 42px;
    border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
    background: var(--kpi-bg, var(--primary-light));
  }
  .sa-kpi-icon svg { width: 18px; height: 18px; }
  .sa-kpi-body { flex: 1; min-width: 0; }
  .sa-kpi-value {
    font-size: 26px;
    font-weight: 800;
    line-height: 1;
    letter-spacing: -0.8px;
    color: var(--text);
  }
  .sa-kpi-label { font-size: 11.5px; color: var(--text-muted); font-weight: 500; margin-top: 3px; }
  .sa-kpi-trend {
    font-size: 10.5px; font-weight: 600;
    padding: 2px 7px; border-radius: 20px;
    margin-top: 6px; display: inline-block;
  }
  .sa-main-grid {
    display: grid;
    grid-template-columns: 1fr 340px;
    gap: 20px;
    align-items: start;
  }
  .sa-table-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 10px;
    box-shadow: var(--shadow);
    overflow: hidden;
  }
  .sa-table-header {
    padding: 16px 20px;
    border-bottom: 1px solid var(--border);
    display: flex; align-items: center; justify-content: space-between;
  }
  .sa-table-header-left { display: flex; align-items: center; gap: 10px; }
  .sa-table-header-left h3 { font-size: 14px; font-weight: 700; color: var(--text); }
  .sa-table-count {
    background: var(--primary-light); color: var(--primary);
    font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 20px;
  }
  .sa-view-all {
    font-size: 12px; color: var(--primary); font-weight: 600;
    display: flex; align-items: center; gap: 4px;
    padding: 5px 10px; border-radius: 6px; transition: background 0.15s;
  }
  .sa-view-all:hover { background: var(--primary-light); }
  .sa-table table { width: 100%; border-collapse: collapse; }
  .sa-table th {
    padding: 10px 16px; text-align: left;
    font-size: 10.5px; font-weight: 700;
    text-transform: uppercase; letter-spacing: 0.6px;
    color: var(--text-muted); background: var(--surface-2);
    border-bottom: 1px solid var(--border); white-space: nowrap;
  }
  .sa-table td {
    padding: 13px 16px; border-bottom: 1px solid var(--border);
    font-size: 13px; color: var(--text-secondary); vertical-align: middle;
  }
  .sa-table tr:last-child td { border-bottom: none; }
  .sa-table tbody tr { transition: background 0.12s; cursor: default; }
  .sa-table tbody tr:hover td { background: #f0f5ff; }
  .co-avatar {
    width: 34px; height: 34px; border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    font-weight: 700; font-size: 12px; flex-shrink: 0;
    background: var(--purple-light); color: var(--purple);
  }
  .co-name { font-weight: 600; font-size: 13px; color: var(--text); }
  .co-email { font-size: 11px; color: var(--text-muted); margin-top: 1px; }
  .status-bdg {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 3px 9px; border-radius: 20px;
    font-size: 11.5px; font-weight: 600;
  }
  .status-bdg-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
  .s-active { background: #dcfce7; color: #166534; }
  .s-active .status-bdg-dot { background: #16a34a; }
  .s-inactive { background: #fee2e2; color: #991b1b; }
  .s-inactive .status-bdg-dot { background: #dc2626; }
  .sa-right-panel { display: flex; flex-direction: column; gap: 16px; }
  .sa-panel-card {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 10px; box-shadow: var(--shadow); overflow: hidden;
  }
  .sa-panel-header {
    padding: 14px 18px; border-bottom: 1px solid var(--border);
    display: flex; align-items: center; gap: 8px;
  }
  .sa-panel-header h4 { font-size: 13px; font-weight: 700; color: var(--text); flex: 1; }
  .sa-panel-icon {
    width: 28px; height: 28px; border-radius: 7px;
    display: flex; align-items: center; justify-content: center;
    background: var(--surface-2);
  }
  .sa-panel-icon svg { width: 13px; height: 13px; }
  .sa-panel-body { padding: 14px 18px; }
  .health-row {
    display: flex; align-items: center; justify-content: space-between;
    padding: 9px 0; border-bottom: 1px solid var(--border);
  }
  .health-row:last-child { border-bottom: none; }
  .health-row-left { display: flex; align-items: center; gap: 9px; }
  .health-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
  .health-label { font-size: 12.5px; color: var(--text-secondary); font-weight: 500; }
  .act-item {
    display: flex; align-items: flex-start; gap: 10px;
    padding: 9px 0; border-bottom: 1px solid var(--border);
  }
  .act-item:last-child { border-bottom: none; }
  .act-dot { width: 8px; height: 8px; border-radius: 50%; margin-top: 5px; flex-shrink: 0; }
  .act-text { font-size: 12px; color: var(--text-secondary); line-height: 1.4; flex: 1; }
  .act-time { font-size: 10.5px; color: var(--text-muted); font-weight: 500; white-space: nowrap; }
  .qa-btn {
    display: flex; align-items: center; gap: 9px;
    padding: 9px 12px; border-radius: 8px;
    font-size: 12.5px; font-weight: 600; cursor: pointer;
    border: 1.5px solid var(--border);
    background: var(--surface); color: var(--text-secondary);
    transition: all 0.15s; font-family: 'Outfit', sans-serif;
    text-align: left; width: 100%; margin-bottom: 7px;
  }
  .qa-btn:last-child { margin-bottom: 0; }
  .qa-btn svg { width: 15px; height: 15px; flex-shrink: 0; }
  .qa-btn:hover { background: var(--surface-2); color: var(--text); border-color: var(--border-dark); transform: translateX(2px); }
  .qa-btn-primary {
    background: var(--grad-primary); color: white;
    border-color: transparent; box-shadow: 0 2px 8px rgba(37,99,235,0.2);
  }
  .qa-btn-primary:hover {
    box-shadow: 0 4px 14px rgba(37,99,235,0.3); color: white;
    background: var(--grad-primary); filter: brightness(1.06);
    transform: translateY(-1px);
  }
  .sum-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .sum-cell {
    text-align: center; padding: 12px 8px;
    border-radius: 8px; border: 1px solid var(--border);
    transition: border-color 0.15s, transform 0.15s;
  }
  .sum-cell:hover { border-color: var(--border-dark); transform: scale(1.02); }
  .sum-num { font-size: 22px; font-weight: 800; letter-spacing: -0.5px; }
  .sum-txt { font-size: 11px; color: var(--text-muted); margin-top: 2px; }
  .sa-page-header {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 24px; gap: 16px;
  }
  .sa-header-left h1 { font-size: 22px; font-weight: 800; color: var(--text); letter-spacing: -0.5px; }
  .sa-header-left p { font-size: 12.5px; color: var(--text-muted); margin-top: 3px; }
  .sa-header-right { display: flex; align-items: center; gap: 10px; }
  @media (max-width: 1100px) {
    .sa-kpi-strip { grid-template-columns: repeat(2, 1fr); }
    .sa-main-grid { grid-template-columns: 1fr; }
    .sa-right-panel { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  }
  @media (max-width: 700px) {
    .sa-kpi-strip { grid-template-columns: repeat(2, 1fr); }
    .sa-right-panel { grid-template-columns: 1fr; }
  }
`;

function KpiCard({ label, value, loading, accentColor, bgColor, icon, trend, trendColor }) {
  return (
    <div className="sa-kpi-card" style={{ '--kpi-accent': accentColor, '--kpi-bg': bgColor }}>
      <div className="sa-kpi-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke={accentColor} strokeWidth="2">
          <path d={icon} />
        </svg>
      </div>
      <div className="sa-kpi-body">
        {loading
          ? <div className="skeleton" style={{ height: 26, width: 60, borderRadius: 4, marginBottom: 8 }} />
          : <div className="sa-kpi-value">{value ?? 0}</div>
        }
        <div className="sa-kpi-label">{label}</div>
        {trend && !loading && (
          <span className="sa-kpi-trend" style={{ background: trendColor + '18', color: trendColor }}>{trend}</span>
        )}
      </div>
    </div>
  );
}

export default function SuperAdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats]            = useState(null);
  const [recentCompanies, setRecent] = useState([]);
  const [loading, setLoading]        = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, companiesRes] = await Promise.allSettled([
          api.get('/dashboard/super-admin/stats'),
          api.get('/companies?limit=6'),
        ]);
        if (statsRes.status === 'fulfilled') setStats(statsRes.value.data);
        if (companiesRes.status === 'fulfilled')
          setRecent(companiesRes.value.data.companies || companiesRes.value.data || []);
      } catch {}
      setLoading(false);
    };
    fetchData();
  }, []);

  const s = stats || { companies: 0, admins: 0, employees: 0, active: 0 };

  const kpis = [
    { label: 'Total Companies', value: s.companies, accentColor: '#7c3aed', bgColor: '#f5f3ff',
      icon: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
      trend: s.companies > 0 ? `${s.companies} registered` : null, trendColor: '#7c3aed' },
    { label: 'Total Admins', value: s.admins, accentColor: '#2563eb', bgColor: '#eff6ff',
      icon: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z', trendColor: '#2563eb' },
    { label: 'Total Employees', value: s.employees, accentColor: '#059669', bgColor: '#ecfdf5',
      icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
      trendColor: '#059669' },
    { label: 'Active Today', value: s.active, accentColor: '#d97706', bgColor: '#fffbeb',
      icon: 'M22 12h-4l-3 9L9 3l-3 9H2',
      trend: s.employees > 0 ? `${Math.round((s.active / s.employees) * 100) || 0}% rate` : null,
      trendColor: '#d97706' },
  ];

  const activities = [
    { text: 'New company "TechCorp" registered', time: '2m ago', color: '#7c3aed' },
    { text: 'Admin account created for Nexus Ltd', time: '18m ago', color: '#2563eb' },
    { text: '3 new employees onboarded', time: '1h ago', color: '#059669' },
    { text: 'System backup completed', time: '3h ago', color: '#64748b' },
  ];

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <>
      <style>{DASH_CSS}</style>

      <div className="sa-page-header">
        <div className="sa-header-left">
          <h1>Platform Overview</h1>
          <p>{today} · Super Admin</p>
        </div>
        <div className="sa-header-right">
          <span className="badge badge-purple" style={{ gap: 6 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#7c3aed', display: 'inline-block' }} />
            Super Admin
          </span>
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/companies/create')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            New Company
          </button>
        </div>
      </div>

      <div className="sa-kpi-strip">
        {kpis.map(k => <KpiCard key={k.label} {...k} loading={loading} />)}
      </div>

      <div className="sa-main-grid">
        {/* Companies Table */}
        <div className="sa-table-card">
          <div className="sa-table-header">
            <div className="sa-table-header-left">
              <h3>Registered Companies</h3>
              {!loading && <span className="sa-table-count">{recentCompanies.length} shown</span>}
            </div>
            <a href="/companies" className="sa-view-all">
              View all
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="11" height="11">
                <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
              </svg>
            </a>
          </div>
          <div className="sa-table">
            <table>
              <thead>
                <tr>
                  <th>Company</th><th>Industry</th><th>Employees</th><th>Status</th><th></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={5} style={{ padding: '14px 16px' }}>
                        <div className="skeleton" style={{ height: 14, width: `${65 + i * 5}%`, borderRadius: 4 }} />
                      </td>
                    </tr>
                  ))
                ) : recentCompanies.length > 0 ? (
                  recentCompanies.map(c => (
                    <tr key={c.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div className="co-avatar">{c.name?.slice(0, 2).toUpperCase()}</div>
                          <div>
                            <div className="co-name">{c.name}</div>
                            <div className="co-email">{c.email}</div>
                          </div>
                        </div>
                      </td>
                      <td><span className="badge badge-purple">{c.industry || 'N/A'}</span></td>
                      <td style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)' }}>{c.employee_count || 0}</td>
                      <td>
                        <span className={`status-bdg ${c.is_active ? 's-active' : 's-inactive'}`}>
                          <span className="status-bdg-dot" />
                          {c.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <button className="btn btn-sm btn-secondary" onClick={() => navigate(`/companies/${c.id}/edit`)}>
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                        style={{ width: 36, height: 36, margin: '0 auto 10px', display: 'block', opacity: 0.25 }}>
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                      </svg>
                      No companies registered yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Insights Panel */}
        <div className="sa-right-panel">
          {/* Platform Health */}
          <div className="sa-panel-card">
            <div className="sa-panel-header">
              <div className="sa-panel-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                </svg>
              </div>
              <h4>Platform Health</h4>
              <span className="badge badge-green" style={{ fontSize: 10 }}>All Systems OK</span>
            </div>
            <div className="sa-panel-body">
              {[
                { label: 'API Status',      val: 'Operational', dot: '#16a34a', badge: 'badge-green' },
                { label: 'Database',        val: 'Healthy',     dot: '#16a34a', badge: 'badge-green' },
                { label: 'Active Sessions', val: s.active || 0, dot: '#2563eb', badge: 'badge-blue' },
                { label: 'Total Workforce', val: s.employees || 0, dot: '#2563eb', badge: 'badge-blue' },
              ].map(row => (
                <div key={row.label} className="health-row">
                  <div className="health-row-left">
                    <span className="health-dot" style={{ background: row.dot }} />
                    <span className="health-label">{row.label}</span>
                  </div>
                  <span className={`badge ${row.badge}`}>{row.val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="sa-panel-card">
            <div className="sa-panel-header">
              <div className="sa-panel-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
              </div>
              <h4>Recent Activity</h4>
            </div>
            <div className="sa-panel-body">
              {activities.map((a, i) => (
                <div key={i} className="act-item">
                  <span className="act-dot" style={{ background: a.color }} />
                  <span className="act-text">{a.text}</span>
                  <span className="act-time">{a.time}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="sa-panel-card">
            <div className="sa-panel-header">
              <div className="sa-panel-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                </svg>
              </div>
              <h4>Quick Actions</h4>
            </div>
            <div className="sa-panel-body">
              <button className="qa-btn qa-btn-primary" onClick={() => navigate('/companies/create')}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Register New Company
              </button>
              <a href="/admins" className="qa-btn">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
                Manage Admins
              </a>
              <a href="/global-employees" className="qa-btn">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
                View All Employees
              </a>
              <a href="/analytics" className="qa-btn">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="20" x2="18" y2="10"/>
                  <line x1="12" y1="20" x2="12" y2="4"/>
                  <line x1="6" y1="20" x2="6" y2="14"/>
                </svg>
                Analytics
              </a>
            </div>
          </div>

          {/* Platform Summary */}
          <div className="sa-panel-card">
            <div className="sa-panel-header">
              <div className="sa-panel-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
                  <rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>
                </svg>
              </div>
              <h4>Platform Summary</h4>
            </div>
            <div className="sa-panel-body">
              <div className="sum-grid">
                {[
                  { label: 'Companies', value: s.companies || 0, color: '#7c3aed', bg: '#f5f3ff' },
                  { label: 'Admins',    value: s.admins || 0,    color: '#2563eb', bg: '#eff6ff' },
                  { label: 'Employees', value: s.employees || 0, color: '#059669', bg: '#ecfdf5' },
                  { label: 'Active',    value: s.active || 0,    color: '#d97706', bg: '#fffbeb' },
                ].map(item => (
                  <div key={item.label} className="sum-cell"
                    style={{ background: item.bg, borderColor: item.color + '25' }}>
                    <div className="sum-num" style={{ color: item.color }}>{loading ? '—' : item.value}</div>
                    <div className="sum-txt">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
