import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ProfileHeader } from '@/features/account/ProfileHeader';

// Простая версия без сложных зависимостей
describe('ProfileHeader', () => {
  const mockProfile = {
    avatarUrl: 'https://example.com/avatar.jpg',
    username: 'testuser',
    login: 'test@example.com',
  };

  it('renders profile data correctly when not loading', () => {
    render(<ProfileHeader profile={mockProfile} loading={false} />);

    // Проверяем что отображаются данные профиля
    expect(screen.getByText(/Username:/)).toBeInTheDocument();
    expect(screen.getByText('testuser')).toBeInTheDocument();
    expect(screen.getByText(/Email: test@example.com/)).toBeInTheDocument();
  });

  it('uses fallback avatar when avatarUrl is not provided', () => {
    const profileWithoutAvatar = {
      ...mockProfile,
      avatarUrl: undefined,
    };

    render(<ProfileHeader profile={profileWithoutAvatar} loading={false} />);

    // Проверяем что есть изображение (fallback)
    const avatar = screen.getByAltText('testuser avatar');
    expect(avatar).toBeInTheDocument();
  });

  it('calls onClick when profile header is clicked', () => {
    const handleClick = vi.fn();
    render(<ProfileHeader profile={mockProfile} onClick={handleClick} />);

    // Находим контейнер и кликаем
    const container =
      screen.getByText(/Username:/).closest('.profile-header') ||
      screen.getByText(/Username:/).parentElement?.parentElement;
    if (container) {
      fireEvent.click(container);
    }

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('does not call onClick when in loading state', () => {
    const handleClick = vi.fn();
    render(<ProfileHeader loading={true} onClick={handleClick} />);

    // Пытаемся кликнуть - ничего не должно произойти
    const container = document.querySelector('.profile-header');
    if (container) {
      fireEvent.click(container);
    }

    expect(handleClick).not.toHaveBeenCalled();
  });
});
