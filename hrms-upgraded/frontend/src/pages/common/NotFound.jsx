import { useNavigate } from 'react-router-dom';
import logo from '../../assets/logo.png';

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1a2f4e 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20, flexDirection: 'column', gap: 24, textAlign: 'center',
    }}>
      <img src={logo} alt="Gully HR" style={{ width: 56, height: 56, objectFit: 'contain', borderRadius: 14, opacity: 0.8 }} />
      <div>
        <div style={{ fontSize: 96, fontWeight: 900, color: 'var(--primary)', lineHeight: 1, letterSpacing: -4 }}>404</div>
        <h1 style={{ color: 'white', fontSize: 24, fontWeight: 700, marginTop: 8 }}>Page Not Found</h1>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, marginTop: 8, maxWidth: 320, margin: '12px auto 0' }}>
          The page you're looking for doesn't exist or has been moved.
        </p>
      </div>
      <div style={{ display: 'flex', gap: 12 }}>
        <button className="btn btn-primary" onClick={() => navigate(-1)}>← Go Back</button>
        <button className="btn btn-secondary" style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)' }}
          onClick={() => navigate('/dashboard')}>
          Go to Dashboard
        </button>
      </div>
    </div>
  );
}
