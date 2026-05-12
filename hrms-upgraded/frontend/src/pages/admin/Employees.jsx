import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { employeeService } from '../../services/employeeService';
import toast from 'react-hot-toast';
import { formatCurrency } from '../../utils/currency';

const DEPARTMENTS = ['Engineering','Design','Marketing','Sales','HR','Finance','Operations','Support','Management'];

export default function Employees() {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewModal, setViewModal] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('');

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const res = await employeeService.getAll();
      setEmployees(res.data.employees || []);
    } catch {
      setEmployees([]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchEmployees(); }, []);

  const openView = async (emp) => {
    try {
      const res = await employeeService.getById(emp.id);
      setSelectedEmp(res.data);
    } catch {
      setSelectedEmp(emp);
    }
    setViewModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this employee? This action cannot be undone.')) return;
    try { await employeeService.delete(id); toast.success('Employee deleted'); fetchEmployees(); }
    catch { toast.error('Failed to delete employee'); }
  };

  const filtered = employees.filter(e => {
    const matchSearch = e.name?.toLowerCase().includes(search.toLowerCase()) || e.email?.toLowerCase().includes(search.toLowerCase());
    const matchDept = !filterDept || e.department === filterDept;
    return matchSearch && matchDept;
  });

  const empTypeLabel = { full_time: 'Full-Time', part_time: 'Part-Time', contract: 'Contract' };

  return (
    <div>
      <div className="page-header">
        <div><h1>Employees</h1><p>Manage your company's workforce</p></div>
        <button className="btn btn-primary" onClick={() => navigate('/employees/create')}>+ Add Employee</button>
      </div>

      <div className="card">
        <div className="card-header" style={{ flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', gap: 10, flex: 1 }}>
            <div className="search-input-wrap" style={{ maxWidth: 280 }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input placeholder="Search employees..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: 13 }}
              value={filterDept} onChange={e => setFilterDept(e.target.value)}>
              <option value="">All Departments</option>
              {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <span className="badge badge-blue">{filtered.length} employees</span>
        </div>
        <div className="table-wrap">
          {loading ? <div className="loading-overlay"><div className="spinner" /></div> : (
            <table>
              <thead><tr><th>#</th><th>Employee</th><th>Department</th><th>Position</th><th>Type</th><th>Joined</th><th>Salary</th><th>Status</th><th>Actions</th></tr></thead>
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
                    <td><span className="badge badge-blue">{e.department || 'N/A'}</span></td>
                    <td>{e.position || '-'}</td>
                    <td><span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{empTypeLabel[e.employment_type] || '-'}</span></td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{e.date_of_joining ? new Date(e.date_of_joining).toLocaleDateString() : '-'}</td>
                    <td style={{ fontWeight: 600, color: 'var(--success)' }}>
                      {e.salary ? formatCurrency(e.salary, e.currency || 'INR') : '-'}
                    </td>
                    <td><span className={`badge ${e.is_active ? 'badge-green' : 'badge-red'}`}>{e.is_active ? 'Active' : 'Inactive'}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => openView(e)}>View</button>
                        <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/employees/${e.id}/edit`)}>Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(e.id)}>Del</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={9}><div className="empty-state"><h3>No employees found</h3><p>Add your first employee or adjust search filters</p></div></td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* View Modal */}
      {viewModal && selectedEmp && (
        <div className="modal-overlay" onClick={ev => ev.target === ev.currentTarget && setViewModal(false)}>
          <div className="modal" style={{ maxWidth: 700 }}>
            <div className="modal-header">
              <h3>Employee Details</h3>
              <button className="close-btn" onClick={() => setViewModal(false)}>✕</button>
            </div>
            <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                <div className="avatar" style={{ width: 56, height: 56, fontSize: 20 }}>
                  {selectedEmp.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 700 }}>{selectedEmp.name}</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>{selectedEmp.position} · {selectedEmp.department}</p>
                  <span className={`badge ${selectedEmp.is_active ? 'badge-green' : 'badge-red'}`} style={{ marginTop: 4, display: 'inline-block' }}>
                    {selectedEmp.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>Personal Info</div>
                <div className="form-grid form-grid-2" style={{ gap: 8 }}>
                  {[
                    ['Email', selectedEmp.email],
                    ['Phone', selectedEmp.phone || '-'],
                    ['Gender', selectedEmp.gender || '-'],
                    ['Date of Birth', selectedEmp.date_of_birth ? new Date(selectedEmp.date_of_birth).toLocaleDateString() : '-'],
                  ].map(([label, val]) => (
                    <div key={label} style={{ padding: '10px 14px', background: 'var(--background)', borderRadius: 'var(--radius)' }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 2 }}>{label}</div>
                      <div style={{ fontSize: 13.5, fontWeight: 500 }}>{val}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>Job Details</div>
                <div className="form-grid form-grid-2" style={{ gap: 8 }}>
                  {[
                    ['Department', selectedEmp.department || '-'],
                    ['Position', selectedEmp.position || '-'],
                    ['Employment Type', empTypeLabel[selectedEmp.employment_type] || '-'],
                    ['Work Location', selectedEmp.work_location || '-'],
                    ['Date of Joining', selectedEmp.date_of_joining ? new Date(selectedEmp.date_of_joining).toLocaleDateString() : '-'],
                    ['Salary', selectedEmp.salary ? `${formatCurrency(selectedEmp.salary, selectedEmp.currency || 'INR')} / ${selectedEmp.salary_type}` : '-'],
                  ].map(([label, val]) => (
                    <div key={label} style={{ padding: '10px 14px', background: 'var(--background)', borderRadius: 'var(--radius)' }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 2 }}>{label}</div>
                      <div style={{ fontSize: 13.5, fontWeight: 500 }}>{val}</div>
                    </div>
                  ))}
                </div>
              </div>

              {selectedEmp.emergency_contact && (
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>Emergency Contact</div>
                  <div className="form-grid form-grid-2" style={{ gap: 8 }}>
                    {[
                      ['Name', selectedEmp.emergency_contact.contact_name],
                      ['Relationship', selectedEmp.emergency_contact.relationship || '-'],
                      ['Phone', selectedEmp.emergency_contact.phone || '-'],
                      ['Alt. Phone', selectedEmp.emergency_contact.alternate_phone || '-'],
                    ].map(([label, val]) => (
                      <div key={label} style={{ padding: '10px 14px', background: 'var(--background)', borderRadius: 'var(--radius)' }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 2 }}>{label}</div>
                        <div style={{ fontSize: 13.5, fontWeight: 500 }}>{val}</div>
                      </div>
                    ))}
                    {selectedEmp.emergency_contact.address && (
                      <div style={{ gridColumn: 'span 2', padding: '10px 14px', background: 'var(--background)', borderRadius: 'var(--radius)' }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 2 }}>Address</div>
                        <div style={{ fontSize: 13.5, fontWeight: 500 }}>{selectedEmp.emergency_contact.address}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setViewModal(false)}>Close</button>
              <button className="btn btn-primary" onClick={() => { setViewModal(false); navigate(`/employees/${selectedEmp.id}/edit`); }}>Edit</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
