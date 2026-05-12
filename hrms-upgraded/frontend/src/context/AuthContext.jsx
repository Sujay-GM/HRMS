import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { applyTheme, DEFAULT_THEME } from './ThemeContext';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  const applyUserTheme = (userObj) => {
    try {
      const raw = userObj?.company_theme;
      if (raw) {
        const theme = typeof raw === 'string' ? JSON.parse(raw) : raw;
        applyTheme({ ...DEFAULT_THEME, ...theme });
      } else {
        applyTheme(DEFAULT_THEME);
      }
    } catch {
      applyTheme(DEFAULT_THEME);
    }
  };

  useEffect(() => {
    const storedToken = localStorage.getItem('hrms_token');
    const storedUser = localStorage.getItem('hrms_user');
    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(parsedUser);
        applyUserTheme(parsedUser);
      } catch {
        localStorage.removeItem('hrms_token');
        localStorage.removeItem('hrms_user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const res = await authService.login(email, password);
    const { token: newToken, user: newUser } = res.data;
    localStorage.setItem('hrms_token', newToken);
    localStorage.setItem('hrms_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    applyUserTheme(newUser);
    return newUser;
  };

  const logout = () => {
    authService.logout();
    localStorage.removeItem('hrms_token');
    localStorage.removeItem('hrms_user');
    setToken(null);
    setUser(null);
    applyTheme(DEFAULT_THEME);
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('hrms_user', JSON.stringify(updatedUser));
    applyUserTheme(updatedUser);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, updateUser, loading, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
