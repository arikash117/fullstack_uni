import { useState, useEffect, useContext, createContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContextType, AuthUser } from '../types/auth';
import api from '../api/client';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const role = localStorage.getItem('user_role');

    if (token && role) {
      setUser({ role: role as AuthUser['role'] });
    }
    setLoading(false);
  }, [navigate]);

  const login = async (identifier: string, password: string): Promise<{ success: boolean; role: string | null }> => {
    try {
      const response = await api.post<{ access_token: string; role: AuthUser['role'] }>(
        '/auth/login',
        { identifier, password }
      );

      localStorage.setItem('access_token', response.data.access_token);
      localStorage.setItem('user_role', response.data.role);

      setUser({ role: response.data.role });
      return { success: true, role: response.data.role };
    } catch (err) {
      console.error('Login error:', err);
      return { success: false, role: null };
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_role');
    setUser(null);
    navigate('/login', { replace: true });
  };

  const value: AuthContextType = {
    user,
    isLoggedIn: !!user,
    loading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
