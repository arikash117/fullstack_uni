import { useState, useEffect, useContext, createContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContextType, AuthUser } from '../types/auth';
import api from '../api/client';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchUser = useCallback(async (): Promise<AuthUser | null> => {
    try {
      const response = await api.get<AuthUser>('/auth/me');
      return response.data;
    } catch (err) {
      console.error('Failed to fetch user:', err);
      return null;
    }
  }, []);

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('access_token');
      
      if (token) {
        const userData = await fetchUser();
        if (userData) {
          setUser(userData);
        } else {
          logout();
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, [fetchUser, navigate]);

const login = async (identifier: string, password: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const response = await api.post('/auth/login', { identifier, password });
    
    const { access_token, refresh_token, role, user_id } = response.data;

    localStorage.setItem('access_token', access_token);
    localStorage.setItem('refresh_token', refresh_token);
    localStorage.setItem('user_role', role);
    localStorage.setItem('user_id', user_id.toString());

    const userData = await fetchUser();
    
    setUser(userData || { 
      id: user_id, 
      role: role as 'admin' | 'user',
      email: identifier,
      username: identifier,
    });
    
    return { success: true };
  } catch (err: any) {
    console.error('Login error:', err);
    const message = err.response?.data?.detail || 'Ошибка входа';
    return { success: false, error: message };
  }
};

  const logout = async () => {
    const refreshToken = localStorage.getItem('refresh_token');
    
    if (refreshToken) {
      try {
        await api.post('/auth/logout', { refresh_token: refreshToken });
      } catch (err) {
        console.warn('Logout API call failed:', err);
      }
    }

    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_role');
    localStorage.removeItem('user_id');
    
    setUser(null);
    navigate('/login', { replace: true });
  };

  const refreshSession = async (): Promise<boolean> => {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) return false;

    try {
      const response = await api.post('/auth/refresh', { refresh_token: refreshToken });
      const { access_token, refresh_token } = response.data;
      
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('refresh_token', refresh_token);
      
      return true;
    } catch (err) {
      console.error('Manual refresh failed:', err);
      logout();
      return false;
    }
  };

  const value: AuthContextType = {
    user,
    isLoggedIn: !!user,
    loading,
    login,
    logout,
    refreshSession,
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