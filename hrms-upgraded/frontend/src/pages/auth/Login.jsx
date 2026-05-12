import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import logo from '../../assets/logo.png';
import LandingSection from './LandingSection';

export default function Login() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const { login }               = useAuth();
  const navigate                = useNavigate();
  const formRef                 = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) { setError('Please fill in all fields.'); return; }
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (role) => {
    const demos = {
      super_admin: { email: 'superadmin@hrms.com', password: 'admin123' },
      admin:       { email: 'admin@company.com',   password: 'admin123' },
      employee:    { email: 'employee@company.com', password: 'emp123'   },
    };
    setEmail(demos[role].email);
    setPassword(demos[role].password);
    setError('');
  };

  const handleGetStarted = () => {
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => {
      formRef.current?.querySelector('input[type="email"]')?.focus();
    }, 400);
  };

  return (
    <div className="login-split-page">
      {/* LEFT: Landing / Marketing */}
      <LandingSection onGetStarted={handleGetStarted} />

      {/* RIGHT: Login Form */}
      <div className="login-split-right">
        <div className="login-card" ref={formRef}>
          {/* Logo + Brand */}
          <div className="login-logo">
            <img
              src={logo}
              alt="Gully HR Logo"
              style={{
                animation: 'logoFloat 3s ease-in-out infinite',
                cursor: 'default',
              }}
            />
            <style>{`
              @keyframes logoFloat {
                0%, 100% { transform: translateY(0px); }
                50% { transform: translateY(-6px); }
              }
            `}</style>
            <h1>Gully HR</h1>
            <p>Human Resource Management System</p>
            <div className="login-divider" />
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            {error && <div className="login-error">{error}</div>}

            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>

            <button type="submit" className="btn btn-primary login-btn" disabled={loading}>
              {loading
                ? <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Signing in...</>
                : 'Sign In →'}
            </button>
          </form>

          <div style={{ marginTop: 24, borderTop: '1px solid var(--border)', paddingTop: 18 }}>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', marginBottom: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Quick Demo Login</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-secondary btn-sm" style={{ flex: 1, justifyContent: 'center', fontSize: 11 }} onClick={() => fillDemo('super_admin')}>Super Admin</button>
              <button className="btn btn-secondary btn-sm" style={{ flex: 1, justifyContent: 'center', fontSize: 11 }} onClick={() => fillDemo('admin')}>Admin</button>
              <button className="btn btn-secondary btn-sm" style={{ flex: 1, justifyContent: 'center', fontSize: 11 }} onClick={() => fillDemo('employee')}>Employee</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
