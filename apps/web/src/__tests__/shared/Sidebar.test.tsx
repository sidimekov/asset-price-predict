import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Sidebar } from '@/shared/ui/Sidebar';

// Мокаем профиль
vi.mock('@/mocks/profile.json', () => ({
  default: {
    username: 'John Doe',
    login: 'john@example.com',
    avatarUrl: '/avatar.jpg',
  },
}));

describe('Sidebar', () => {
  it('renders logo, profile and navigation', () => {
    render(<Sidebar />);

    // Логотип
    expect(screen.getByText('Asset')).toBeInTheDocument();
    expect(screen.getByText('Predict')).toBeInTheDocument();

    // Профиль
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();

    // Навигация
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('History')).toBeInTheDocument();
    expect(screen.getByText('Account Settings')).toBeInTheDocument();
  });
});
