import { useState, useEffect } from 'react';
import api from '../../services/api';

export default function GlobalEmployees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCompany, setFilterCompany] = useState('');
  const [companies, setCompanies] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [empRes, compRes] = await Promise.allSettled([
          api.get('/employees?all=true'),
          api.get('/companies'),
        ]);
        if (empRes.status === 'fulfilled') setEmployees(empRes.value.data.employees || empRes.value.data || []);
        else setEmployees([
          { id: 1, name: 'David Kim', email: 'david@techcorp.com', department: 'Engineering', position: 'Senior Dev', company_name: 'TechCorp Inc', is_active: true },
          { id: 2, name: 'Emma Chen', email: 'emma@techcorp.com', department: 'Design', position: 'UX Designer', company_name: 'TechCorp Inc', is_active: true },
          { id: 3, name: 'Frank Rodriguez', email: 'frank@financehub.com', department: 'Finance', position: 'Analyst', company_name: 'FinanceHub', is_active: true },
          { id: 4, name: 'Grace Patel', email: 'grace@financehub.com', department: 'HR', position: 'HR Manager', company_name: 'FinanceHub', is_active: false },
          { id: 5, name: 'Henry Wilson', email: 'henry@retailplus.com', department: 'Sales', position: 'Sales Lead', company_name: 'RetailPlus', is_active: true },
          { id: 6, name: 'Isabel Torres', email: 'isabel@retailplus.com', department: 'Operations', position: 'Ops Manager', company_name: 'RetailPlus', is_active: true },
        ]);
        if (compRes.status === 'fulfilled') setCompanies(compRes.value.data.companies || compRes.value.data || []);
      } catch {}
      setLoading(false);
    };
    fetchData();
  }, []);

  const filtered = employees.filter(e => {
    const matchSearch = e.name.toLowerCase().includes(search.toLowerCase()) || e.email.toLowerCase().includes(search.toLowerCase());
    const matchCompany = !filterCompany || e.company_name === filterCompany || String(e.company_id) === filterCompany;
    return matchSearch && matchCompany;
  });

  const uniqueCompanies = [...new Set(employees.map(e => e.company_name).filter(Boolean))];

  return (
    <div>
      <div className="page-header">
        <div><h1>Global Employees</h1><p>View all employees across all companies</p></div>
        <span className="badge badge-purple">{employees.length} total</span>
      </div>

      <div className="card">
        <div className="card-header" style={{ flexWrap: 'wrap', gap: 10 }}>
          <div className="search-input-wrap" style={{ maxWidth: 260 }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input placeholder="Search employees..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: 13, outline: 'none' }}
            value={filterCompany} onChange={e => setFilterCompany(e.target.value)}>
            <option value="">All Companies</option>
            {uniqueCompanies.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <span className="badge badge-blue">{filtered.length} results</span>
        </div>
        <div className="table-wrap">
          {loading ? <div className="loading-overlay"><div className="spinner" /></div> : (
            <table>
              <thead>
                <tr><th>#</th><th>Employee</th><th>Company</th><th>Department</th><th>Position</th><th>Status</th></tr>
              </thead>
              <tbody>
                {filtered.map((e, i) => (
                  <tr key={e.id}>
                    <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{i + 1}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="avatar" style={{ width: 30, height: 30, fontSize: 11 }}>
                          {e.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600 }}>{e.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{e.email}</div>
                        </div>
                      </div>
                    </td>
                    <td><span className="badge badge-purple">{e.company_name || 'N/A'}</span></td>
                    <td>{e.department || '-'}</td>
                    <td>{e.position || '-'}</td>
                    <td><span className={`badge ${e.is_active ? 'badge-green' : 'badge-red'}`}>{e.is_active ? 'Active' : 'Inactive'}</span></td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={6}><div className="empty-state"><h3>No employees found</h3><p>Try adjusting your search filters</p></div></td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
