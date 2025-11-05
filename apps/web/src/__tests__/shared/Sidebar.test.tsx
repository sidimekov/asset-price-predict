import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Sidebar } from '@/shared/sidebar/Sidebar';

// Мокаем usePathname
vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
}));

// Мокаем профиль
vi.mock('@/mocks/profile.json', () => ({
  default: {
    avatarUrl: '/avatar.jpg',
    username: 'John Doe',
    login: 'john@example.com',
  },
}));

describe('Sidebar', () => {
  it('renders logo, profile and navigation', () => {
    render(<Sidebar />);

    // Логотип
    expect(screen.getByText('Asset')).toBeInTheDocument();
    expect(screen.getByText('Predict')).toBeInTheDocument();

    // Профиль
    expect(screen.getByAltText('John Doe avatar')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();

    // Навигация
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('History')).toBeInTheDocument();
    expect(screen.getByText('Account Settings')).toBeInTheDocument();

    // Активная ссылка
    const dashboardLink = screen.getByText('Dashboard').closest('a');
    expect(dashboardLink).toHaveClass('active');
  });
});
