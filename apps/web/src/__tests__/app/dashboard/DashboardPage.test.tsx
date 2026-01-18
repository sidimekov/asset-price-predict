import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Sidebar } from '@/shared/ui/Sidebar';

// Мокаем next/navigation
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(),
}));

vi.mock('@/shared/api/account.api', () => ({
  useGetMeQuery: () => ({
    data: {
      id: '1',
      username: 'John Doe',
      email: 'john@example.com',
      avatarUrl: '/avatar.jpg',
    },
  }),
}));

// Мокаем next/image
vi.mock('next/image', () => ({
  default: ({
    src,
    alt,
    width,
    height,
    className,
    onClick,
    onLoad,
    onError,
    ...props
  }: any) => (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      onClick={onClick}
      onLoad={onLoad}
      onError={onError}
      {...props}
    />
  ),
}));

// Мокаем next/link
vi.mock('next/link', () => ({
  default: ({ children, href, className, onClick, ...props }: any) => (
    <a
      href={href}
      className={className}
      onClick={(e) => {
        e.preventDefault();
        onClick?.(e);
      }}
      {...props}
    >
      {children}
    </a>
  ),
}));

import { usePathname } from 'next/navigation';

describe('Sidebar', () => {
  const mockUsePathname = vi.mocked(usePathname);

  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePathname.mockReturnValue('/dashboard');
    localStorage.setItem('auth.token', 'test-token');
  });

  describe('Basic Rendering', () => {
    it('renders all main components', () => {
      render(<Sidebar />);

      // Логотип
      expect(screen.getByText('Asset')).toBeInTheDocument();
      expect(screen.getByText('Predict')).toBeInTheDocument();

      // Профиль
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
      expect(screen.getByAltText('Profile avatar')).toBeInTheDocument();

      // Навигация
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('History')).toBeInTheDocument();
      expect(screen.getByText('Account Settings')).toBeInTheDocument();

      // Контейнеры и семантические элементы
      expect(
        screen.getByRole('complementary', { name: 'Боковая панель' }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('navigation', { name: 'Основная навигация' }),
      ).toBeInTheDocument();
    });

    it('renders with correct CSS classes', () => {
      const { container } = render(<Sidebar />);

      const sidebar = container.querySelector('.sidebar');
      expect(sidebar).toBeInTheDocument();
      expect(sidebar).toHaveClass('sidebar');

      const sidebarContent = container.querySelector('.sidebar-content');
      expect(sidebarContent).toBeInTheDocument();

      const sidebarBrand = container.querySelector('.sidebar-brand');
      expect(sidebarBrand).toBeInTheDocument();

      const sidebarProfile = container.querySelector('.sidebar-profile');
      expect(sidebarProfile).toBeInTheDocument();

      const sidebarNav = container.querySelector('.sidebar-nav');
      expect(sidebarNav).toBeInTheDocument();
    });

    it('renders logo with correct structure', () => {
      render(<Sidebar />);

      const brandElement = screen.getByRole('heading', { level: 1 });
      expect(brandElement).toHaveClass('sidebar-brand');
      expect(brandElement).toContainElement(screen.getByText('Asset'));
      expect(brandElement).toContainElement(screen.getByText('Predict'));
    });
  });

  describe('Profile Section', () => {
    it('renders profile with correct data', () => {
      render(<Sidebar />);

      const profileImage = screen.getByAltText('Profile avatar');
      expect(profileImage).toHaveAttribute('src', '/avatar.jpg');
      expect(profileImage).toHaveAttribute('alt', 'Profile avatar');
      expect(profileImage).toHaveAttribute('width', '64');
      expect(profileImage).toHaveAttribute('height', '64');
      expect(profileImage).toHaveClass('sidebar-profile-avatar');

      expect(screen.getByText('John Doe')).toHaveClass('sidebar-profile-name');
      expect(screen.getByText('john@example.com')).toHaveClass(
        'sidebar-profile-login',
      );
    });

    it('profile link has correct attributes', () => {
      render(<Sidebar />);

      const profileLink = screen.getByRole('link', {
        name: 'Перейти в профиль',
      });
      expect(profileLink).toHaveAttribute('href', '/account');
      expect(profileLink).toHaveClass('sidebar-profile');
    });

    it('handles profile image events', () => {
      render(<Sidebar />);

      const profileImage = screen.getByAltText('Profile avatar');

      // Симулируем события загрузки (должны работать без ошибок)
      fireEvent.load(profileImage);
      fireEvent.error(profileImage);
    });
  });

  describe('Navigation Logic', () => {
    it('marks Dashboard as active on dashboard page', () => {
      render(<Sidebar />);

      const dashboardLink = screen.getByRole('link', { name: 'Dashboard' });
      expect(dashboardLink).toHaveClass('active');
      expect(dashboardLink).toHaveAttribute('aria-current', 'page');

      const historyLink = screen.getByRole('link', { name: 'History' });
      expect(historyLink).not.toHaveClass('active');
      expect(historyLink).not.toHaveAttribute('aria-current');

      const accountLink = screen.getByRole('link', {
        name: 'Account Settings',
      });
      expect(accountLink).not.toHaveClass('active');
      expect(accountLink).not.toHaveAttribute('aria-current');
    });

    it('marks Dashboard as active on all forecast pages', () => {
      const forecastPaths = [
        '/forecast/0',
        '/forecast/1',
        '/forecast/123',
        '/forecast/0?ticker=BTCUSDT',
        '/forecast/1?ticker=ETHUSDT&timeframe=1h',
      ];

      forecastPaths.forEach((path) => {
        mockUsePathname.mockReturnValue(path);
        const { unmount } = render(<Sidebar />);

        const dashboardLink = screen.getByRole('link', { name: 'Dashboard' });
        expect(dashboardLink).toHaveClass('active');

        const historyLink = screen.getByRole('link', { name: 'History' });
        expect(historyLink).not.toHaveClass('active');

        unmount();
      });
    });

    it('marks History as active on history page', () => {
      mockUsePathname.mockReturnValue('/history');
      render(<Sidebar />);

      const historyLink = screen.getByRole('link', { name: 'History' });
      expect(historyLink).toHaveClass('active');
      expect(historyLink).toHaveAttribute('aria-current', 'page');

      const dashboardLink = screen.getByRole('link', { name: 'Dashboard' });
      expect(dashboardLink).not.toHaveClass('active');
    });

    it('marks Account Settings as active on account page', () => {
      mockUsePathname.mockReturnValue('/account');
      render(<Sidebar />);

      const accountLink = screen.getByRole('link', {
        name: 'Account Settings',
      });
      expect(accountLink).toHaveClass('active');
      expect(accountLink).toHaveAttribute('aria-current', 'page');

      const dashboardLink = screen.getByRole('link', { name: 'Dashboard' });
      expect(dashboardLink).not.toHaveClass('active');
    });
  });

  describe('Navigation Links', () => {
    it('has correct href attributes', () => {
      render(<Sidebar />);

      expect(screen.getByRole('link', { name: 'Dashboard' })).toHaveAttribute(
        'href',
        '/dashboard',
      );
      expect(screen.getByRole('link', { name: 'History' })).toHaveAttribute(
        'href',
        '/history',
      );
      expect(
        screen.getByRole('link', { name: 'Account Settings' }),
      ).toHaveAttribute('href', '/account');
    });

    it('navigation links have correct classes', () => {
      render(<Sidebar />);

      const navLinks = [
        screen.getByRole('link', { name: 'Dashboard' }),
        screen.getByRole('link', { name: 'History' }),
        screen.getByRole('link', { name: 'Account Settings' }),
      ];

      navLinks.forEach((link) => {
        expect(link).toHaveClass('sidebar-nav-link');
      });
    });

    it('handles click events on navigation links', () => {
      render(<Sidebar />);

      const dashboardLink = screen.getByRole('link', { name: 'Dashboard' });
      const historyLink = screen.getByRole('link', { name: 'History' });
      const accountLink = screen.getByRole('link', {
        name: 'Account Settings',
      });

      // Симулируем клики
      fireEvent.click(dashboardLink);
      fireEvent.click(historyLink);
      fireEvent.click(accountLink);

      // Проверяем что ссылки все еще существуют (не выброшены ошибки)
      expect(
        screen.getByRole('link', { name: 'Dashboard' }),
      ).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'History' })).toBeInTheDocument();
      expect(
        screen.getByRole('link', { name: 'Account Settings' }),
      ).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles null pathname gracefully', () => {
      // @ts-expect-error - testing null pathname
      mockUsePathname.mockReturnValue(null);

      expect(() => {
        render(<Sidebar />);
      }).not.toThrow();

      // Проверяем что все элементы отображаются
      expect(screen.getByRole('complementary')).toBeInTheDocument();
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('History')).toBeInTheDocument();
    });

    it('handles undefined pathname gracefully', () => {
      // @ts-expect-error - testing undefined pathname
      mockUsePathname.mockReturnValue(undefined);

      expect(() => {
        render(<Sidebar />);
      }).not.toThrow();

      expect(screen.getByRole('complementary')).toBeInTheDocument();
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    it('handles empty string pathname', () => {
      mockUsePathname.mockReturnValue('');

      expect(() => {
        render(<Sidebar />);
      }).not.toThrow();

      expect(screen.getByRole('complementary')).toBeInTheDocument();
    });

    it('handles unexpected path formats', () => {
      const unexpectedPaths = [
        '/unknown',
        '/dashboard/nested',
        '/history/archive',
        '/',
        '',
      ];

      unexpectedPaths.forEach((path) => {
        mockUsePathname.mockReturnValue(path);
        const { unmount } = render(<Sidebar />);

        // Проверяем что компонент не падает
        expect(screen.getByRole('complementary')).toBeInTheDocument();

        unmount();
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(<Sidebar />);

      const sidebar = screen.getByRole('complementary', {
        name: 'Боковая панель',
      });
      expect(sidebar).toBeInTheDocument();

      const navigation = screen.getByRole('navigation', {
        name: 'Основная навигация',
      });
      expect(navigation).toBeInTheDocument();

      const profileLink = screen.getByRole('link', {
        name: 'Перейти в профиль',
      });
      expect(profileLink).toBeInTheDocument();
    });

    it('has proper ARIA current for active states', () => {
      // Тестируем разные активные состояния
      const testCases = [
        { path: '/dashboard', linkName: 'Dashboard' },
        { path: '/history', linkName: 'History' },
        { path: '/account', linkName: 'Account Settings' },
      ];

      testCases.forEach(({ path, linkName }) => {
        mockUsePathname.mockReturnValue(path);
        const { unmount } = render(<Sidebar />);

        const activeLink = screen.getByRole('link', { name: linkName });
        expect(activeLink).toHaveAttribute('aria-current', 'page');

        // Проверяем что другие ссылки не имеют aria-current
        const otherLinks = ['Dashboard', 'History', 'Account Settings'].filter(
          (name) => name !== linkName,
        );
        otherLinks.forEach((name) => {
          const link = screen.getByRole('link', { name });
          expect(link).not.toHaveAttribute('aria-current');
        });

        unmount();
      });
    });

    it('has proper semantic HTML structure', () => {
      const { container } = render(<Sidebar />);

      // Проверяем семантическую структуру
      const aside = container.querySelector('aside');
      expect(aside).toBeInTheDocument();
      expect(aside).toHaveAttribute('role', 'complementary');

      const nav = container.querySelector('nav');
      expect(nav).toBeInTheDocument();
      expect(nav).toHaveAttribute('role', 'navigation');

      const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
      expect(headings.length).toBeGreaterThan(0);
    });
  });

  describe('Performance and SEO', () => {
    it('has proper image optimization attributes', () => {
      render(<Sidebar />);

      const profileImage = screen.getByAltText('Profile avatar');
      expect(profileImage).toHaveAttribute('width', '64');
      expect(profileImage).toHaveAttribute('height', '64');
      expect(profileImage).toHaveAttribute('alt', 'Profile avatar');
    });

    it('logo has proper structure', () => {
      render(<Sidebar />);

      const brandElement = screen.getByRole('heading', { level: 1 });
      expect(brandElement).toBeInTheDocument();

      const brandGradient = document.querySelector('.brand-gradient');
      expect(brandGradient).toContainHTML('Asset');

      const textInk = document.querySelector('.text-ink');
      expect(textInk).toContainHTML('Predict');
    });
  });

  describe('Responsive Behavior', () => {
    it('has responsive CSS classes', () => {
      const { container } = render(<Sidebar />);

      const sidebar = container.querySelector('.sidebar');
      expect(sidebar).toHaveClass(/sidebar/);

      // Проверяем наличие основных классов
      expect(sidebar).toHaveClass('sidebar');
    });
  });

  describe('Integration Tests', () => {
    it('maintains state between re-renders', () => {
      const { rerender } = render(<Sidebar />);

      // Первый рендер
      const dashboardLink1 = screen.getByRole('link', { name: 'Dashboard' });
      expect(dashboardLink1).toHaveClass('active');

      // Меняем путь и перерендериваем
      mockUsePathname.mockReturnValue('/history');
      rerender(<Sidebar />);

      const historyLink = screen.getByRole('link', { name: 'History' });
      expect(historyLink).toHaveClass('active');

      const dashboardLink2 = screen.getByRole('link', { name: 'Dashboard' });
      expect(dashboardLink2).not.toHaveClass('active');

      // Возвращаем обратно
      mockUsePathname.mockReturnValue('/dashboard');
      rerender(<Sidebar />);

      const dashboardLink3 = screen.getByRole('link', { name: 'Dashboard' });
      expect(dashboardLink3).toHaveClass('active');

      const historyLink2 = screen.getByRole('link', { name: 'History' });
      expect(historyLink2).not.toHaveClass('active');
    });

    it('works with multiple simultaneous instances', () => {
      // Рендерим несколько экземпляров
      const { unmount: unmount1 } = render(<Sidebar />);
      const { unmount: unmount2 } = render(<Sidebar />);

      // Оба должны работать корректно
      const sidebars = screen.getAllByRole('complementary');
      expect(sidebars).toHaveLength(2);

      unmount1();
      unmount2();
    });
  });

  describe('Visual Elements', () => {
    it('renders brand with gradient styling', () => {
      render(<Sidebar />);

      const brandGradient = document.querySelector('.brand-gradient');
      expect(brandGradient).toBeInTheDocument();
      expect(brandGradient).toHaveTextContent('Asset');

      const textInk = document.querySelector('.text-ink');
      expect(textInk).toBeInTheDocument();
      expect(textInk).toHaveTextContent('Predict');
    });

    it('renders profile section with correct layout', () => {
      render(<Sidebar />);

      const profileSection = document.querySelector('.sidebar-profile');
      expect(profileSection).toBeInTheDocument();

      const avatar = screen.getByAltText('Profile avatar');
      expect(avatar).toBeInTheDocument();

      const profileName = document.querySelector('.sidebar-profile-name');
      expect(profileName).toHaveTextContent('John Doe');

      const profileLogin = document.querySelector('.sidebar-profile-login');
      expect(profileLogin).toHaveTextContent('john@example.com');
    });
  });
});
