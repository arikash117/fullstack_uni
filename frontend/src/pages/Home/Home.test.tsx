// src/pages/Home/Home.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { render } from '../../__tests__/test-utils';
import Home from './Home';
import api from '../../api/client';

vi.mock('../../api/client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } },
    defaults: { baseURL: 'http://localhost:8000', headers: {} },
    create: vi.fn(() => ({
      get: vi.fn(),
      post: vi.fn(),
      interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } },
      defaults: { baseURL: 'http://localhost:8000', headers: {} },
    })),
  },
  __esModule: true,
}));

vi.mock('../../components/WeatherWidget/WeatherWidget', () => ({
  WeatherWidget: () => <div data-testid="weather-widget">WeatherWidget Mock</div>,
}));

describe('Home Page - Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('SEO & Meta tags', () => {
    it('рендерит правильный title и description', async () => {
      render(<Home />);
      
      await waitFor(() => {
        expect(document.title).toBe('Фитнес-трекер | Отслеживайте прогресс трени');
      });
      
      const metaDesc = document.querySelector('meta[name="description"]');
      expect(metaDesc?.getAttribute('content')).toContain('Веб-сервис для тренеров');
    });

    it('добавляет JSON-LD структурированные данные', async () => {
      render(<Home />);
      
      await waitFor(() => {
        const jsonLd = document.querySelector('script[type="application/ld+json"]');
        expect(jsonLd).toBeInTheDocument();
        
        const data = JSON.parse(jsonLd?.textContent || '{}');
        expect(data['@type']).toBe('WebSite');
        expect(data.name).toBe('Фитнес-трекер');
      });
    });
  });

  describe('Кнопка "Начать работу" - логика навигации', () => {
    it('редиректит на /register если пользователь не авторизован', async () => {
      (api.get as any).mockRejectedValue(new Error('No auth'));
      
      render(<Home />);
      
      await waitFor(() => {
        const button = screen.getByRole('button', { name: /начать работу/i });
        expect(button).not.toBeDisabled();
      });
      
      fireEvent.click(screen.getByRole('button', { name: /начать работу/i }));
      
      await waitFor(() => {
        expect(window.location.pathname).toBe('/register');
      });
    });

    it('редиректит на /admin если пользователь — админ', async () => {
      // ✅ Фикс: явный ключ "data"
      (api.get as any).mockResolvedValueOnce({
        data: { id: 1, role: 'admin', email: 'admin@test.com', username: 'admin' },
      });
      
      localStorage.setItem('access_token', 'fake_token');
      localStorage.setItem('user_role', 'admin');
      
      render(<Home />);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /начать работу/i })).not.toBeDisabled();
      });
      
      fireEvent.click(screen.getByRole('button', { name: /начать работу/i }));
      
      await waitFor(() => {
        expect(window.location.pathname).toBe('/admin');
      });
    });
  });

  describe('Контент страницы', () => {
    it('рендерит WeatherWidget', () => {
      render(<Home />);
      expect(screen.getByTestId('weather-widget')).toBeInTheDocument();
    });
  });
});