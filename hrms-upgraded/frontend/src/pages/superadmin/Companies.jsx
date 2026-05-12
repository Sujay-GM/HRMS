import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { companyService } from '../../services/companyService';
import toast from 'react-hot-toast';

export default function Companies() {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const res = await companyService.getAll();
      setCompanies(res.data.companies || []);
    } catch { setCompanies([]); }
    setLoading(false);
  };

  useEffect(() => { fetchCompanies(); }, []);

  const handleDelete = async (id) => {
    if (!confirm('Delete this company? All associated data will be removed.')) return;
    try { await companyService.delete(id); toast.success('Company deleted'); fetchCompanies(); }
    catch { toast.error('Failed to delete company'); }
  };

  const filtered = companies.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.industry || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Companies</h1>
          <p>Manage all registered companies on the platform</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/companies/create')}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add Company
        </button>
      </div>

      <div className="card">
        <div className="card-header" style={{ flexWrap: 'wrap', gap: 10 }}>
          <div className="search-input-wrap" style={{ maxWidth: 300 }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input placeholder="Search companies..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <span className="badge badge-blue">{filtered.length} {filtered.length === 1 ? 'company' : 'companies'}</span>
        </div>
        <div className="table-wrap">
          {loading ? (
            <div className="loading-overlay"><div className="spinner" /></div>
          ) : (
            <table>
              <thead>
                <tr><th>#</th><th>Company</th><th>Industry</th><th>Size</th><th>Location</th><th>Employees</th><th>Theme</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {filtered.map((c, i) => {
                  let themeColors = null;
                  try { themeColors = c.theme ? (typeof c.theme === 'string' ? JSON.parse(c.theme) : c.theme) : null; } catch {}
                  return (
                    <tr key={c.id}>
                      <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{i + 1}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 36, height: 36, borderRadius: 10, background: themeColors?.primary ? `${themeColors.primary}22` : 'var(--primary-light)', color: themeColors?.primary || 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
                            {c.name?.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 13 }}>{c.name}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{c.email}</div>
                          </div>
                        </div>
                      </td>
                      <td><span className="badge badge-purple">{c.industry || '—'}</span></td>
                      <td style={{ fontSize: 13 }}>{c.company_size ? `${c.company_size}` : '—'}</td>
                      <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {[c.city, c.country].filter(Boolean).join(', ') || '—'}
                      </td>
                      <td style={{ fontWeight: 600 }}>{c.employee_count || 0}</td>
                      <td>
                        {themeColors ? (
                          <div style={{ display: 'flex', gap: 3 }}>
                            {[themeColors.primary, themeColors.secondary, themeColors.accent, themeColors.danger].map((col, idx) => (
                              col ? <div key={idx} style={{ width: 14, height: 14, borderRadius: 3, background: col, flexShrink: 0 }} /> : null
                            ))}
                          </div>
                        ) : (
                          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Default</span>
                        )}
                      </td>
                      <td><span className={`badge ${c.is_active ? 'badge-green' : 'badge-red'}`}>{c.is_active ? 'Active' : 'Inactive'}</span></td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/companies/${c.id}/edit`)}>Edit</button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleDelete(c.id)}>Del</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr><td colSpan={9}>
                    <div className="empty-state">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                      <h3>No companies found</h3>
                      <p style={{ marginTop: 6, fontSize: 13 }}>Add your first company to get started</p>
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
