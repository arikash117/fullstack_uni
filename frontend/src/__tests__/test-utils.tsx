import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from '../hooks/useAuth';
import { NotificationProvider } from '../components/Notification/NotificationProvider';

// 🔧 Обёртка со всеми провайдерами
function AllTheProviders({ children }: { children: React.ReactNode }) {
  return (
    <BrowserRouter>
      <HelmetProvider>
        <AuthProvider>
          <NotificationProvider>
            {children}
          </NotificationProvider>
        </AuthProvider>
      </HelmetProvider>
    </BrowserRouter>
  );
}

// 🔧 Кастомный render с нашими провайдерами
function customRender(ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
  return render(ui, { wrapper: AllTheProviders, ...options });
}

export * from '@testing-library/react';
export { customRender as render };