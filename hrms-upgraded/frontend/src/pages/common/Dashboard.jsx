import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    if (user.role === 'super_admin') navigate('/super-dashboard', { replace: true });
    else if (user.role === 'admin') navigate('/admin-dashboard', { replace: true });
    else navigate('/employee-dashboard', { replace: true });
  }, [user, navigate]);

  return <div className="loading-overlay"><div className="spinner" /></div>;
}
