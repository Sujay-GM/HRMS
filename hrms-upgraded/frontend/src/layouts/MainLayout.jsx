import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo.png';

const Icons = {
  dashboard: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>,
  users: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  building: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  calendar: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  money: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  profile: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  chart: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  shield: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  logout: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  globe: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
  clock: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  settings: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M4.93 4.93a10 10 0 0 0 0 14.14"/></svg>,
};

const navConfig = {
  super_admin: [
    { label: 'Overview', items: [
      { to: '/super-dashboard', label: 'Dashboard', icon: Icons.dashboard },
      { to: '/analytics', label: 'Analytics', icon: Icons.chart },
    ]},
    { label: 'Management', items: [
      { to: '/companies', label: 'Companies', icon: Icons.building },
      { to: '/admins', label: 'Admins', icon: Icons.shield },
      { to: '/global-employees', label: 'All Employees', icon: Icons.globe },
    ]},
    { label: 'Account', items: [
      { to: '/profile', label: 'My Profile', icon: Icons.profile },
    ]},
  ],
  admin: [
    { label: 'Overview', items: [
      { to: '/admin-dashboard', label: 'Dashboard', icon: Icons.dashboard },
    ]},
    { label: 'HR Management', items: [
      { to: '/employees', label: 'Employees', icon: Icons.users },
      { to: '/attendance', label: 'Attendance', icon: Icons.calendar },
      { to: '/leaves', label: 'Leave Management', icon: Icons.calendar },
      { to: '/payroll', label: 'Payroll', icon: Icons.money },
      { to: '/timesheets', label: 'Timesheets', icon: Icons.clock },
    ]},
    { label: 'Company', items: [
      { to: '/company-profile', label: 'Company Profile', icon: Icons.building },
      { to: '/profile', label: 'My Profile', icon: Icons.profile },
    ]},
  ],
  employee: [
    { label: 'Overview', items: [
      { to: '/employee-dashboard', label: 'Dashboard', icon: Icons.dashboard },
    ]},
    { label: 'My Work', items: [
      { to: '/my-attendance', label: 'Attendance', icon: Icons.clock },
      { to: '/my-leaves', label: 'Leave Requests', icon: Icons.calendar },
      { to: '/my-salary', label: 'My Salary', icon: Icons.money },
      { to: '/my-timesheet', label: 'Timesheets', icon: Icons.clock },
    ]},
    { label: 'Account', items: [
      { to: '/profile', label: 'My Profile', icon: Icons.profile },
    ]},
  ],
};

const pageNames = {
  '/dashboard': 'Dashboard',
  '/super-dashboard': 'Dashboard',
  '/admin-dashboard': 'Dashboard',
  '/employee-dashboard': 'My Dashboard',
  '/analytics': 'Analytics', '/companies': 'Companies',
  '/companies/create': 'Add Company', '/admins': 'Admin Management',
  '/global-employees': 'Global Employees', '/employees': 'Employees',
  '/employees/create': 'Add Employee', '/attendance': 'Attendance',
  '/leaves': 'Leave Management', '/payroll': 'Payroll',
  '/company-profile': 'Company Profile', '/profile': 'My Profile',
  '/my-attendance': 'My Attendance', '/my-leaves': 'Leave Requests',
  '/my-salary': 'My Salary', '/my-timesheet': 'My Timesheets',
  '/timesheets': 'Timesheet Management',
};

function SidebarLogo({ user }) {
  const companyLogo = user?.company_logo;
  const companyName = user?.company_name || 'Gully HR';

  return (
    <div className="sidebar-logo" style={{ cursor: 'default' }}>
      {companyLogo ? (
        <img src={companyLogo} alt={companyName} style={{ transition: 'transform 0.2s ease, opacity 0.2s ease' }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.08)'; e.currentTarget.style.opacity = '0.85'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.opacity = '1'; }}
        />
      ) : (
        <img src={logo} alt="Gully HR"
          style={{ transition: 'transform 0.2s ease, opacity 0.2s ease' }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.08)'; e.currentTarget.style.opacity = '0.85'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.opacity = '1'; }}
        />
      )}
      <div>
        <div className="logo-text">{companyName}</div>
        <div className="logo-sub">HR Management</div>
      </div>
    </div>
  );
}

export default function MainLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => { logout(); navigate('/login'); };

  const nav = navConfig[user?.role] || [];
  const currentPage = pageNames[location.pathname] ||
    (location.pathname.includes('/edit') ? 'Edit' :
     location.pathname.includes('/create') ? 'Create' : 'HRMS');
  const initials = user?.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U';

  return (
    <div className="layout">
      <aside className="sidebar">
        <SidebarLogo user={user} />
        {nav.map((section) => (
          <div key={section.label} className="sidebar-section">
            <div className="sidebar-section-title">{section.label}</div>
            {section.items.map((item) => (
              <NavLink key={item.to} to={item.to} className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>
                {item.icon}{item.label}
              </NavLink>
            ))}
          </div>
        ))}
        <div className="sidebar-bottom">
          <button className="sidebar-link" onClick={handleLogout}>
            {Icons.logout} Sign Out
          </button>
        </div>
      </aside>

      <div className="main-content">
        <header className="topbar">
          <div className="topbar-left">
            <h2>{currentPage}</h2>
            <p>Welcome back, {user?.name}</p>
          </div>
          <div className="topbar-right">
            <span className={`role-badge ${user?.role}`}>{user?.role?.replace('_', ' ')}</span>
            <div className="user-badge">
              <div className="avatar">{initials}</div>
              <div className="user-info">
                <div className="name">{user?.name}</div>
                <div className="role">{user?.email}</div>
              </div>
            </div>
          </div>
        </header>
        <main className="page-content"><Outlet /></main>
      </div>
    </div>
  );
}
