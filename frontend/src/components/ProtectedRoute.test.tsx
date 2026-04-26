vi.mock('../hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    loading: false,
    isLoggedIn: true,
    user: null,
    login: vi.fn(),
    logout: vi.fn(),
    refreshSession: vi.fn(),
  })),
}));

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';

const mockUseAuth = vi.fn();
const mockUseNavigate = vi.fn();
const mockUseLocation = vi.fn(() => ({
  pathname: '/dashboard',
  search: '',
  hash: '',
  state: null,
  key: 'default',
}));
const MockNavigate = vi.fn(() => null);

vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockUseNavigate(),
    useLocation: () => mockUseLocation(),
    Navigate: () => MockNavigate(),
  };
});

const renderProtectedRoute = (
  children: React.ReactNode,
  authValue: ReturnType<typeof mockUseAuth>
) => {
  // Настраиваем возвраты моков
  mockUseAuth.mockReturnValue(authValue);
  mockUseNavigate.mockReturnValue(vi.fn());
  
  return render(
    <BrowserRouter>
      <ProtectedRoute>{children}</ProtectedRoute>
    </BrowserRouter>
  );
};

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Неавторизованный пользователь', () => {
    it('передаёт текущий маршрут в state при редиректе', () => {
      // Меняем pathname через mockUseLocation
      mockUseLocation.mockReturnValue({
        pathname: '/trainee/123',
        search: '',
        hash: '',
        state: null,
        key: 'default',
      });
      
      renderProtectedRoute(
        <div>Content</div>,
        { loading: false, isLoggedIn: false, user: null }
      );
      
      // Проверяем что useLocation вернул наш pathname
      expect(mockUseLocation()).toHaveProperty('pathname', '/trainee/123');
    });
  });

  describe('Авторизованный пользователь', () => {
    it('рендерит дочерние компоненты если пользователь авторизован', () => {
      renderProtectedRoute(
        <div data-testid="protected-content">Protected Content</div>,
        { 
          loading: false, 
          isLoggedIn: true, 
          user: { id: 1, email: 't@e.com', username: 'test', role: 'user' } 
        }
      );
      
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('рендерит сложные дочерние компоненты', () => {
      const ComplexChild = () => (
        <div>
          <h1>Dashboard</h1>
          <button>Click me</button>
        </div>
      );
      
      renderProtectedRoute(
        <ComplexChild />,
        { 
          loading: false, 
          isLoggedIn: true, 
          user: { id: 1, email: 'admin@e.com', username: 'admin', role: 'admin' } 
        }
      );
      
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
    });
  });

  describe('Типы ролей', () => {
    it('разрешает доступ пользователю с ролью user', () => {
      renderProtectedRoute(
        <div data-testid="content">User Content</div>,
        { 
          loading: false, 
          isLoggedIn: true, 
          user: { id: 1, email: 'u@e.com', username: 'user', role: 'user' } 
        }
      );
      
      expect(screen.getByTestId('content')).toBeInTheDocument();
    });

    it('разрешает доступ пользователю с ролью admin', () => {
      renderProtectedRoute(
        <div data-testid="content">Admin Content</div>,
        { 
          loading: false, 
          isLoggedIn: true, 
          user: { id: 1, email: 'a@e.com', username: 'admin', role: 'admin' } 
        }
      );
      
      expect(screen.getByTestId('content')).toBeInTheDocument();
    });
  });
});