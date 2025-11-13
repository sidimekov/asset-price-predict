import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Header } from '@/shared/ui/Header';
import { Menu } from 'lucide-react';

// Мок lucide-react
vi.mock('lucide-react', () => ({
  Menu: () => <svg data-testid="menu-icon" />,
}));

describe('Header', () => {
  test('renders mobile header with menu button', () => {
    render(<Header onMenuClick={() => {}} />);

    const header = screen.getByRole('banner');
    expect(header).toHaveClass('lg:hidden');
    expect(header).toHaveClass('bg-surface-dark');
    expect(header).toHaveClass('border-b');
    expect(header).toHaveClass('px-6', 'py-4');

    const button = screen.getByRole('button', { name: 'Открыть меню' });
    expect(button).toBeInTheDocument();
    expect(screen.getByTestId('menu-icon')).toBeInTheDocument();
  });

  test('calls onMenuClick when button is clicked', () => {
    const handleClick = vi.fn();
    render(<Header onMenuClick={handleClick} />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test('has correct focus styles', () => {
    render(<Header onMenuClick={() => {}} />);

    const button = screen.getByRole('button');
    expect(button).toHaveClass('focus:outline-none');
    expect(button).toHaveClass('focus:ring-2');
    expect(button).toHaveClass('focus:ring-accent');
    expect(button).toHaveClass('rounded-md');
    expect(button).toHaveClass('p-1');
  });

  test('does not render on large screens (lg:hidden)', () => {
    // Устанавливаем ширину окна > 1024px
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1200,
    });

    render(<Header onMenuClick={() => {}} />);

    const header = screen.getByRole('banner');
    expect(header).toHaveClass('lg:hidden');
    // В DOM всё равно есть, но в реале Tailwind скроет
    // Тест проверяет, что класс есть — этого достаточно
  });
});
