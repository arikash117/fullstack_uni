import { useState, useEffect, useContext, createContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const role = localStorage.getItem('user_role');

    if (token && role) {
      setUser({ role });
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, [navigate]);

  const login = async (identifier, password) => {
    try {
      console.log('🔥 [DEBUG] Пытаемся залогиниться...');
      
      const response = await api.post('/auth/login', { identifier, password });

      console.log('✅ [DEBUG] Успешный ответ:', {
        access_token: response.data.access_token,
        role: response.data.role,
        username: response.data.username
      });
      
      localStorage.setItem('access_token', response.data.access_token);
      localStorage.setItem('user_role', response.data.role);

      console.log('💾 [DEBUG] Сохранена роль:', response.data.role);
      
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

  const value = {
    user,
    isLoggedIn: !!user,
    loading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}