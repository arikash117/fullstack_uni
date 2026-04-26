import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  getAuthToken,
  getRefreshToken,
  getUserId,
  getUserRole,
  clearAuth,
} from './auth';

describe('auth utils', () => {
  beforeEach(() => {
    // Очищаем localStorage перед каждым тестом
    localStorage.clear();
  });

  afterEach(() => {
    // Очищаем после каждого теста
    localStorage.clear();
  });

  describe('getAuthToken', () => {
    it('возвращает токен если он есть', () => {
      localStorage.setItem('access_token', 'abc123');
      expect(getAuthToken()).toBe('abc123');
    });

    it('возвращает null если токена нет', () => {
      expect(getAuthToken()).toBeNull();
    });

    it('возвращает пустую строку если токен пустой', () => {
      localStorage.setItem('access_token', '');
      expect(getAuthToken()).toBe('');
    });
  });

  describe('getRefreshToken', () => {
    it('возвращает refresh токен если он есть', () => {
      localStorage.setItem('refresh_token', 'xyz789');
      expect(getRefreshToken()).toBe('xyz789');
    });

    it('возвращает null если refresh токена нет', () => {
      expect(getRefreshToken()).toBeNull();
    });
  });

  describe('getUserId', () => {
    it('возвращает числовой ID если он есть', () => {
      localStorage.setItem('user_id', '42');
      expect(getUserId()).toBe(42);
    });

    it('возвращает null если ID нет', () => {
      expect(getUserId()).toBeNull();
    });

    it('возвращает NaN если ID невалидный', () => {
      localStorage.setItem('user_id', 'not-a-number');
      expect(getUserId()).toBeNaN();
    });

    it('возвращает корректный ID для больших чисел', () => {
      localStorage.setItem('user_id', '999999');
      expect(getUserId()).toBe(999999);
    });
  });

  describe('getUserRole', () => {
    it('возвращает роль если она есть', () => {
      localStorage.setItem('user_role', 'admin');
      expect(getUserRole()).toBe('admin');
    });

    it('возвращает null если роли нет', () => {
      expect(getUserRole()).toBeNull();
    });

    it('возвращает любую строку роли', () => {
      localStorage.setItem('user_role', 'superuser');
      expect(getUserRole()).toBe('superuser');
    });
  });

  describe('clearAuth', () => {
    it('удаляет все ключи авторизации', () => {
      // Устанавливаем все ключи
      localStorage.setItem('access_token', 'abc');
      localStorage.setItem('refresh_token', 'xyz');
      localStorage.setItem('user_id', '42');
      localStorage.setItem('user_role', 'admin');
      localStorage.setItem('other_key', 'should_not_be_deleted');

      clearAuth();

      // Проверяем что удалены
      expect(localStorage.getItem('access_token')).toBeNull();
      expect(localStorage.getItem('refresh_token')).toBeNull();
      expect(localStorage.getItem('user_id')).toBeNull();
      expect(localStorage.getItem('user_role')).toBeNull();

      // Проверяем что другие ключи не затронуты
      expect(localStorage.getItem('other_key')).toBe('should_not_be_deleted');
    });

    it('не падает если ключей нет', () => {
      expect(() => clearAuth()).not.toThrow();
    });
  });
});