import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// 🔥 Мокаем axios — ВСЕ моки создаются ВНУТРИ фабрики и переиспользуются
vi.mock('axios', async () => {
  const actual = await vi.importActual('axios');
  
  // Создаём моки ОДИН раз
  const mockGet = vi.fn();
  const mockPost = vi.fn();
  const mockDelete = vi.fn();
  const mockRequestUse = vi.fn();
  const mockResponseUse = vi.fn();
  
  const mockInterceptors = {
    request: { use: mockRequestUse },
    response: { use: mockResponseUse },
  };
  
  // Инстанс от create() использует ТЕ ЖЕ моки, что и axios напрямую
  const mockInstance = {
    interceptors: mockInterceptors,
    get: mockGet,
    post: mockPost,
    delete: mockDelete,
    defaults: { baseURL: 'http://localhost:8000', headers: {} },
  };
  
  return {
    default: {
      ...actual,
      create: vi.fn(() => mockInstance),
      // 🔑 Ключевое: axios.get/post — те же функции, что у инстанса
      get: mockGet,
      post: mockPost,
      delete: mockDelete,
      interceptors: mockInterceptors,
    },
    __esModule: true,
  };
});

import axios from 'axios';
import api from './client';

describe('API Client', () => {
  const mockLocalStorage = {
    store: {} as Record<string, string>,
    getItem: vi.fn((key: string) => mockLocalStorage.store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      mockLocalStorage.store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete mockLocalStorage.store[key];
    }),
    clear: vi.fn(() => {
      mockLocalStorage.store = {};
    }),
  };

  const mockLocation = {
    href: '',
    pathname: '/dashboard',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.clear();
    mockLocation.href = '';
    mockLocation.pathname = '/dashboard';

    Object.defineProperty(globalThis, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
    });
    Object.defineProperty(globalThis, 'window', {
      value: { location: mockLocation },
      writable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // 🔧 Хелпер для настройки моков — меньше повторений
  const setupAxiosMock = (method: 'get' | 'post' | 'delete', response: any) => {
    (axios[method] as any).mockImplementation(() => 
      response instanceof Error 
        ? Promise.reject(response) 
        : Promise.resolve(response)
    );
  };

  describe('Request Interceptor', () => {
    it('добавляет Authorization header если токен есть', async () => {
      mockLocalStorage.setItem('access_token', 'test_token');
      setupAxiosMock('get', { data: {} });

      await api.get('/test');

      expect(axios.get).toHaveBeenCalledWith(
        '/test',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test_token',
          }),
        })
      );
    });

    it('не добавляет Authorization если токена нет', async () => {
      setupAxiosMock('get', { data: {} });
      await api.get('/test');

      const callArgs = (axios.get as any).mock.calls[0];
      const headers = callArgs?.[1]?.headers || {};
      expect(headers.Authorization).toBeUndefined();
    });

    it('не ставит Content-Type: application/json для FormData', async () => {
      const formData = new FormData();
      formData.append('file', new Blob(['test'], { type: 'image/jpeg' }));
      
      setupAxiosMock('post', { data: {} });
      await api.post('/upload', formData);

      const callArgs = (axios.post as any).mock.calls[0];
      const headers = callArgs?.[2]?.headers || {};
      expect(headers['Content-Type']).toBeUndefined();
    });

    it('ставит Content-Type: application/json для обычных данных', async () => {
      setupAxiosMock('post', { data: {} });
      await api.post('/test', { key: 'value' });

      const callArgs = (axios.post as any).mock.calls[0];
      const headers = callArgs?.[2]?.headers || {};
      expect(headers['Content-Type']).toBe('application/json');
    });
  });

  describe('Response Interceptor - Success', () => {
    it('пропускает успешные ответы без изменений', async () => {
      const mockResponse = { data: { id: 1, name: 'test' }, status: 200 };
      setupAxiosMock('get', mockResponse);

      const result = await api.get('/test');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Response Interceptor - 401 Handling', () => {
    it('не пытается рефрешить для /auth/ эндпоинтов', async () => {
      mockLocalStorage.setItem('access_token', 'old_token');
      
      (axios.get as any).mockRejectedValueOnce({
        response: { status: 401 },
        config: { url: '/auth/login' },
      });

      await expect(api.get('/auth/login')).rejects.toMatchObject({
        response: { status: 401 },
      });

      expect(axios.post).not.toHaveBeenCalledWith(
        expect.stringContaining('/auth/refresh'),
        expect.anything()
      );
    });

    it('запускает рефреш при 401 на обычном эндпоинте', async () => {
      mockLocalStorage.setItem('refresh_token', 'refresh_123');

      (axios.get as any)
        .mockRejectedValueOnce({
          response: { status: 401 },
          config: { url: '/api/data', headers: {}, _retry: false },
        })
        .mockResolvedValueOnce({ data: { result: 'ok' } });

      (axios.post as any).mockResolvedValueOnce({
        data: { access_token: 'new_access', refresh_token: 'new_refresh' },
      });

      const result = await api.get('/api/data');

      expect(axios.post).toHaveBeenCalledWith(
        'http://localhost:8000/auth/refresh',
        { refresh_token: 'refresh_123' }
      );
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('access_token', 'new_access');
      expect(result.data).toEqual({ result: 'ok' });
    });

    it('повторяет исходный запрос после успешного рефреша', async () => {
      mockLocalStorage.setItem('refresh_token', 'refresh_123');

      (axios.get as any)
        .mockRejectedValueOnce({
          response: { status: 401 },
          config: { url: '/api/data', headers: {}, _retry: false, method: 'GET' },
        })
        .mockResolvedValueOnce({ data: { result: 'success' } });

      (axios.post as any).mockResolvedValueOnce({
        data: { access_token: 'new_access', refresh_token: 'new_refresh' },
      });

      const result = await api.get('/api/data');
      expect(result?.data).toEqual({ result: 'success' });
      expect(axios.get).toHaveBeenCalledTimes(2);
    });

    it('ставит _retry флаг чтобы избежать бесконечного цикла', async () => {
      mockLocalStorage.setItem('refresh_token', 'refresh_123');

      let callCount = 0;
      (axios.get as any).mockImplementation((url: string, config: any) => {
        callCount++;
        if (callCount === 1 && config?._retry === false) {
          return Promise.reject({
            response: { status: 401 },
            config: { ...config, _retry: true },
          });
        }
        return Promise.resolve({ data: {} });
      });

      (axios.post as any).mockResolvedValueOnce({
        data: { access_token: 'new', refresh_token: 'new' },
      });

      await api.get('/test');
      expect(callCount).toBe(2);
    });
  });

  describe('Token Refresh - Queue Management', () => {
    it('добавляет запросы в очередь пока идёт рефреш', async () => {
      mockLocalStorage.setItem('refresh_token', 'refresh_123');

      let resolveRefresh: (value: any) => void;
      const refreshPromise = new Promise((resolve) => {
        resolveRefresh = resolve;
      });

      (axios.post as any).mockImplementation(() => refreshPromise);
      (axios.get as any)
        .mockRejectedValueOnce({
          response: { status: 401 },
          config: { url: '/api/first', headers: {}, _retry: false },
        })
        .mockRejectedValueOnce({
          response: { status: 401 },
          config: { url: '/api/second', headers: {}, _retry: false },
        })
        .mockResolvedValueOnce({ data: { result: 'first' } })
        .mockResolvedValueOnce({ data: { result: 'second' } });

      const promise1 = api.get('/api/first');
      const promise2 = api.get('/api/second');

      resolveRefresh!({
        data: { access_token: 'new_token', refresh_token: 'new_refresh' },
      });

      const [res1, res2] = await Promise.all([promise1, promise2]);
      expect(res1?.data).toEqual({ result: 'first' });
      expect(res2?.data).toEqual({ result: 'second' });
      expect(axios.post).toHaveBeenCalledTimes(1);
    });

    it('отклоняет запросы в очереди при ошибке рефреша', async () => {
      mockLocalStorage.setItem('refresh_token', 'refresh_123');

      (axios.post as any).mockRejectedValue(new Error('Refresh failed'));
      (axios.get as any).mockRejectedValue({
        response: { status: 401 },
        config: { url: '/api/test', headers: {}, _retry: false },
      });

      await expect(api.get('/api/test')).rejects.toThrow('Refresh failed');
    });
  });

  describe('Token Refresh - Failure Handling', () => {
    it('очищает localStorage при ошибке рефреша', async () => {
      mockLocalStorage.setItem('access_token', 'old_access');
      mockLocalStorage.setItem('refresh_token', 'old_refresh');
      mockLocalStorage.setItem('user_role', 'user');
      mockLocalStorage.setItem('user_id', '123');

      (axios.post as any).mockRejectedValue(new Error('Token expired'));
      (axios.get as any).mockRejectedValue({
        response: { status: 401 },
        config: { url: '/api/test', headers: {}, _retry: false },
      });

      await expect(api.get('/api/test')).rejects.toThrow();

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('access_token');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('refresh_token');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('user_role');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('user_id');
    });

    it('редиректит на /login при ошибке рефреша', async () => {
      mockLocalStorage.setItem('refresh_token', 'refresh_123');

      (axios.post as any).mockRejectedValue(new Error('Expired'));
      (axios.get as any).mockRejectedValue({
        response: { status: 401 },
        config: { url: '/api/test', headers: {}, _retry: false },
      });

      await expect(api.get('/api/test')).rejects.toThrow();
      expect(mockLocation.href).toBe('/login');
    });

    it('не редиректит если уже на /login', async () => {
      mockLocation.pathname = '/login';
      mockLocalStorage.setItem('refresh_token', 'refresh_123');

      (axios.post as any).mockRejectedValue(new Error('Expired'));
      (axios.get as any).mockRejectedValue({
        response: { status: 401 },
        config: { url: '/api/test', headers: {}, _retry: false },
      });

      await expect(api.get('/api/test')).rejects.toThrow();
      expect(mockLocation.href).toBe('');
    });
  });

  describe('No Refresh Token', () => {
    it('разлогинивает если нет refresh_token', async () => {
      mockLocalStorage.store = {};

      (axios.get as any).mockRejectedValue({
        response: { status: 401 },
        config: { url: '/api/test', headers: {}, _retry: false },
      });

      await expect(api.get('/api/test')).rejects.toMatchObject({
        response: { status: 401 },
      });

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('access_token');
      expect(mockLocation.href).toBe('/login');
    });
  });

  describe('Concurrent Refresh Prevention', () => {
    it('не запускает второй рефреш если уже идёт', async () => {
      mockLocalStorage.setItem('refresh_token', 'refresh_123');

      let resolveFirst: (value: any) => void;
      const firstRefresh = new Promise((resolve) => {
        resolveFirst = resolve;
      });

      (axios.post as any).mockImplementation(() => firstRefresh);
      (axios.get as any)
        .mockRejectedValueOnce({
          response: { status: 401 },
          config: { url: '/api/first', headers: {}, _retry: false },
        })
        .mockRejectedValueOnce({
          response: { status: 401 },
          config: { url: '/api/second', headers: {}, _retry: false },
        })
        .mockResolvedValueOnce({ data: { result: 'first' } })
        .mockResolvedValueOnce({ data: { result: 'second' } });

      const promise1 = api.get('/api/first');
      const promise2 = api.get('/api/second');

      resolveFirst!({
        data: { access_token: 'new', refresh_token: 'new' },
      });

      await Promise.all([promise1, promise2]);

      expect(axios.post).toHaveBeenCalledTimes(1);
      expect(axios.post).toHaveBeenCalledWith(
        'http://localhost:8000/auth/refresh',
        { refresh_token: 'refresh_123' }
      );
    });
  });
});