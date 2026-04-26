import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TraineeCard from './TraineeCard';

// ✅ Импортируем или определяем тип пропсов компонента
interface TraineeCardProps {
  id: number;
  name: string;
  date: string;
  isNew?: boolean;
  onRemove?: (id: number) => void;
}

describe('TraineeCard', () => {
  // ✅ Типизируем mockProps
  const mockProps: Omit<TraineeCardProps, 'onRemove'> = {
    id: 1,
    name: 'Иван Иванов',
    date: '01.05.2026',
  };

  it('рендерит имя и дату трейни', () => {
    render(<TraineeCard {...mockProps} />);
    
    expect(screen.getByText('Иван Иванов')).toBeInTheDocument();
    expect(screen.getByText('01.05.2026')).toBeInTheDocument();
  });

  it('не показывает кнопку удаления если onRemove не передан', () => {
    render(<TraineeCard {...mockProps} />);
    
    expect(screen.queryByRole('button', { name: /удалить/i })).not.toBeInTheDocument();
  });

  it('показывает кнопку удаления если onRemove передан', () => {
    // ✅ Типизируем моковую функцию
    const handleRemove = vi.fn<(id: number) => void>();
    render(<TraineeCard {...mockProps} onRemove={handleRemove} />);
    
    const button = screen.getByRole('button', { name: /удалить тренирующегося Иван Иванов/i });
    expect(button).toBeInTheDocument();
  });

  it('кнопка удаления не видна по умолчанию', () => {
    const handleRemove = vi.fn<(id: number) => void>();
    render(<TraineeCard {...mockProps} onRemove={handleRemove} />);
    
    const button = screen.getByRole('button', { name: /удалить тренирующегося Иван Иванов/i });
    expect(button.className).not.toContain('visible');
  });

  it('кнопка удаления становится видимой при наведении', () => {
    const handleRemove = vi.fn<(id: number) => void>();
    render(<TraineeCard {...mockProps} onRemove={handleRemove} />);
    
    const article = screen.getByRole('article');
    fireEvent.mouseEnter(article);
    
    const button = screen.getByRole('button', { name: /удалить тренирующегося Иван Иванов/i });
    expect(button.className).toContain('visible');
  });

  it('кнопка удаления скрывается при уходе мыши', () => {
    const handleRemove = vi.fn<(id: number) => void>();
    render(<TraineeCard {...mockProps} onRemove={handleRemove} />);
    
    const article = screen.getByRole('article');
    fireEvent.mouseEnter(article);
    fireEvent.mouseLeave(article);
    
    const button = screen.getByRole('button', { name: /удалить тренирующегося Иван Иванов/i });
    expect(button.className).not.toContain('visible');
  });

  it('вызывает onRemove при клике на кнопку удаления', () => {
    const handleRemove = vi.fn<(id: number) => void>();
    render(<TraineeCard {...mockProps} onRemove={handleRemove} />);
    
    const button = screen.getByRole('button', { name: /удалить тренирующегося Иван Иванов/i });
    fireEvent.click(button);
    
    expect(handleRemove).toHaveBeenCalledTimes(1);
    expect(handleRemove).toHaveBeenCalledWith(1);
  });

  it('клик по кнопке не всплывает на карточку', () => {
    const handleRemove = vi.fn<(id: number) => void>();
    const handleCardClick = vi.fn<React.MouseEventHandler<HTMLDivElement>>();
    
    render(
      <div onClick={handleCardClick} data-testid="card-wrapper">
        <TraineeCard {...mockProps} onRemove={handleRemove} />
      </div>
    );
    
    const button = screen.getByRole('button', { name: /удалить тренирующегося Иван Иванов/i });
    fireEvent.click(button);
    
    expect(handleRemove).toHaveBeenCalled();
    expect(handleCardClick).not.toHaveBeenCalled();
  });

  it('применяет анимацию если isNew=true', () => {
    render(<TraineeCard {...mockProps} isNew={true} />);
    
    const article = screen.getByRole('article');
    expect(article.className).toContain('animated');
  });

  it('не применяет анимацию если isNew=false', () => {
    render(<TraineeCard {...mockProps} isNew={false} />);
    
    const article = screen.getByRole('article');
    expect(article.className).not.toContain('animated');
  });
});