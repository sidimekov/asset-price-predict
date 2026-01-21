import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ProfileHeader } from '@/features/account/ProfileHeader';

// Мок-профиль для тестов
const mockProfile = {
  username: 'testuser',
  email: 'test@example.com',
  avatarUrl: '/test-avatar.jpg',
};

describe('ProfileHeader', () => {
  it('shows profile info when not loading', () => {
    render(<ProfileHeader loading={false} profile={mockProfile} />);

    // Проверяем что аватар отображается с правильным alt
    const avatar = screen.getByAltText('Profile avatar');
    expect(avatar).toBeInTheDocument();

    // Проверяем имя пользователя
    expect(screen.getByText(/Username:/)).toBeInTheDocument();
    expect(screen.getByText('testuser')).toBeInTheDocument();

    // Проверяем email
    const emailElement = screen.getByText(/Email:/);
    expect(emailElement.textContent).toContain('test@example.com');
  });

  it('uses fallback avatar when avatarUrl is not provided', () => {
    const profileWithoutAvatar = {
      ...mockProfile,
      avatarUrl: undefined,
    };

    render(<ProfileHeader profile={profileWithoutAvatar} loading={false} />);

    // Проверяем что аватар отображается
    const avatar = screen.getByAltText('Profile avatar');
    expect(avatar).toBeInTheDocument();
  });

  it('uses fallback avatar when avatarUrl is empty string', () => {
    const profileWithEmptyAvatar = {
      ...mockProfile,
      avatarUrl: '',
    };

    render(<ProfileHeader profile={profileWithEmptyAvatar} loading={false} />);

    // Проверяем что аватар отображается
    const avatar = screen.getByAltText('Profile avatar');
    expect(avatar).toBeInTheDocument();
  });

  it('renders fallback values without username and email', () => {
    const profileWithoutInfo = {
      username: undefined,
      email: undefined,
      avatarUrl: '/test-avatar.jpg',
    };

    render(<ProfileHeader loading={false} profile={profileWithoutInfo} />);

    // Проверяем fallback значения для username (в span)
    const usernameSpans = screen.getAllByText('—', { selector: 'span' });
    expect(usernameSpans.length).toBe(1);

    // Проверяем fallback значения для email
    const emailElement = screen.getByText(/Email:/);
    expect(emailElement.textContent).toContain('—');
  });

  it('shows skeleton when loading', () => {
    render(<ProfileHeader loading={true} profile={mockProfile} />);

    // Проверяем что аватар не отображается
    expect(screen.queryByAltText('Profile avatar')).not.toBeInTheDocument();

    // Проверяем что текст пользователя не отображается
    expect(screen.queryByText('testuser')).not.toBeInTheDocument();
  });

  it('calls onClick handler when clicked', () => {
    const handleClick = vi.fn();

    render(
      <ProfileHeader
        loading={false}
        profile={mockProfile}
        onClick={handleClick}
      />,
    );

    // Кликаем на компонент
    fireEvent.click(screen.getByRole('button'));

    // Проверяем что обработчик был вызван
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('has proper accessibility attributes when onClick is provided', () => {
    const handleClick = vi.fn();

    render(
      <ProfileHeader
        loading={false}
        profile={mockProfile}
        onClick={handleClick}
      />,
    );

    const container = screen.getByRole('button');
    expect(container).toHaveAttribute('tabIndex', '0');
    expect(container).toHaveClass('cursor-pointer');
  });

  it('renders as button when onClick is provided', () => {
    const handleClick = vi.fn();

    render(
      <ProfileHeader
        loading={false}
        profile={mockProfile}
        onClick={handleClick}
      />,
    );

    // Проверяем что есть role="button" когда onClick передан
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('renders with correct image attributes', () => {
    render(<ProfileHeader loading={false} profile={mockProfile} />);

    const avatar = screen.getByAltText('Profile avatar');
    expect(avatar).toHaveAttribute('width', '100');
    expect(avatar).toHaveAttribute('height', '100');
    expect(avatar).toHaveClass('profile-avatar', 'rounded-full');
  });

  it('handles profile with only username', () => {
    const profileWithOnlyUsername = {
      username: 'onlyname',
      email: undefined,
      avatarUrl: undefined,
    };

    render(<ProfileHeader loading={false} profile={profileWithOnlyUsername} />);

    expect(screen.getByText('onlyname')).toBeInTheDocument();

    // Проверяем email с дефисом
    const emailElement = screen.getByText(/Email:/);
    expect(emailElement.textContent).toContain('—');
  });

  it('handles profile with only email', () => {
    const profileWithOnlyEmail = {
      username: undefined,
      email: 'only@email.com',
      avatarUrl: undefined,
    };

    render(<ProfileHeader loading={false} profile={profileWithOnlyEmail} />);

    // Проверяем username с дефисом в span
    const usernameSpans = screen.getAllByText('—', { selector: 'span' });
    expect(usernameSpans.length).toBe(1);

    // Проверяем email
    const emailElement = screen.getByText(/Email:/);
    expect(emailElement.textContent).toContain('only@email.com');
  });

  it('always has cursor-pointer class', () => {
    // С onClick
    const { rerender } = render(
      <ProfileHeader
        loading={false}
        profile={mockProfile}
        onClick={() => {}}
      />,
    );

    let container = screen.getByRole('button');
    expect(container).toHaveClass('cursor-pointer');

    // Без onClick
    rerender(<ProfileHeader loading={false} profile={mockProfile} />);

    // Компонент всегда рендерит контейнер с классом cursor-pointer
    container = screen.getByRole('button');
    expect(container).toHaveClass('cursor-pointer');
  });

  it('has role button by default', () => {
    render(<ProfileHeader loading={false} profile={mockProfile} />);

    // Компонент всегда рендерит role="button" независимо от onClick
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('renders without crashing when profile is empty', () => {
    const emptyProfile = {
      username: undefined,
      email: undefined,
      avatarUrl: undefined,
    };

    render(<ProfileHeader loading={false} profile={emptyProfile} />);

    // Просто проверяем что компонент отрендерился без ошибок
    expect(screen.getByAltText('Profile avatar')).toBeInTheDocument();
  });
});
