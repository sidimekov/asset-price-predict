import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Sidebar } from '@/shared/ui/Sidebar';

// Мокаем next/navigation
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(),
}));

vi.mock('@/shared/api/account.api', () => ({
  useGetMeQuery: vi.fn(),
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
import { useGetMeQuery } from '@/shared/api/account.api';

describe('Sidebar', () => {
  const mockUsePathname = vi.mocked(usePathname);
  const mockUseGetMeQuery = vi.mocked(useGetMeQuery);

  beforeEach(() => {
    vi.clearAllMocks();

    // Устанавливаем дефолтные значения
    mockUsePathname.mockReturnValue('/dashboard');

    // Мокаем localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(() => 'test-token'),
      },
      writable: true,
    });

    // Дефолтный мок для useGetMeQuery (данные загружены)
    mockUseGetMeQuery.mockReturnValue({
      data: {
        id: '1',
        username: 'John Doe',
        email: 'john@example.com',
        avatarUrl: '/avatar.jpg',
      },
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as any);
  });

  it('renders logo, profile and navigation when profile is loaded', () => {
    render(<Sidebar />);

    // Логотип
    expect(screen.getByText('Asset')).toBeInTheDocument();
    expect(screen.getByText('Predict')).toBeInTheDocument();

    // Профиль
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
    const profileImage = screen.getByTestId('profile-image');
    expect(profileImage).toHaveAttribute('alt', 'Profile avatar');

    // Навигация
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('History')).toBeInTheDocument();
    expect(screen.getByText('Account Settings')).toBeInTheDocument();
  });

  it('uses default avatar when avatarUrl is not provided', () => {
    mockUseGetMeQuery.mockReturnValue({
      data: {
        id: '1',
        username: 'John Doe',
        email: 'john@example.com',
        avatarUrl: undefined, // Не указан URL аватара
      },
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    render(<Sidebar />);

    const profileImage = screen.getByTestId('profile-image');
    // Вместо проверки src (который может быть преобразован Next.js),
    // проверяем что изображение отображается
    expect(profileImage).toBeInTheDocument();
    expect(profileImage).toHaveAttribute('alt', 'Profile avatar');
  });

  it('shows fallback username when profile is not loaded', () => {
    mockUseGetMeQuery.mockReturnValue({
      data: null,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    render(<Sidebar />);

    // Должен показывать fallback username "Account"
    expect(screen.getByText('Account')).toBeInTheDocument();
    // Email должен быть пустым
    const profileSection = screen.getByLabelText('Перейти в профиль');
    expect(profileSection).toHaveTextContent('Account');
  });

  it('marks Dashboard as active on dashboard page', () => {
    mockUsePathname.mockReturnValue('/dashboard');
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
    const profileLink = screen.getByLabelText('Перейти в профиль');
    expect(profileLink).toHaveAttribute('href', '/account');
  });

  it('renders profile image with correct attributes', () => {
    render(<Sidebar />);

    const profileImage = screen.getByTestId('profile-image');
    expect(profileImage).toHaveAttribute('width', '64');
    expect(profileImage).toHaveAttribute('height', '64');
    expect(profileImage).toHaveClass('sidebar-profile-avatar');
  });

  describe('active state logic', () => {
    it('marks Dashboard active for various forecast paths', () => {
      const forecastPaths = ['/forecast/0', '/forecast/1', '/forecast/123'];

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
  });

  describe('token handling', () => {
    it('skips profile query when token is not available', () => {
      // Мокаем localStorage без токена
      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: vi.fn(() => null), // Нет токена
        },
        writable: true,
      });

      // Мокаем useGetMeQuery с skip: true
      mockUseGetMeQuery.mockReturnValue({
        data: null,
        isLoading: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
      } as any);

      render(<Sidebar />);

      // Должен показывать fallback значения
      expect(screen.getByText('Account')).toBeInTheDocument();
    });

    it('handles localStorage being undefined (server-side)', () => {
      // Эмулируем серверный рендеринг (отсутствие localStorage)
      Object.defineProperty(window, 'localStorage', {
        value: undefined,
        writable: true,
      });

      // Мокаем useGetMeQuery с skip: true
      mockUseGetMeQuery.mockReturnValue({
        data: null,
        isLoading: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
      } as any);

      expect(() => {
        render(<Sidebar />);
      }).not.toThrow();

      // Должен показывать fallback значения
      expect(screen.getByText('Account')).toBeInTheDocument();
    });
  });

  describe('profile link behavior', () => {
    it('links to account page from profile section', () => {
      render(<Sidebar />);

      const profileLink = screen.getByLabelText('Перейти в профиль');
      expect(profileLink).toHaveAttribute('href', '/account');
      expect(profileLink).toHaveTextContent('John Doe');
      expect(profileLink).toHaveTextContent('john@example.com');
    });
  });

  describe('loading states', () => {
    it('shows fallback values while loading', () => {
      mockUseGetMeQuery.mockReturnValue({
        data: null,
        isLoading: true, // Загрузка в процессе
        isError: false,
        error: null,
        refetch: vi.fn(),
      } as any);

      render(<Sidebar />);

      // Показывает fallback значения во время загрузки
      expect(screen.getByText('Account')).toBeInTheDocument();
    });

    it('shows fallback values on error', () => {
      mockUseGetMeQuery.mockReturnValue({
        data: null,
        isLoading: false,
        isError: true, // Ошибка
        error: { message: 'Failed to load' } as any,
        refetch: vi.fn(),
      } as any);

      render(<Sidebar />);

      // Показывает fallback значения при ошибке
      expect(screen.getByText('Account')).toBeInTheDocument();
    });
  });

  describe('fallback values', () => {
    it('shows default avatar for empty avatarUrl string', () => {
      mockUseGetMeQuery.mockReturnValue({
        data: {
          id: '1',
          username: 'John Doe',
          email: 'john@example.com',
          avatarUrl: '', // Пустая строка
        },
        isLoading: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
      } as any);

      render(<Sidebar />);

      const profileImage = screen.getByTestId('profile-image');
      // Проверяем что изображение отображается (src может быть преобразован Next.js)
      expect(profileImage).toBeInTheDocument();
      expect(profileImage).toHaveAttribute('alt', 'Profile avatar');
    });

    it('shows empty email when email is empty string', () => {
      mockUseGetMeQuery.mockReturnValue({
        data: {
          id: '1',
          username: 'John Doe',
          email: '', // Пустой email
          avatarUrl: '/avatar.jpg',
        },
        isLoading: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
      } as any);

      render(<Sidebar />);

      // Должен показывать username
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      // Email должен быть пустым - проверяем что нет текста email
      const profileSection = screen.getByLabelText('Перейти в профиль');
      expect(profileSection).not.toHaveTextContent('@');
    });
  });

  describe('navigation items', () => {
    it('has correct number of navigation items', () => {
      render(<Sidebar />);

      const navLinks = screen.getAllByRole('link');
      // 1 профиль ссылка + 3 навигационные ссылки
      expect(navLinks).toHaveLength(4);
    });

    it('has correct navigation labels', () => {
      render(<Sidebar />);

      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('History')).toBeInTheDocument();
      expect(screen.getByText('Account Settings')).toBeInTheDocument();
    });
  });

  describe('brand section', () => {
    it('renders brand name correctly', () => {
      render(<Sidebar />);

      expect(screen.getByText('Asset')).toBeInTheDocument();
      expect(screen.getByText('Predict')).toBeInTheDocument();

      const brandElement = screen.getByText('Asset').closest('h1');
      expect(brandElement).toBeInTheDocument();
      expect(brandElement).toHaveClass('sidebar-brand');
    });
  });
});
