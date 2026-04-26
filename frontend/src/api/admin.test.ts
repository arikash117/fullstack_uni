// src/api/admin.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import adminAPI from './admin';
import api from './client';
import { UserForAdmin, PaginatedResponse } from '../types/api';

// 🔥 Мокаем axios (если ещё не замокан глобально)
vi.mock('axios', async () => {
  const actual = await vi.importActual('axios');
  return {
    default: {
      ...actual,
      create: vi.fn(() => ({
        interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } },
        get: vi.fn(),
        post: vi.fn(),
        patch: vi.fn(),
        delete: vi.fn(),
        defaults: { baseURL: 'http://localhost:8000', headers: {} },
      })),
      get: vi.fn(),
      post: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
    },
    __esModule: true,
  };
});

describe('Admin API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getUsers', () => {
    it('запрашивает список пользователей с дефолтными параметрами', async () => {
      const mockUsers: PaginatedResponse<UserForAdmin> = {
        data: [
          { id: 1, username: 'admin', email: 'admin@test.com', role: 'admin', created_at: '2024-01-01' },
          { id: 2, username: 'trainer1', email: 't1@test.com', role: 'trainer', created_at: '2024-01-02' },
        ],
        total: 2,
        skip: 0,
        limit: 10,
      };

      (api.get as any).mockResolvedValueOnce({ data: mockUsers });

      const result = await adminAPI.getUsers();

      expect(api.get).toHaveBeenCalledWith('/admin/users', {
        params: { username: undefined, role: undefined, skip: 0, limit: 10 },
      });
      expect(result).toEqual(mockUsers);
    });

    it('передаёт фильтры в запрос', async () => {
      const mockUsers: PaginatedResponse<UserForAdmin> = {
        data: [],
        total: 0,
        skip: 5,
        limit: 20,
      };
      (api.get as any).mockResolvedValueOnce({ data: mockUsers });

      await adminAPI.getUsers({ username: 'john', role: 'trainer', skip: 5, limit: 20 });

      expect(api.get).toHaveBeenCalledWith('/admin/users', {
        params: { username: 'john', role: 'trainer', skip: 5, limit: 20 },
      });
    });

    it('возвращает только data из ответа', async () => {
      const mockUser: UserForAdmin = {
        id: 1,
        username: 'test',
        email: 'test@test.com',
        role: 'trainee',
        created_at: '2024-01-01',
      };
      const mockResponse = {
        data: mockUser,
        status: 200,
        headers: {},
      };
      (api.get as any).mockResolvedValueOnce(mockResponse);

      const result = await adminAPI.getUserById(1);

      // 🔑 Проверяем что вернули именно response.data, а не весь ответ
      expect(result).toEqual(mockUser);
      expect(result).not.toHaveProperty('status');
    });
  });

  describe('getUserById', () => {
    it('запрашивает пользователя по ID', async () => {
      const mockUser: UserForAdmin = {
        id: 42,
        username: 'john',
        email: 'john@test.com',
        role: 'trainee',
        created_at: '2024-01-01',
      };
      (api.get as any).mockResolvedValueOnce({ data: mockUser });

      const result = await adminAPI.getUserById(42);

      expect(api.get).toHaveBeenCalledWith('/admin/users/42');
      expect(result).toEqual(mockUser);
    });

    it('пробрасывает ошибку если запрос упал', async () => {
      const error = new Error('User not found');
      (api.get as any).mockRejectedValueOnce(error);

      await expect(adminAPI.getUserById(999)).rejects.toThrow('User not found');
    });
  });

  describe('updateUserRole', () => {
    it('отправляет PATCH запрос с новой ролью', async () => {
      const updatedUser: UserForAdmin = {
        id: 10,
        username: 'jane',
        email: 'jane@test.com',
        role: 'admin',
        created_at: '2024-01-01',
      };
      (api.patch as any).mockResolvedValueOnce({ data: updatedUser });

      const result = await adminAPI.updateUserRole(10, 'admin');

      expect(api.patch).toHaveBeenCalledWith('/admin/users/10/role', { role: 'admin' });
      expect(result).toEqual(updatedUser);
    });

    it('работает со всеми типами ролей', async () => {
      const baseUser: UserForAdmin = {
        id: 1,
        username: 'test',
        email: 'test@test.com',
        role: 'trainer',
        created_at: '2024-01-01',
      };
      
      (api.patch as any).mockResolvedValueOnce({ data: baseUser });
      await adminAPI.updateUserRole(1, 'trainer');
      expect(api.patch).toHaveBeenCalledWith('/admin/users/1/role', { role: 'trainer' });

      (api.patch as any).mockResolvedValueOnce({ 
        data: { ...baseUser, role: 'trainee' as const } 
      });
      await adminAPI.updateUserRole(1, 'trainee');
      expect(api.patch).toHaveBeenCalledWith('/admin/users/1/role', { role: 'trainee' });
    });
  });

  describe('deleteUser', () => {
    it('отправляет DELETE запрос', async () => {
      (api.delete as any).mockResolvedValueOnce({ data: { message: 'Deleted' } });

      await adminAPI.deleteUser(123);

      expect(api.delete).toHaveBeenCalledWith('/admin/users/123');
    });

    it('не возвращает данные (void)', async () => {
      (api.delete as any).mockResolvedValueOnce({ data: { message: 'Deleted' } });

      const result = await adminAPI.deleteUser(123);

      expect(result).toBeUndefined();
    });

    it('пробрасывает ошибку при удалении', async () => {
      const error = { response: { status: 404, data: { detail: 'Not found' } } };
      (api.delete as any).mockRejectedValueOnce(error);

      await expect(adminAPI.deleteUser(999)).rejects.toMatchObject({
        response: { status: 404 },
      });
    });
  });

  describe('Integration: auth headers', () => {
    it('все запросы используют авторизацию из api клиента', async () => {
      // 🔧 Фикс TS ошибки: явная типизация store как Record<string, string>
      const mockLocalStorage = {
        store: { access_token: 'test_token_123' } as Record<string, string>,
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

      Object.defineProperty(globalThis, 'localStorage', {
        value: mockLocalStorage,
        writable: true,
      });

      (api.get as any).mockResolvedValueOnce({ data: [] });

      await adminAPI.getUsers();

      // Проверяем что запрос ушёл с заголовком авторизации
      expect(api.get).toHaveBeenCalledWith(
        '/admin/users',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test_token_123',
          }),
        })
      );
    });
  });
});