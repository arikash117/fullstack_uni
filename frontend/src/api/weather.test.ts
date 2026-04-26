import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import { weatherApi, type WeatherData } from './weather';

vi.mock('axios');

describe('Weather API', () => {
  const mockWeatherData: WeatherData = {
    city: 'Moscow',
    temperature: 22,
    feels_like: 20,
    description: 'Clear sky',
    icon: '01d',
    humidity: 65,
    wind_speed: 3.6,
    updated_at: '2024-01-15T12:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getWeather', () => {
    it('должен получить погоду для города по умолчанию (Moscow)', async () => {
      vi.mocked(axios.get).mockResolvedValueOnce({ 
        data: { data: mockWeatherData } 
      });

      const result = await weatherApi.getWeather();

      expect(axios.get).toHaveBeenCalledWith(
        'http://localhost:8000/weather',
        expect.objectContaining({
          params: { city: 'Moscow' },
          timeout: 15000,
        })
      );
      expect(result).toEqual(mockWeatherData);
    });

    it('должен получить погоду для указанного города', async () => {
      vi.mocked(axios.get).mockResolvedValueOnce({ 
        data: { data: { ...mockWeatherData, city: 'London' } } 
      });

      const result = await weatherApi.getWeather('London');

      expect(axios.get).toHaveBeenCalledWith(
        'http://localhost:8000/weather',
        expect.objectContaining({
          params: { city: 'London' },
          timeout: 15000,
        })
      );
      expect(result.city).toBe('London');
    });

    it('должен пробрасывать ошибку при таймауте', async () => {
      const timeoutError = new Error('timeout of 15000ms exceeded');
      vi.mocked(axios.get).mockRejectedValueOnce(timeoutError);

      await expect(weatherApi.getWeather('Moscow')).rejects.toThrow('timeout');
    });

    it('должен пробрасывать ошибку при 404 (город не найден)', async () => {
      const notFoundError = { 
        response: { 
          status: 404, 
          data: { detail: 'City not found' } 
        } 
      };
      vi.mocked(axios.get).mockRejectedValueOnce(notFoundError);

      await expect(weatherApi.getWeather('UnknownCity123'))
        .rejects.toHaveProperty('response.status', 404);
    });

    it('должен использовать правильный таймаут 15000мс', async () => {
      vi.mocked(axios.get).mockResolvedValueOnce({ 
        data: { data: mockWeatherData } 
      });

      await weatherApi.getWeather();

      const callArgs = vi.mocked(axios.get).mock.calls[0];
      expect(callArgs[1]?.timeout).toBe(15000);
    });

    it('должен корректно извлекать data.data из ответа', async () => {
      const rawResponse = {
        data: {
          data: mockWeatherData,
          status: 'ok',
          timestamp: Date.now(),
        },
      };
      vi.mocked(axios.get).mockResolvedValueOnce(rawResponse);

      const result = await weatherApi.getWeather();

      // Функция должна вернуть именно data.data, а не весь ответ
      expect(result).toBe(mockWeatherData);
      expect(result).not.toBe(rawResponse.data);
    });
  });

  describe('WeatherData тип', () => {
    it('должен содержать все обязательные поля', async () => {
      vi.mocked(axios.get).mockResolvedValueOnce({ 
        data: { data: mockWeatherData } 
      });

      const result = await weatherApi.getWeather();

      expect(result).toMatchObject({
        city: expect.any(String),
        temperature: expect.any(Number),
        feels_like: expect.any(Number),
        description: expect.any(String),
        icon: expect.any(String),
        humidity: expect.any(Number),
        wind_speed: expect.any(Number),
        updated_at: expect.any(String),
      });
    });
  });
});