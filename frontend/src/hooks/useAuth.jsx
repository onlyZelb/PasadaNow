import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

// ── Hardcoded admin credentials (replace with API call later) ─────────────────
const ADMIN_EMAIL    = 'admin@pasadanow.com';
const ADMIN_PASSWORD = 'admin123';

export function AuthProvider({ children }) {
  const [user, setUser]         = useState(null);
  const [isLoading, setIsLoading] = useState(true);  // true while we check storage
  const navigate = useNavigate();

  // On mount: restore session from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('adminUser');
    if (saved) {
      try { setUser(JSON.parse(saved)); } catch { /* corrupted — ignore */ }
    }
    setIsLoading(false);
  }, []);

  const login = (email, password) => {
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      const adminUser = { email, role: 'admin' };
      setUser(adminUser);
      localStorage.setItem('adminUser', JSON.stringify(adminUser));
      navigate('/admin');
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('adminUser');
    navigate('/admin/login');
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}