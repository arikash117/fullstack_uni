import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import EditTraineeModal from './EditTraineeModal';
import { Trainee } from '../../types/trainee';

// ✅ Мокаем API модуль
vi.mock('../../api/client', () => ({
  default: {
    get: vi.fn(),
    patch: vi.fn(),
    post: vi.fn(),
  },
}));

import api from '../../api/client';

describe('EditTraineeModal', () => {
  // ✅ Используем тип Trainee и исправляем photo_path (undefined вместо null)
  const mockTrainee: Trainee = {
    id: 1,
    name: 'Иван Иванов',
    phone: '79991234567',
    goal: 'Похудеть',
    subscription_end: '2026-12-31T00:00:00Z',
    photo_path: undefined, // ✅ или 'trainees/photo.jpg'
  };

  const mockOnClose = vi.fn();
  const mockOnSaved = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnClose.mockClear();
    mockOnSaved.mockClear();
  });

  // ✅ Выносим renderModal на уровень describe чтобы был виден везде
  const renderModal = (overrides: Partial<Trainee> = {}) => {
    return render(
      <EditTraineeModal
        trainee={{ ...mockTrainee, ...overrides }}
        onClose={mockOnClose}
        onSaved={mockOnSaved}
      />
    );
  };

  describe('Рендеринг', () => {
    it('рендерит заголовок модального окна', () => {
      renderModal();
      expect(screen.getByText('Изменить тренирующегося')).toBeInTheDocument();
    });

    it('заполняет форму данными трейни', () => {
      renderModal();
      
      expect(screen.getByDisplayValue('Иван Иванов')).toBeInTheDocument();
      expect(screen.getByDisplayValue('79991234567')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Похудеть')).toBeInTheDocument();
      expect(screen.getByDisplayValue('2026-12-31')).toBeInTheDocument();
    });

    it('рендерит все поля формы', () => {
      renderModal();
      
      expect(screen.getByLabelText(/Изменить фото:/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Имя:/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Телефон:/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Цель:/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Дата окончания подписки:/)).toBeInTheDocument();
    });

    it('рендерит кнопки Отмена и Сохранить', () => {
      renderModal();
      
      expect(screen.getByRole('button', { name: 'Отмена' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Сохранить изменения' })).toBeInTheDocument();
    });
  });

  describe('Взаимодействие с формой', () => {
    it('обновляет состояние при вводе в поле имени', () => {
      renderModal();
      
      const nameInput = screen.getByLabelText(/Имя:/);
      fireEvent.change(nameInput, { target: { value: 'Новое имя' } });
      
      expect(nameInput).toHaveValue('Новое имя');
    });

    it('обновляет состояние при выборе цели', () => {
      renderModal();
      
      const goalSelect = screen.getByLabelText(/Цель:/);
      fireEvent.change(goalSelect, { target: { value: 'Набрать мышечную массу' } });
      
      expect(goalSelect).toHaveValue('Набрать мышечную массу');
    });

    it('обрабатывает выбор файла для фото', () => {
      renderModal();
      
      const file = new File(['fake image'], 'photo.jpg', { type: 'image/jpeg' });
      const photoInput = screen.getByLabelText('Изменить фото:');
      
      fireEvent.change(photoInput, { target: { files: [file] } });
      
      // Проверяем что файл сохранился в состоянии (через preview)
      const preview = screen.getByAltText('preview');
      expect(preview).toBeInTheDocument();
    });
  });

  describe('Валидация', () => {
    it('показывает алерт если имя пустое', () => {
      const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});
      renderModal();
      
      const nameInput = screen.getByLabelText(/Имя:/);
      fireEvent.change(nameInput, { target: { value: '' } });
      
      const submitBtn = screen.getByRole('button', { name: 'Сохранить изменения' });
      fireEvent.click(submitBtn);
      
      waitFor(() => {
        expect(alertMock).toHaveBeenCalledWith('Заполните имя и телефон!');
      });
      alertMock.mockRestore();
    });

    it('показывает алерт если телефон пустой', () => {
      const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});
      renderModal();
      
      const phoneInput = screen.getByLabelText(/Телефон:/);
      fireEvent.change(phoneInput, { target: { value: '' } });
      
      const submitBtn = screen.getByRole('button', { name: 'Сохранить изменения' });
      fireEvent.click(submitBtn);
      
      waitFor(() => {
        expect(alertMock).toHaveBeenCalledWith('Заполните имя и телефон!');
      });
      alertMock.mockRestore();
    });
  });

  describe('Отправка формы', () => {
    it('вызывает onClose и onSaved при успешном обновлении', async () => {
      vi.mocked(api.patch).mockResolvedValue({ data: {} });
      vi.mocked(api.post).mockResolvedValue({ data: {} });
      
      renderModal();
      
      const submitBtn = screen.getByRole('button', { name: 'Сохранить изменения' });
      fireEvent.click(submitBtn);
      
      await waitFor(() => {
        expect(api.patch).toHaveBeenCalledWith(
          '/trainees/1',
          expect.objectContaining({
            name: 'Иван Иванов',
            phone: '79991234567',
            goal: 'Похудеть',
            subscription_end: '2026-12-31',
          })
        );
        expect(mockOnSaved).toHaveBeenCalled();
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it('отправляет фото если выбран файл', async () => {
      vi.mocked(api.patch).mockResolvedValue({ data: {} });
      vi.mocked(api.post).mockResolvedValue({ data: {} });
      
      renderModal();
      
      // Выбираем файл
      const file = new File(['fake'], 'photo.jpg', { type: 'image/jpeg' });
      const photoInput = screen.getByLabelText('Изменить фото:');
      fireEvent.change(photoInput, { target: { files: [file] } });
      
      const submitBtn = screen.getByRole('button', { name: 'Сохранить изменения' });
      fireEvent.click(submitBtn);
      
      await waitFor(() => {
        expect(api.patch).toHaveBeenCalled();
        expect(api.post).toHaveBeenCalledWith(
          '/trainees/1/photo',
          expect.any(FormData),
          expect.objectContaining({
            headers: { 'Content-Type': 'multipart/form-data' }
          })
        );
      });
    });

    it('показывает ошибку при неудачном обновлении', async () => {
      //  Исправляем синтаксис ошибки
      vi.mocked(api.patch).mockRejectedValue({
        response: { data: { detail: 'Ошибка сервера' } }
      });
      
      renderModal();
      
      const submitBtn = screen.getByRole('button', { name: 'Сохранить изменения' });
      fireEvent.click(submitBtn);
      
      await waitFor(() => {
        expect(screen.getByText('Ошибка сервера')).toBeInTheDocument();
        expect(mockOnSaved).not.toHaveBeenCalled();
        expect(mockOnClose).not.toHaveBeenCalled();
      });
    });
  });

  describe('Закрытие модального окна', () => {
    it('вызывает onClose при клике на фон', () => {
      renderModal();
      
      // Ищем overlay по классу или data-testid
      const overlay = document.querySelector('.overlay');
      if (overlay) {
        fireEvent.click(overlay);
        expect(mockOnClose).toHaveBeenCalled();
      }
    });

    it('не закрывает при клике внутри модального окна', () => {
      renderModal();
      
      const modal = document.querySelector('.modal');
      if (modal) {
        fireEvent.click(modal);
        expect(mockOnClose).not.toHaveBeenCalled();
      }
    });

    it('кнопка Отмена вызывает onClose', () => {
      renderModal();
      
      const cancelBtn = screen.getByRole('button', { name: 'Отмена' });
      fireEvent.click(cancelBtn);
      
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('кнопки отключены во время загрузки', async () => {
      // Мокаем долгий запрос
      vi.mocked(api.patch).mockImplementation(() => new Promise(() => {}));
      
      renderModal();
      
      const submitBtn = screen.getByRole('button', { name: 'Сохранить изменения' });
      fireEvent.click(submitBtn);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Отмена' })).toBeDisabled();
        expect(screen.getByRole('button', { name: 'Сохранить изменения' })).toBeDisabled();
      });
    });
  });

  describe('Загрузка фото', () => {
    it('загружает URL фото если есть photo_path', async () => {
      // Исправляем синтаксис mockResolvedValue
      vi.mocked(api.get).mockResolvedValue({ 
        data: { photo_url: 'http://example.com/photo.jpg' } 
      });
      
      renderModal({ photo_path: 'trainees/photo.jpg' });
      
      await waitFor(() => {
        expect(api.get).toHaveBeenCalledWith('/trainees/1/photo-url');
        const img = screen.getByAltText('current photo');
        expect(img).toHaveAttribute('src', 'http://example.com/photo.jpg');
      });
    });

    it('показывает заглушку если фото не загрузилось', async () => {
      vi.mocked(api.get).mockRejectedValue(new Error('Not found'));
      
      renderModal({ photo_path: 'trainees/photo.jpg' });
      
      await waitFor(() => {
        const img = screen.getByAltText('no photo');
        expect(img).toBeInTheDocument();
      });
    });

    it('обрабатывает ошибку загрузки изображения', async () => {
      vi.mocked(api.get).mockResolvedValue({ 
        data: { photo_url: 'http://example.com/photo.jpg' } 
      });
      
      renderModal({ photo_path: 'trainees/photo.jpg' });
      
      // Симулируем ошибку загрузки картинки
      const img = await screen.findByAltText('current photo');
      fireEvent.error(img);
      
      // Должна подгрузиться заглушка
      waitFor(() => {
        const img = screen.getByAltText('current photo');
        expect(img).toHaveAttribute('src', expect.stringContaining('pfp.jpg'));
      });
    });
  });
});