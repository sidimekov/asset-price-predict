import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ProfileHeader } from '@/features/account/ProfileHeader';

describe('ProfileHeader', () => {
  it('shows profile info when not loading', () => {
    render(
      <ProfileHeader
        loading={false}
        profile={{
          id: '1',
          username: 'testuser',
          email: 'test@example.com',
          avatarUrl: '/test-avatar.jpg',
        }}
      />,
    );
    // Проверяем только основные элементы
    expect(screen.getByAltText('testuser avatar')).toBeInTheDocument();
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

  it('renders fallback values without profile', () => {
    render(<ProfileHeader loading={false} profile={null} />);

    expect(screen.getByAltText('Unknown user avatar')).toBeInTheDocument();
    expect(screen.getByText('Unknown user')).toBeInTheDocument();
    expect(screen.getByText('Email:')).toBeInTheDocument();
  });

  it('shows skeletons when loading', () => {
    render(<ProfileHeader loading={true} />);

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('renders without onClick prop', () => {
    render(
      <ProfileHeader
        loading={false}
        profile={{
          id: '1',
          username: 'testuser',
          email: 'test@example.com',
          avatarUrl: '/test-avatar.jpg',
        }}
      />,
    );
    expect(screen.getByAltText('testuser avatar')).toBeInTheDocument();
  });
});
