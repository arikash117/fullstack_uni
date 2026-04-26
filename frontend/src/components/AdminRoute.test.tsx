import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AdminRoute from './AdminRoute';

// ✅ 1. Мокаем модули — ПУТИ ДОЛЖНЫ СОВПАДАТЬ с импортами в AdminRoute.tsx!
vi.mock('../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useLocation: vi.fn(() => ({
      pathname: '/admin',
      search: '',
      hash: '',
      state: null,
      key: 'default',
    })),
    // ✅ MockNavigate определяем ВНУТРИ фабрики (избегаем хоистинга)
    Navigate: vi.fn(({ to, state, replace }) => (
      <div 
        data-testid="navigate-redirect" 
        data-to={to}
        data-replace={replace}
        data-state={JSON.stringify(state)}
      />
    )),
  };
});

// ✅ 2. Импортируем ПОСЛЕ моков
import { useAuth } from '../hooks/useAuth';
import { useLocation } from 'react-router-dom';

// ✅ 3. Хелпер для рендера
const renderAdminRoute = (
  children: React.ReactNode,
  authValue: ReturnType<typeof useAuth>
) => {
  vi.mocked(useAuth).mockReturnValue(authValue);
  
  return render(
    <BrowserRouter>
      <AdminRoute>{children}</AdminRoute>
    </BrowserRouter>
  );
};

describe('AdminRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Состояние загрузки', () => {
    it('показывает индикатор проверки прав когда loading=true', () => {
      renderAdminRoute(
        <div data-testid="admin-content">Admin Content</div>,
        { loading: true, user: null, isLoggedIn: false } as any
      );
      
      expect(screen.getByText(/проверка прав/i)).toBeInTheDocument();
      expect(screen.queryByTestId('admin-content')).not.toBeInTheDocument();
      expect(screen.queryByTestId('navigate-redirect')).not.toBeInTheDocument();
    });
  });

  describe('Доступ админа', () => {
    it('рендерит контент если пользователь — админ', () => {
      renderAdminRoute(
        <div data-testid="admin-content">Admin Only</div>,
        { 
          loading: false, 
          user: { id: 1, email: 'admin@example.com', username: 'admin', role: 'admin' },
          isLoggedIn: true
        } as any
      );
      
      expect(screen.getByTestId('admin-content')).toBeInTheDocument();
      expect(screen.getByText('Admin Only')).toBeInTheDocument();
      expect(screen.queryByTestId('navigate-redirect')).not.toBeInTheDocument();
    });

    it('рендерит сложные дочерние компоненты для админа', () => {
      const AdminPanel = () => (
        <div>
          <h1>Панель администратора</h1>
          <button>Удалить пользователя</button>
          <table data-testid="users-table" />
        </div>
      );
      
      renderAdminRoute(
        <AdminPanel />,
        { 
          loading: false, 
          user: { id: 1, email: 'admin@example.com', username: 'admin', role: 'admin' },
          isLoggedIn: true
        } as any
      );
      
      expect(screen.getByText('Панель администратора')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /удалить пользователя/i })).toBeInTheDocument();
      expect(screen.getByTestId('users-table')).toBeInTheDocument();
    });
  });

  describe('Защита от обычных пользователей', () => {
    it('редиректит на /dashboard если роль user', () => {
      renderAdminRoute(
        <div>Protected Content</div>,
        { 
          loading: false, 
          user: { id: 1, email: 'user@example.com', username: 'user', role: 'user' },
          isLoggedIn: true
        } as any
      );
      
      const navigateElement = screen.getByTestId('navigate-redirect');
      expect(navigateElement).toBeInTheDocument();
      expect(navigateElement).toHaveAttribute('data-to', '/dashboard');
      expect(navigateElement).toHaveAttribute('data-replace', 'true');
      
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });

    it('редиректит если user=null', () => {
      renderAdminRoute(
        <div>Content</div>,
        { loading: false, user: null, isLoggedIn: false } as any
      );
      
      const navigateElement = screen.getByTestId('navigate-redirect');
      expect(navigateElement).toBeInTheDocument();
      expect(navigateElement).toHaveAttribute('data-to', '/dashboard');
    });

    it('редиректит если user=undefined', () => {
      renderAdminRoute(
        <div>Content</div>,
        { loading: false, user: undefined, isLoggedIn: false } as any
      );
      
      const navigateElement = screen.getByTestId('navigate-redirect');
      expect(navigateElement).toBeInTheDocument();
      expect(navigateElement).toHaveAttribute('data-to', '/dashboard');
    });
  });

  describe('Передача маршрута в state', () => {
    it('сохраняет исходный маршрут при редиректе', () => {
      vi.mocked(useLocation).mockReturnValue({
        pathname: '/admin/users',
        search: '?filter=active',
        hash: '',
        state: null,
        key: 'abc123',
      });
      
      renderAdminRoute(
        <div>Content</div>,
        {
            loading: false, user: { id: 1, role: 'user' } as any, isLoggedIn: true,
            login: function (identifier: string, password: string): Promise<{ success: boolean; error?: string; }> {
                throw new Error('Function not implemented.');
            },
            logout: function (): Promise<void> {
                throw new Error('Function not implemented.');
            },
            refreshSession: function (): Promise<boolean> {
                throw new Error('Function not implemented.');
            }
        }
      );
      
      const navigateElement = screen.getByTestId('navigate-redirect');
      const state = JSON.parse(navigateElement.getAttribute('data-state') || '{}');
      
      expect(state.from.pathname).toBe('/admin/users');
      expect(state.from.search).toBe('?filter=active');
    });
  });

  describe('Типы данных пользователя', () => {
    it('работает с полным объектом AuthUser', () => {
      renderAdminRoute(
        <div data-testid="content">Test</div>,
        { 
          loading: false, 
          user: { 
            id: 42, 
            email: 'admin@test.com', 
            username: 'superadmin', 
            role: 'admin',
            created_at: '2026-01-01T00:00:00Z'
          },
          isLoggedIn: true
        } as any
      );
      
      expect(screen.getByTestId('content')).toBeInTheDocument();
    });

    it('работает с минимальным объектом пользователя', () => {
      renderAdminRoute(
        <div data-testid="content">Test</div>,
        { 
          loading: false, 
          user: { id: 1, email: 'a@b.c', username: 'x', role: 'admin' },
          isLoggedIn: true
        } as any
      );
      
      expect(screen.getByTestId('content')).toBeInTheDocument();
    });
  });
});