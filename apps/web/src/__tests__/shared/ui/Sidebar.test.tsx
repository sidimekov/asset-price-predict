import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Sidebar } from '@/shared/ui/Sidebar';

// Мокаем next/navigation
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(),
}));

// Мокаем профиль
vi.mock('@/mocks/profile.json', () => ({
  default: {
    username: 'John Doe',
    login: 'john@example.com',
    avatarUrl: '/avatar.jpg',
  },
}));

// Мокаем next/image
vi.mock('next/image', () => ({
  default: ({ src, alt, width, height, className }: any) => (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      data-testid="profile-image"
    />
  ),
}));

import { usePathname } from 'next/navigation';

describe('Sidebar', () => {
  const mockUsePathname = vi.mocked(usePathname);

  beforeEach(() => {
    vi.clearAllMocks();
    // Устанавливаем дефолтное значение
    mockUsePathname.mockReturnValue('/dashboard');
  });

  it('renders logo, profile and navigation', () => {
    render(<Sidebar />);

    // Логотип
    expect(screen.getByText('Asset')).toBeInTheDocument();
    expect(screen.getByText('Predict')).toBeInTheDocument();

    // Профиль
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
    expect(screen.getByTestId('profile-image')).toHaveAttribute(
      'src',
      '/avatar.jpg',
    );

    // Навигация
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('History')).toBeInTheDocument();
    expect(screen.getByText('Account Settings')).toBeInTheDocument();
  });

  it('marks Dashboard as active on dashboard page', () => {
    render(<Sidebar />);

    const dashboardLink = screen.getByText('Dashboard').closest('a');
    expect(dashboardLink).toHaveClass('active');
    expect(dashboardLink).toHaveAttribute('aria-current', 'page');

    const historyLink = screen.getByText('History').closest('a');
    expect(historyLink).not.toHaveClass('active');
    expect(historyLink).not.toHaveAttribute('aria-current');

    const accountLink = screen.getByText('Account Settings').closest('a');
    expect(accountLink).not.toHaveClass('active');
    expect(accountLink).not.toHaveAttribute('aria-current');
  });

  it('marks Dashboard as active on forecast pages', () => {
    mockUsePathname.mockReturnValue('/forecast/0');
    render(<Sidebar />);

    const dashboardLink = screen.getByText('Dashboard').closest('a');
    expect(dashboardLink).toHaveClass('active');
    expect(dashboardLink).toHaveAttribute('aria-current', 'page');

    const historyLink = screen.getByText('History').closest('a');
    expect(historyLink).not.toHaveClass('active');
  });

  it('marks History as active on history page', () => {
    mockUsePathname.mockReturnValue('/history');
    render(<Sidebar />);

    const historyLink = screen.getByText('History').closest('a');
    expect(historyLink).toHaveClass('active');
    expect(historyLink).toHaveAttribute('aria-current', 'page');

    const dashboardLink = screen.getByText('Dashboard').closest('a');
    expect(dashboardLink).not.toHaveClass('active');
  });

  it('marks Account Settings as active on account page', () => {
    mockUsePathname.mockReturnValue('/account');
    render(<Sidebar />);

    const accountLink = screen.getByText('Account Settings').closest('a');
    expect(accountLink).toHaveClass('active');
    expect(accountLink).toHaveAttribute('aria-current', 'page');

    const dashboardLink = screen.getByText('Dashboard').closest('a');
    expect(dashboardLink).not.toHaveClass('active');
  });

  it('has correct links and aria labels', () => {
    render(<Sidebar />);

    // Проверяем ссылки
    expect(screen.getByText('Dashboard').closest('a')).toHaveAttribute(
      'href',
      '/dashboard',
    );
    expect(screen.getByText('History').closest('a')).toHaveAttribute(
      'href',
      '/history',
    );
    expect(screen.getByText('Account Settings').closest('a')).toHaveAttribute(
      'href',
      '/account',
    );

    // Проверяем профиль ссылку
    const profileLink = screen.getByText('John Doe').closest('a');
    expect(profileLink).toHaveAttribute('href', '/account');
    expect(profileLink).toHaveAttribute('aria-label', 'Перейти в профиль');
  });

  it('renders profile image with correct attributes', () => {
    render(<Sidebar />);

    const profileImage = screen.getByTestId('profile-image');
    expect(profileImage).toHaveAttribute('src', '/avatar.jpg');
    expect(profileImage).toHaveAttribute('width', '64');
    expect(profileImage).toHaveAttribute('height', '64');
    expect(profileImage).toHaveClass('sidebar-profile-avatar');
  });

  describe('active state logic', () => {
    it('marks Dashboard active for various forecast paths', () => {
      const forecastPaths = [
        '/forecast/0',
        '/forecast/1',
        '/forecast/123',
        '/forecast/0?ticker=BTCUSDT',
      ];

      forecastPaths.forEach((path) => {
        mockUsePathname.mockReturnValue(path);
        const { unmount } = render(<Sidebar />);

        const dashboardLink = screen.getByText('Dashboard').closest('a');
        expect(dashboardLink).toHaveClass('active');

        unmount();
      });
    });

    it('does not mark Dashboard active for non-matching paths', () => {
      const nonDashboardPaths = ['/history', '/account', '/settings', '/other'];

      nonDashboardPaths.forEach((path) => {
        mockUsePathname.mockReturnValue(path);
        const { unmount } = render(<Sidebar />);

        const dashboardLink = screen.getByText('Dashboard').closest('a');
        expect(dashboardLink).not.toHaveClass('active');

        unmount();
      });
    });

    it('handles null pathname gracefully', () => {
      // @ts-ignore - testing null pathname
      mockUsePathname.mockReturnValue(null);

      expect(() => {
        render(<Sidebar />);
      }).not.toThrow();

      // Проверяем что навигация отображается
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('History')).toBeInTheDocument();

      // При null pathname все ссылки должны быть неактивны
      const dashboardLink = screen.getByText('Dashboard').closest('a');
      expect(dashboardLink).not.toHaveClass('active');
    });

    it('handles undefined pathname gracefully', () => {
      // @ts-ignore - testing undefined pathname
      mockUsePathname.mockReturnValue(undefined);

      expect(() => {
        render(<Sidebar />);
      }).not.toThrow();

      // Проверяем что навигация отображается
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('History')).toBeInTheDocument();

      // При undefined pathname все ссылки должны быть неактивны
      const dashboardLink = screen.getByText('Dashboard').closest('a');
      expect(dashboardLink).not.toHaveClass('active');
    });
  });

  describe('accessibility', () => {
    it('has proper ARIA attributes for navigation', () => {
      render(<Sidebar />);

      const nav = screen.getByLabelText('Основная навигация');
      expect(nav).toBeInTheDocument();
      expect(nav).toHaveAttribute('role', 'navigation');

      const sidebar = screen.getByLabelText('Боковая панель');
      expect(sidebar).toBeInTheDocument();
      expect(sidebar).toHaveAttribute('role', 'complementary');
    });

    it('has proper ARIA current for active links', () => {
      mockUsePathname.mockReturnValue('/dashboard');
      render(<Sidebar />);

      const activeLink = screen.getByText('Dashboard').closest('a');
      expect(activeLink).toHaveAttribute('aria-current', 'page');

      const inactiveLinks = [
        screen.getByText('History').closest('a'),
        screen.getByText('Account Settings').closest('a'),
      ];

      inactiveLinks.forEach((link) => {
        expect(link).not.toHaveAttribute('aria-current');
      });
    });

    it('has proper ARIA attributes for tabs', () => {
      render(<Sidebar />);

      const nav = screen.getByLabelText('Основная навигация');
      expect(nav).toHaveAttribute('role', 'navigation');

      const sidebar = screen.getByLabelText('Боковая панель');
      expect(sidebar).toHaveAttribute('role', 'complementary');
    });
  });
});
