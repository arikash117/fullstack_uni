import { describe, it, expect } from 'vitest';
import { formatDateTime } from './formatDateTime';

describe('formatDateTime', () => {
  describe('валидные даты', () => {
    it('форматирует корректную ISO дату в ДД.ММ.ГГ', () => {
      const result = formatDateTime('2026-05-01T10:30:00Z');
      expect(result).toBe('01.05.26');
    });

    it('форматирует дату без времени', () => {
      const result = formatDateTime('2026-12-31');
      expect(result).toBe('31.12.26');
    });

    it('форматирует дату с часовым поясом', () => {
      const result = formatDateTime('2026-01-15T23:45:00+03:00');
      expect(result).toBe('15.01.26');
    });

    it('обрабатывает високосный год', () => {
      const result = formatDateTime('2024-02-29T12:00:00Z');
      expect(result).toBe('29.02.24');
    });
  });

  describe('невалидные входные данные', () => {
    it('возвращает заглушку для undefined', () => {
      expect(formatDateTime(undefined)).toBe('--.--.--');
    });

    it('возвращает заглушку для пустой строки', () => {
      expect(formatDateTime('')).toBe('--.--.--');
    });

    it('возвращает заглушку для невалидной строки', () => {
      expect(formatDateTime('not-a-date')).toBe('--.--.--');
    });

    it('возвращает заглушку для даты до 1970 года', () => {
      expect(formatDateTime('1969-12-31T00:00:00Z')).toBe('--.--.--');
    });

    it('возвращает заглушку для даты с годом 0000', () => {
      expect(formatDateTime('0000-01-01T00:00:00Z')).toBe('--.--.--');
    });
  });

  describe('граничные случаи', () => {
    it('обрабатывает дату ровно 1970-01-01', () => {
      const result = formatDateTime('1970-01-01T00:00:00Z');
      expect(result).toBe('01.01.70');
    });

    it('не падает при выбросе исключения', () => {
      // Используем vi.spyOn для мока Date
      const originalDate = globalThis.Date;
      
      try {
        // @ts-ignore - намеренно ломаем Date для теста
        globalThis.Date = class MockDate {
          constructor(value: any) {
            if (value === 'throw-error') {
              throw new Error('Test error');
            }
            return new originalDate(value);
          }
        };

        expect(formatDateTime('throw-error')).toBe('--.--.--');
      } finally {
        // Восстанавливаем
        globalThis.Date = originalDate;
      }
    });
  });

  describe('локаль ru-RU', () => {
    it('использует русский формат с ведущими нулями', () => {
      const result = formatDateTime('2026-03-05T08:09:10Z');
      expect(result).toBe('05.03.26');
    });

    it('корректно обрабатывает месяцы с разным количеством дней', () => {
      expect(formatDateTime('2026-02-01')).toBe('01.02.26');
      expect(formatDateTime('2026-04-30')).toBe('30.04.26');
      expect(formatDateTime('2026-12-31')).toBe('31.12.26');
    });
  });
});