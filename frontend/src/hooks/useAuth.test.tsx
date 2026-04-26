import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useAuth, AuthProvider } from './useAuth';

vi.mock('react-router-dom', () => ({
  useNavigate: vi.fn(() => vi.fn()),
  useLocation: vi.fn(() => ({ pathname: '/' })),
  Navigate: vi.fn(() => null),
}));

vi.mock('../api/client', () => {
  const mockApi = {
    get: vi.fn(),
    post: vi.fn(),
  };
  return { default: mockApi };
});

import api from '../api/client';

describe('useAuth', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
  );

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Инициализация', () => {
    it('инициализируется с user=null и isLoggedIn=false', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      
      expect(result.current.user).toBeNull();
      expect(result.current.isLoggedIn).toBe(false);
    });

    it('загружает пользователя если токен есть в localStorage', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
        role: 'user' as const,
      };
      
      vi.mocked(api.get).mockResolvedValue({ data: mockUser });
      localStorage.setItem('access_token', 'fake_token');
      
      const { result } = renderHook(() => useAuth(), { wrapper });
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      
      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser);
      });
      
      expect(result.current.isLoggedIn).toBe(true);
      expect(api.get).toHaveBeenCalledWith('/auth/me');
    });

    it('разлогинивает если токен есть но /auth/me возвращает ошибку', async () => {
      vi.mocked(api.get).mockRejectedValue({ response: { status: 401 } });
      localStorage.setItem('access_token', 'expired_token');
      
      const { result } = renderHook(() => useAuth(), { wrapper });
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      
      await waitFor(() => {
        expect(result.current.user).toBeNull();
      });
      
      expect(result.current.isLoggedIn).toBe(false);
      expect(localStorage.getItem('access_token')).toBeNull();
    });

    it('не делает запрос если токена нет', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      
      expect(api.get).not.toHaveBeenCalled();
      expect(result.current.user).toBeNull();
    });
  });

  describe('login', () => {
    it('успешный вход сохраняет токены и пользователя', async () => {
      const mockLoginResponse = {
        access_token: 'new_access',
        refresh_token: 'new_refresh',
        user_id: 42,
        role: 'admin' as const,
      };
      const mockUser = {
        id: 42,
        email: 'admin@example.com',
        username: 'admin',
        role: 'admin' as const,
      };
      
      vi.mocked(api.post).mockResolvedValue({ data: mockLoginResponse });
      vi.mocked(api.get).mockResolvedValue({ data: mockUser });
      
      const { result } = renderHook(() => useAuth(), { wrapper });
      await waitFor(() => expect(result.current.loading).toBe(false));
      
      await act(async () => {
        await result.current.login('admin@example.com', 'password123');
      });
      
      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser);
      });
      
      expect(result.current.isLoggedIn).toBe(true);
      expect(localStorage.getItem('access_token')).toBe('new_access');
      expect(localStorage.getItem('user_role')).toBe('admin');
    });

    it('неуспешный вход возвращает ошибку', async () => {
      vi.mocked(api.post).mockRejectedValue({
        response: { data: { detail: 'Неверный пароль' } }
      });
      
      const { result } = renderHook(() => useAuth(), { wrapper });
      await waitFor(() => expect(result.current.loading).toBe(false));
      
      const loginResult = await act(async () => 
        result.current.login('test@example.com', 'wrongpass')
      );
      
      expect(loginResult.success).toBe(false);
      expect(loginResult.error).toBe('Неверный пароль');
      expect(result.current.isLoggedIn).toBe(false);
    });
  });

  describe('logout', () => {
    it('успешный логаут очищает localStorage и сбрасывает user', async () => {
      localStorage.setItem('access_token', 'token');
      localStorage.setItem('refresh_token', 'refresh');
      vi.mocked(api.get).mockResolvedValue({ 
        data: { id: 1, email: 't@e.com', username: 't', role: 'user' } 
      });
      
      const { result } = renderHook(() => useAuth(), { wrapper });
      await waitFor(() => expect(result.current.loading).toBe(false));
      
      vi.mocked(api.post).mockResolvedValue({ data: {} });
      
      await act(async () => {
        await result.current.logout();
      });
      
      await waitFor(() => {
        expect(result.current.user).toBeNull();
      });
      
      expect(localStorage.getItem('access_token')).toBeNull();
      expect(localStorage.getItem('refresh_token')).toBeNull();
      expect(result.current.isLoggedIn).toBe(false);
      expect(api.post).toHaveBeenCalledWith('/auth/logout', { refresh_token: 'refresh' });
    });

    it('логаут работает даже если API падает', async () => {
      localStorage.setItem('refresh_token', 'refresh');
      vi.mocked(api.post).mockRejectedValue(new Error('API down'));
      
      const { result } = renderHook(() => useAuth(), { wrapper });
      await waitFor(() => expect(result.current.loading).toBe(false));
      
      await act(async () => {
        await result.current.logout();
      });
      
      await waitFor(() => {
        expect(result.current.user).toBeNull();
      });
      
      expect(localStorage.getItem('refresh_token')).toBeNull();
    });
  });

  describe('refreshSession', () => {
    it('успешный рефреш обновляет токены', async () => {
      localStorage.setItem('refresh_token', 'old_refresh');
      
      vi.mocked(api.post).mockResolvedValue({
        data: {
          access_token: 'new_access',
          refresh_token: 'new_refresh',
        }
      });
      
      const { result } = renderHook(() => useAuth(), { wrapper });
      await waitFor(() => expect(result.current.loading).toBe(false));
      
      const success = await act(async () => 
        result.current.refreshSession()
      );
      
      expect(success).toBe(true);
      expect(localStorage.getItem('access_token')).toBe('new_access');
      expect(localStorage.getItem('refresh_token')).toBe('new_refresh');
    });

    it('возвращает false если нет refresh_token', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });
      await waitFor(() => expect(result.current.loading).toBe(false));
      
      const success = await act(async () => 
        result.current.refreshSession()
      );
      
      expect(success).toBe(false);
      expect(api.post).not.toHaveBeenCalled();
    });

    it('при ошибке рефреша вызывает logout', async () => {
      localStorage.setItem('refresh_token', 'old');
      vi.mocked(api.post).mockRejectedValue(new Error('Token expired'));
      
      const { result } = renderHook(() => useAuth(), { wrapper });
      await waitFor(() => expect(result.current.loading).toBe(false));
      
      await act(async () => {
        await result.current.refreshSession();
      });
      
      await waitFor(() => {
        expect(result.current.user).toBeNull();
      });
      
      expect(localStorage.getItem('access_token')).toBeNull();
    });
  });

  describe('useAuth вне AuthProvider', () => {
    it('выбрасывает ошибку если используется без провайдера', () => {
      expect(() => {
        renderHook(() => useAuth());
      }).toThrow('useAuth must be used within an AuthProvider');
    });
  });
});