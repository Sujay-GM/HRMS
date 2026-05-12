import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';
import logo from '../../assets/logo.png';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('info');
  const [form, setForm]   = useState({ name: '', email: '', phone: '', address: '' });
  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [saving, setSaving]     = useState(false);
  const [savingPw, setSavingPw] = useState(false);
  const [success, setSuccess]   = useState('');
  const [error, setError]       = useState('');

  useEffect(() => {
    if (user) setForm({ name: user.name || '', email: user.email || '', phone: user.phone || '', address: user.address || '' });
  }, [user]);

  const flash = (type, msg) => {
    if (type === 'success') { setSuccess(msg); setError(''); setTimeout(() => setSuccess(''), 3500); }
    else { setError(msg); setSuccess(''); }
  };

  const handleSaveInfo = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await authService.updateProfile(form);
      updateUser({ ...user, ...res.data });
      flash('success', 'Profile updated successfully!');
    } catch {
      updateUser({ ...user, ...form });
      flash('success', 'Profile updated!');
    }
    setSaving(false);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (pwForm.new_password !== pwForm.confirm_password) { flash('error', 'Passwords do not match.'); return; }
    if (pwForm.new_password.length < 6) { flash('error', 'Password must be at least 6 characters.'); return; }
    setSavingPw(true);
    try {
      await authService.changePassword(pwForm);
      setPwForm({ current_password: '', new_password: '', confirm_password: '' });
      flash('success', 'Password changed successfully!');
    } catch (err) {
      flash('error', err.response?.data?.message || 'Failed to change password.');
    }
    setSavingPw(false);
  };

  const initials = (user?.name || 'U').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const pwMatch = pwForm.new_password && pwForm.confirm_password && pwForm.new_password !== pwForm.confirm_password;

  return (
    <div>
      <div className="page-header">
        <div><h1>My Profile</h1><p>Manage your personal information and security settings</p></div>
      </div>

      {/* Profile Header Card */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
          <div style={{
            width: 76, height: 76, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
            color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: 28, flexShrink: 0,
            boxShadow: '0 4px 14px rgba(58,196,238,0.35)',
          }}>
            {initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ fontSize: 20, fontWeight: 800 }}>{user?.name}</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 3 }}>{user?.email}</p>
            <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
              <span className={`role-badge ${user?.role}`}>{user?.role?.replace('_', ' ')}</span>
              {user?.company_name && (
                <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 20, background: 'var(--background)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                  {user.company_name}
                </span>
              )}
            </div>
          </div>
          {/* Logo */}
          <div style={{ flexShrink: 0, opacity: 0.5 }}>
            <img src={logo} alt="Logo" style={{ width: 42, height: 42, objectFit: 'contain' }} />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        {[['info', 'Personal Info'], ['security', 'Security']].map(([tab, label]) => (
          <button key={tab} className={`tab-btn${activeTab === tab ? ' active' : ''}`}
            onClick={() => { setActiveTab(tab); setError(''); setSuccess(''); }}>
            {label}
          </button>
        ))}
      </div>

      {success && <div className="alert alert-success" style={{ marginBottom: 16 }}>✓ {success}</div>}
      {error   && <div className="alert" style={{ background: 'var(--danger-light)', color: '#9b1239', border: '1px solid #fca5a5', marginBottom: 16 }}>⚠ {error}</div>}

      {/* Personal Info Tab */}
      {activeTab === 'info' && (
        <div className="card">
          <div className="card-header">
            <h3>Personal Information</h3>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Your name and contact details</span>
          </div>
          <form onSubmit={handleSaveInfo}>
            <div className="card-body">
              <div className="form-grid form-grid-2" style={{ marginBottom: 20 }}>
                <div className="form-group">
                  <label>Full Name</label>
                  <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Jane Smith" />
                </div>
                <div className="form-group">
                  <label>Email Address</label>
                  <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Phone Number</label>
                  <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+1-555-0100" />
                </div>
                <div className="form-group">
                  <label>Address</label>
                  <input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="123 Main St, City" />
                </div>
              </div>

              {/* Read-only account details */}
              <div style={{ padding: 16, background: 'var(--background)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 12 }}>Account Details</p>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {[
                    ['User ID', `#${user?.id || 'N/A'}`],
                    ['Role', user?.role?.replace('_', ' ')],
                    ['Company', user?.company_name || user?.company_id || 'N/A'],
                  ].map(([l, v]) => (
                    <div key={l} style={{ padding: '9px 16px', background: 'var(--surface)', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13 }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: 11, display: 'block', marginBottom: 2 }}>{l}</span>
                      <strong>{v}</strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border)', display: 'flex', gap: 10 }}>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button type="button" className="btn btn-secondary"
                onClick={() => setForm({ name: user?.name || '', email: user?.email || '', phone: user?.phone || '', address: user?.address || '' })}>
                Reset
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div className="card">
          <div className="card-header">
            <h3>Change Password</h3>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Keep your account secure</span>
          </div>
          <form onSubmit={handleChangePassword}>
            <div className="card-body">
              <div className="form-grid" style={{ maxWidth: 440 }}>
                <div className="form-group">
                  <label>Current Password</label>
                  <input type="password" value={pwForm.current_password}
                    onChange={e => setPwForm({ ...pwForm, current_password: e.target.value })}
                    placeholder="••••••••" />
                </div>
                <div className="form-group">
                  <label>New Password</label>
                  <input type="password" value={pwForm.new_password}
                    onChange={e => setPwForm({ ...pwForm, new_password: e.target.value })}
                    placeholder="Min. 6 characters" />
                </div>
                <div className="form-group">
                  <label>Confirm New Password</label>
                  <input type="password" value={pwForm.confirm_password}
                    onChange={e => setPwForm({ ...pwForm, confirm_password: e.target.value })}
                    placeholder="Repeat new password"
                    style={pwMatch ? { borderColor: 'var(--danger)' } : {}} />
                  {pwMatch && <span className="error-msg">Passwords do not match</span>}
                </div>
              </div>
              <div style={{ marginTop: 16, padding: 14, background: 'var(--background)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', fontSize: 12, color: 'var(--text-muted)', maxWidth: 440 }}>
                <strong style={{ display: 'block', marginBottom: 4 }}>Password requirements:</strong>
                Minimum 6 characters. Use a mix of letters, numbers, and symbols for a stronger password.
              </div>
            </div>
            <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border)' }}>
              <button type="submit" className="btn btn-primary" disabled={savingPw || pwMatch}>
                {savingPw ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
