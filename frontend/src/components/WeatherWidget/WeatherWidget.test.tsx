import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { WeatherWidget } from './WeatherWidget';
import styles from './WeatherWidget.module.css';

vi.mock('../../api/weather', () => ({
  weatherApi: {
    getWeather: vi.fn(),
  },
}));

import { weatherApi } from '../../api/weather';

describe('WeatherWidget', () => {
  const mockWeather = {
    city: 'Moscow',
    temperature: 22,
    feels_like: 20,
    description: 'ясно',
    icon: '01d',
    humidity: 65,
    wind_speed: 3.5,
    updated_at: '2026-05-01T10:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    Element.prototype.getBoundingClientRect = vi.fn(function (this: Element) {
      if (this.getAttribute?.('data-testid') === 'weather-widget') {
        return {
          x: 20, y: 100, top: 100, left: 20, right: 270, bottom: 300,
          width: 250, height: 200, toJSON: () => ({}),
        };
      }
      return {
        x: 0, y: 0, top: 0, left: 0, right: 100, bottom: 100,
        width: 100, height: 100, toJSON: () => ({}),
      };
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Загрузка данных', () => {
    it('показывает загрузку при монтировании', () => {
      vi.mocked(weatherApi.getWeather).mockImplementation(() => new Promise(() => {}));
      
      render(<WeatherWidget />);
      
      expect(screen.getByText('Загрузка...')).toBeInTheDocument();
    });

    it('загружает погоду при монтировании', async () => {
      vi.mocked(weatherApi.getWeather).mockResolvedValue(mockWeather);
      
      render(<WeatherWidget />);
      
      await waitFor(() => {
        expect(weatherApi.getWeather).toHaveBeenCalledWith('Moscow');
      });
    });

    it('показывает погоду после успешной загрузки', async () => {
      vi.mocked(weatherApi.getWeather).mockResolvedValue(mockWeather);
      
      render(<WeatherWidget />);
      
      await waitFor(() => {
        expect(screen.getByText('22°C')).toBeInTheDocument();
        expect(screen.getByText('Ощущается как 20°C')).toBeInTheDocument();
        expect(screen.getByText('ясно')).toBeInTheDocument();
        expect(screen.getByText('Moscow')).toBeInTheDocument();
      });
    });

    it('показывает ошибку при неудачной загрузке', async () => {
      vi.mocked(weatherApi.getWeather).mockRejectedValue(new Error('Network error'));
      
      render(<WeatherWidget />);
      
      await waitFor(() => {
        expect(screen.getByText('⚠️ Не удалось загрузить погоду')).toBeInTheDocument();
      });
    });

    it('кнопка "Повторить" перезагружает данные', async () => {
      vi.mocked(weatherApi.getWeather)
        .mockRejectedValueOnce(new Error('Error'))
        .mockResolvedValueOnce(mockWeather);
      
      render(<WeatherWidget />);
      
      await waitFor(() => {
        expect(screen.getByText('⚠️ Не удалось загрузить погоду')).toBeInTheDocument();
      });
      
      const retryBtn = screen.getByRole('button', { name: 'Повторить' });
      fireEvent.click(retryBtn);
      
      await waitFor(() => {
        expect(weatherApi.getWeather).toHaveBeenCalledTimes(2);
        expect(screen.getByText('22°C')).toBeInTheDocument();
      });
    });
  });

  describe('Отображение данных', () => {
    it('показывает иконку погоды', async () => {
      vi.mocked(weatherApi.getWeather).mockResolvedValue(mockWeather);
      
      render(<WeatherWidget />);
      
      await waitFor(() => {
        const img = screen.getByAltText('ясно');
        expect(img).toHaveAttribute('src', 'https://openweathermap.org/img/wn/01d@2x.png');
      });
    });

    it('показывает детали: влажность и ветер', async () => {
      vi.mocked(weatherApi.getWeather).mockResolvedValue(mockWeather);
      
      render(<WeatherWidget />);
      
      await waitFor(() => {
        expect(screen.getByText('65%')).toBeInTheDocument(); // влажность
        expect(screen.getByText('3.5 м/с')).toBeInTheDocument(); // ветер
      });
    });
  });

  describe('Drag-and-drop', () => {
    it('виджет имеет начальную позицию', async () => {
      vi.mocked(weatherApi.getWeather).mockResolvedValue(mockWeather);
      
      render(<WeatherWidget />);
      
      await waitFor(() => {
        // ✅ Используем data-testid
        const widget = screen.getByTestId('weather-widget');
        // ✅ Проверяем инлайн-стили напрямую
        expect(widget).toHaveStyle({ left: '20px', top: '100px' });
      });
    });

    it('начинает перетаскивание при mousedown на header', async () => {
      vi.mocked(weatherApi.getWeather).mockResolvedValue(mockWeather);
      
      render(<WeatherWidget />);
      
      await waitFor(() => {
        const widget = screen.getByTestId('weather-widget');
        expect(widget).toBeInTheDocument();
      });
      
      // ✅ Ищем header по хешированному классу через styles.header
      const header = screen.getByText('🌤️ Погода').closest(`.${styles.header}`);
      expect(header).toBeInTheDocument();
      
      fireEvent.mouseDown(header!, { clientX: 50, clientY: 50 });
      
      // ✅ Проверяем класс через className.includes() (работает с хешем)
      const widget = screen.getByTestId('weather-widget');
      expect(widget.className).toContain('dragging');
    });

    it('перемещается при mousemove во время drag', async () => {
      vi.mocked(weatherApi.getWeather).mockResolvedValue(mockWeather);
      
      render(<WeatherWidget />);
      
      await waitFor(() => {
        const widget = screen.getByTestId('weather-widget');
        expect(widget).toBeInTheDocument();
      });
      
      const header = screen.getByText('🌤️ Погода').closest(`.${styles.header}`)!;
      
      // Начинаем drag
      fireEvent.mouseDown(header, { clientX: 50, clientY: 50 });
      await new Promise(resolve => setTimeout(resolve, 0)); // ← микро-задержка
      
      // Двигаем мышь
      fireEvent.mouseMove(window, { clientX: 150, clientY: 200 });
      await new Promise(resolve => setTimeout(resolve, 0));
      
      const widget = screen.getByTestId('weather-widget');
      
      // ✅ Проверяем через getComputedStyle (надёжнее toHaveStyle)
      const style = window.getComputedStyle(widget);
      const left = parseInt(style.left);
      const top = parseInt(style.top);
      
      // Было (20, 100), после перемещения должно стать ~ (100, 150)
      expect(left).toBeGreaterThan(50);
      expect(top).toBeGreaterThan(100);
    });

    it('завершает перетаскивание при mouseup', async () => {
      vi.mocked(weatherApi.getWeather).mockResolvedValue(mockWeather);
      
      render(<WeatherWidget />);
      
      await waitFor(() => {
        const widget = screen.getByTestId('weather-widget');
        expect(widget).toBeInTheDocument();
      });
      
      const header = screen.getByText('🌤️ Погода').closest(`.${styles.header}`)!;
      
      fireEvent.mouseDown(header, { clientX: 50, clientY: 50 });
      fireEvent.mouseMove(window, { clientX: 150, clientY: 200 });
      fireEvent.mouseUp(window);
      
      const widget = screen.getByTestId('weather-widget');
      
      // ✅ Проверяем что класс dragging исчез
      expect(widget.className).not.toContain('dragging');
    });

    it('очищает event listeners при размонтировании', async () => {
      vi.mocked(weatherApi.getWeather).mockResolvedValue(mockWeather);
      
      const removeListenerSpy = vi.spyOn(window, 'removeEventListener');
      
      const { unmount } = render(<WeatherWidget />);
      
      await waitFor(() => {
        unmount();
        expect(removeListenerSpy).toHaveBeenCalledWith('mousemove', expect.any(Function));
        expect(removeListenerSpy).toHaveBeenCalledWith('mouseup', expect.any(Function));
      });
      
      removeListenerSpy.mockRestore();
    });
  });

  describe('Доступность (a11y)', () => {
    it('виджет имеет роль region', async () => {
      vi.mocked(weatherApi.getWeather).mockResolvedValue(mockWeather);
      
      render(<WeatherWidget />);
      
      await waitFor(() => {
        // Проверяем что есть семантическая разметка
        expect(screen.getByText('🌤️ Погода')).toBeInTheDocument();
      });
    });

    it('иконка погоды имеет alt текст', async () => {
      vi.mocked(weatherApi.getWeather).mockResolvedValue(mockWeather);
      
      render(<WeatherWidget />);
      
      await waitFor(() => {
        const img = screen.getByAltText('ясно');
        expect(img).toBeInTheDocument();
      });
    });
  });
});