import { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { companyService } from '../../services/companyService';

const initialForm = { name: '', email: '', password: '', phone: '', company_id: '' };

export default function Admins() {
  const [admins, setAdmins] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [adminsRes, companiesRes] = await Promise.allSettled([
        adminService.getAll(),
        companyService.getAll(),
      ]);
      if (adminsRes.status === 'fulfilled') setAdmins(adminsRes.value.data.admins || adminsRes.value.data || []);
      else setAdmins([
        { id: 1, name: 'Alice Johnson', email: 'alice@techcorp.com', phone: '+1-555-0201', company_name: 'TechCorp Inc', is_active: true },
        { id: 2, name: 'Bob Martinez', email: 'bob@financehub.com', phone: '+1-555-0202', company_name: 'FinanceHub', is_active: true },
        { id: 3, name: 'Carol White', email: 'carol@retailplus.com', phone: '+1-555-0203', company_name: 'RetailPlus', is_active: false },
      ]);
      if (companiesRes.status === 'fulfilled') setCompanies(companiesRes.value.data.companies || companiesRes.value.data || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const openCreate = () => { setEditing(null); setForm(initialForm); setError(''); setModal(true); };
  const openEdit = (a) => {
    setEditing(a);
    setForm({ name: a.name, email: a.email, password: '', phone: a.phone || '', company_id: a.company_id || '' });
    setError(''); setModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email) { setError('Name and email are required.'); return; }
    if (!editing && !form.password) { setError('Password is required for new admin.'); return; }
    setSubmitting(true);
    try {
      const payload = { ...form };
      if (editing && !payload.password) delete payload.password;
      if (editing) await adminService.update(editing.id, payload);
      else await adminService.create(payload);
      setModal(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Operation failed.');
    }
    setSubmitting(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this admin?')) return;
    try { await adminService.delete(id); fetchData(); } catch {}
  };

  const filtered = admins.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="page-header">
        <div><h1>Admin Management</h1><p>Manage company administrators</p></div>
        <button className="btn btn-primary" onClick={openCreate}>+ Add Admin</button>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="search-input-wrap" style={{ maxWidth: 280 }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input placeholder="Search admins..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <span className="badge badge-blue">{filtered.length} admins</span>
        </div>
        <div className="table-wrap">
          {loading ? <div className="loading-overlay"><div className="spinner" /></div> : (
            <table>
              <thead><tr><th>#</th><th>Name</th><th>Email</th><th>Phone</th><th>Company</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {filtered.map((a, i) => (
                  <tr key={a.id}>
                    <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{i + 1}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="avatar" style={{ width: 28, height: 28, fontSize: 11 }}>
                          {a.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <strong>{a.name}</strong>
                      </div>
                    </td>
                    <td>{a.email}</td>
                    <td>{a.phone || '-'}</td>
                    <td><span className="badge badge-blue">{a.company_name || 'N/A'}</span></td>
                    <td><span className={`badge ${a.is_active ? 'badge-green' : 'badge-red'}`}>{a.is_active ? 'Active' : 'Inactive'}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => openEdit(a)}>Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(a.id)}>Del</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h3>{editing ? 'Edit Admin' : 'Create Admin'}</h3>
              <button className="close-btn" onClick={() => setModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {error && <div className="alert" style={{ background: '#fef2f2', color: '#dc2626', borderColor: '#fecaca', border: '1px solid' }}>{error}</div>}
                <div className="form-grid form-grid-2">
                  <div className="form-group">
                    <label>Full Name *</label>
                    <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="John Doe" />
                  </div>
                  <div className="form-group">
                    <label>Email *</label>
                    <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="admin@company.com" />
                  </div>
                  <div className="form-group">
                    <label>Password {editing ? '(leave blank to keep)' : '*'}</label>
                    <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="••••••••" />
                  </div>
                  <div className="form-group">
                    <label>Phone</label>
                    <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+1-555-0100" />
                  </div>
                  <div className="form-group" style={{ gridColumn: '1/-1' }}>
                    <label>Assign to Company</label>
                    <select value={form.company_id} onChange={e => setForm({ ...form, company_id: e.target.value })}>
                      <option value="">Select Company</option>
                      {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Saving...' : (editing ? 'Update' : 'Create')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
