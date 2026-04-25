import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import App from '../App';
import * as useAuth from '../hooks/useAuth';

// Мокаем useAuth
vi.mock('../hooks/useAuth', () => ({
  useAuth: vi.fn(),
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

const renderApp = () => {
  return render(
    <BrowserRouter>
      <HelmetProvider>
        <App />
      </HelmetProvider>
    </BrowserRouter>
  );
};

describe('App', () => {
  it('показывает загрузку когда loading=true', () => {
    vi.mocked(useAuth.useAuth).mockReturnValue({
      loading: true,
      user: null,
      isLoggedIn: false,
      login: vi.fn(),
      logout: vi.fn(),
      refreshSession: vi.fn(),
    });
    
    renderApp();
    
    expect(screen.getByText(/загрузка/i)).toBeInTheDocument();
  });

  it('рендерит Header и Footer', () => {
    vi.mocked(useAuth.useAuth).mockReturnValue({
      loading: false,
      user: null,
      isLoggedIn: false,
      login: vi.fn(),
      logout: vi.fn(),
      refreshSession: vi.fn(),
    });
    
    renderApp();
    
    expect(screen.getByRole('banner')).toBeInTheDocument(); // Header
    expect(screen.getByRole('contentinfo')).toBeInTheDocument(); // Footer
  });

  it('показывает Home на главной странице', () => {
    vi.mocked(useAuth.useAuth).mockReturnValue({
      loading: false,
      user: null,
      isLoggedIn: false,
      login: vi.fn(),
      logout: vi.fn(),
      refreshSession: vi.fn(),
    });
    
    renderApp();
    
    // Здесь зависит от того что внутри Home
    // Например:
    // expect(screen.getByText(/добро пожаловать/i)).toBeInTheDocument();
  });
});