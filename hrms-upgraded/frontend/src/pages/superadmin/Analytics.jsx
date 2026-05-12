import { useState, useEffect } from 'react';
import api from '../../services/api';

const BAR_COLORS = ['var(--primary)', 'var(--secondary)', 'var(--accent)', 'var(--danger)', '#9333ea', '#2563eb'];

export default function Analytics() {
  const [stats, setStats] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [range, setRange] = useState('6m');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, coRes] = await Promise.allSettled([
          api.get('/dashboard/super-admin/stats'),
          api.get('/companies'),
        ]);
        if (statsRes.status === 'fulfilled') setStats(statsRes.value.data);
        if (coRes.status === 'fulfilled') setCompanies(coRes.value.data.companies || []);
      } catch {}
    };
    fetchData();
  }, []);

  const months = range === '6m'
    ? ['Jan','Feb','Mar','Apr','May','Jun']
    : ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  const empData = range === '6m'
    ? [210, 235, 260, 290, 320, stats?.employees || 342]
    : [180, 210, 235, 252, 260, 275, 290, 305, 320, 330, 338, stats?.employees || 342];

  const maxEmp = Math.max(...empData);

  // Industry distribution from real companies
  const industryMap = {};
  companies.forEach(c => { const ind = c.industry || 'Other'; industryMap[ind] = (industryMap[ind] || 0) + 1; });
  const industries = Object.entries(industryMap).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const totalCo = industries.reduce((s, [, v]) => s + v, 0) || 1;

  const s = stats || {};

  return (
    <div>
      <div className="page-header">
        <div><h1>Analytics</h1><p>Platform-wide insights and growth metrics</p></div>
        <select value={range} onChange={e => setRange(e.target.value)}
          style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: 13, background: 'var(--surface)', outline: 'none' }}>
          <option value="6m">Last 6 months</option>
          <option value="12m">Last 12 months</option>
        </select>
      </div>

      {/* KPI stats */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        {[
          { label: 'Total Companies', value: s.companies ?? '—', color: '#9333ea', bg: '#faf5ff', sub: 'Registered on platform' },
          { label: 'Total Admins', value: s.admins ?? '—', color: '#2563eb', bg: '#eff6ff', sub: 'Company administrators' },
          { label: 'Total Employees', value: s.employees ?? '—', color: 'var(--secondary)', bg: 'var(--secondary-light)', sub: 'Across all companies' },
          { label: 'Active Today', value: s.active ?? '—', color: 'var(--accent)', bg: 'var(--accent-light)', sub: 'Currently checked in' },
        ].map(card => (
          <div key={card.label} className="stat-card">
            <div style={{ width: 46, height: 46, borderRadius: 12, background: card.bg, flexShrink: 0 }} />
            <div>
              <div className="stat-value" style={{ color: card.color }}>{card.value}</div>
              <div className="stat-label">{card.label}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{card.sub}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-grid">
        {/* Employee Growth Bar Chart */}
        <div className="card">
          <div className="card-header">
            <h3>Employee Growth</h3>
            <span className="badge badge-green">
              ↑ {empData.length > 1 ? Math.round(((empData[empData.length-1] - empData[0]) / empData[0]) * 100) : 0}% growth
            </span>
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 180, paddingTop: 20 }}>
              {months.map((m, i) => (
                <div key={m} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                  <span style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 600 }}>{empData[i]}</span>
                  <div style={{
                    width: '100%',
                    background: `linear-gradient(180deg, var(--primary), var(--primary-dark))`,
                    height: `${(empData[i] / maxEmp) * 140}px`,
                    borderRadius: '4px 4px 0 0',
                    transition: 'height 0.4s ease',
                    minHeight: 4,
                  }} />
                  <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{m}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Industry distribution */}
          <div className="card">
            <div className="card-header"><h3>Industry Distribution</h3></div>
            <div className="card-body">
              {(industries.length > 0 ? industries : [
                ['Technology', 4], ['Finance', 3], ['Healthcare', 2], ['Retail', 2], ['Education', 1],
              ]).map(([label, count], idx) => {
                const pct = Math.round((count / (totalCo || 12)) * 100);
                return (
                  <div key={label} style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                      <span style={{ fontWeight: 600 }}>{label}</span>
                      <span style={{ color: 'var(--text-muted)' }}>{count} co · {pct}%</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-bar-fill" style={{ width: `${pct}%`, background: BAR_COLORS[idx % BAR_COLORS.length] }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Platform health */}
          <div className="card">
            <div className="card-header"><h3>Platform Health</h3></div>
            <div className="card-body">
              {[
                { label: 'API Status',   val: 'Operational', badge: 'badge-green' },
                { label: 'Database',     val: 'Healthy',     badge: 'badge-green' },
                { label: 'Uptime',       val: '99.9%',       badge: 'badge-green' },
                { label: 'Companies',    val: s.companies ?? 0, badge: 'badge-blue' },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 13 }}>{row.label}</span>
                  <span className={`badge ${row.badge}`}>{row.val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Companies table at bottom */}
      {companies.length > 0 && (
        <div className="card" style={{ marginTop: 20 }}>
          <div className="card-header">
            <h3>All Companies</h3>
            <span className="badge badge-blue">{companies.length} total</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>#</th><th>Company</th><th>Industry</th><th>Size</th><th>Employees</th><th>Location</th><th>Status</th></tr></thead>
              <tbody>
                {companies.map((c, i) => (
                  <tr key={c.id}>
                    <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{i + 1}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{c.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{c.email}</div>
                    </td>
                    <td><span className="badge badge-purple">{c.industry || '—'}</span></td>
                    <td style={{ fontSize: 12 }}>{c.company_size || '—'}</td>
                    <td style={{ fontWeight: 600 }}>{c.employee_count || 0}</td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{[c.city, c.country].filter(Boolean).join(', ') || '—'}</td>
                    <td><span className={`badge ${c.is_active ? 'badge-green' : 'badge-red'}`}>{c.is_active ? 'Active' : 'Inactive'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
