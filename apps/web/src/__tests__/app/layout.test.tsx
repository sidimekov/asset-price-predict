import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import RootLayout from '@/app/layout';

// Мокаем next/navigation
const mockUsePathname = vi.fn();
const mockRouterPush = vi.fn();
vi.mock('next/navigation', () => ({
  usePathname: () => mockUsePathname(),
  useRouter: () => ({
    push: mockRouterPush,
  }),
}));

// Мокаем компоненты
vi.mock('@/shared/ui/Sidebar', () => ({
  Sidebar: () => <div data-testid="sidebar">Sidebar</div>,
}));

vi.mock('@/shared/ui/Container', () => ({
  Container: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="container">{children}</div>
  ),
}));

vi.mock('@/app/providers/StoreProvider', () => ({
  StoreProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="store-provider">{children}</div>
  ),
}));

// Мокаем lucide-react
vi.mock('lucide-react', () => ({
  Menu: () => <svg data-testid="menu-icon">Menu Icon</svg>,
}));

// Мокаем CSS импорт
vi.mock('@/app/globals.css', () => ({}));

describe('RootLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Сбрасываем все таймеры
    vi.useFakeTimers();
    // Устанавливаем дефолтное значение
    mockUsePathname.mockReturnValue('/dashboard');
    localStorage.clear();
    localStorage.setItem('auth.token', 'mock-token');
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders app layout for authenticated users on non-public pages', async () => {
    render(
      <RootLayout>
        <div data-testid="child">Child Content</div>
      </RootLayout>,
    );

    // Ждем завершения аутентификации
    vi.advanceTimersByTime(100);

    // Проверка <html lang="ru">
    expect(document.documentElement.tagName).toBe('HTML');
    expect(document.documentElement.lang).toBe('ru');

    // Проверка <body> и его классов
    const body = document.body;
    expect(body).toBeInTheDocument();
    expect(body.className).toContain('bg-primary');
    expect(body.className).toContain('text-ink');
    expect(body.className).toContain('font-sans');
    expect(body.className).toContain('antialiased');
    expect(body.className).toContain('min-h-screen');

    // Проверка что StoreProvider присутствует
    expect(screen.getByTestId('store-provider')).toBeInTheDocument();

    // Проверка структуры app layout
    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('container')).toBeInTheDocument();

    // Дочерний контент должен быть обернут в layout
    const child = screen.getByTestId('child');
    expect(child).toBeInTheDocument();
    expect(child.textContent).toBe('Child Content');
  });

  it('renders children directly for public pages', () => {
    // Мокаем публичную страницу
    mockUsePathname.mockReturnValue('/auth');

    render(
      <RootLayout>
        <div data-testid="child">Public Page Content</div>
      </RootLayout>,
    );

    // Ждем завершения аутентификации
    vi.advanceTimersByTime(100);

    // На публичных страницах children рендерятся напрямую
    const child = screen.getByTestId('child');
    expect(child).toBeInTheDocument();
    expect(child.textContent).toBe('Public Page Content');

    // App layout не должен отображаться
    expect(screen.queryByTestId('sidebar')).not.toBeInTheDocument();
    expect(screen.queryByTestId('container')).not.toBeInTheDocument();
  });

  it('renders children directly for home page', () => {
    // Мокаем домашнюю страницу
    mockUsePathname.mockReturnValue('/');

    render(
      <RootLayout>
        <div data-testid="child">Home Page Content</div>
      </RootLayout>,
    );

    // Ждем завершения аутентификации
    vi.advanceTimersByTime(100);

    // На домашней странице children рендерятся напрямую
    const child = screen.getByTestId('child');
    expect(child).toBeInTheDocument();
    expect(child.textContent).toBe('Home Page Content');

    // App layout не должен отображаться
    expect(screen.queryByTestId('sidebar')).not.toBeInTheDocument();
  });

  it('toggles sidebar on mobile', () => {
    render(
      <RootLayout>
        <div data-testid="child">Child Content</div>
      </RootLayout>,
    );

    // Ждем завершения аутентификации
    vi.advanceTimersByTime(100);

    // Изначально sidebar должен быть collapsed (по логике компонента)
    const sidebarContainer = document.querySelector('.sidebar');
    expect(sidebarContainer).toHaveClass('collapsed');

    // Находим кнопку меню (должна быть видна только на mobile)
    const menuButton = screen.getByLabelText('Открыть меню');
    expect(menuButton).toBeInTheDocument();

    // Кликаем чтобы открыть sidebar (на mobile)
    fireEvent.click(menuButton);

    // Проверяем что backdrop появился
    const backdrop = document.querySelector('.fixed.inset-0.bg-black\\/50');
    expect(backdrop).toBeInTheDocument();

    // Кликаем по backdrop чтобы закрыть
    fireEvent.click(backdrop!);
  });

  it('handles different public paths correctly', () => {
    const publicPaths = ['/auth', '/'];

    publicPaths.forEach((path) => {
      mockUsePathname.mockReturnValue(path);

      const { unmount } = render(
        <RootLayout>
          <div data-testid="child">Content for {path}</div>
        </RootLayout>,
      );

      // Ждем завершения аутентификации
      vi.advanceTimersByTime(100);

      // Проверяем что children рендерятся напрямую
      expect(screen.getByTestId('child')).toBeInTheDocument();
      expect(screen.queryByTestId('sidebar')).not.toBeInTheDocument();

      unmount();
    });
  });

  it('handles different private paths correctly', () => {
    const privatePaths = ['/dashboard', '/history', '/account', '/forecast/0'];

    privatePaths.forEach((path) => {
      mockUsePathname.mockReturnValue(path);

      const { unmount } = render(
        <RootLayout>
          <div data-testid="child">Content for {path}</div>
        </RootLayout>,
      );

      // Ждем завершения аутентификации
      vi.advanceTimersByTime(100);

      // Проверяем что app layout отображается
      expect(screen.getByTestId('child')).toBeInTheDocument();
      expect(screen.getByTestId('sidebar')).toBeInTheDocument();
      expect(screen.getByTestId('container')).toBeInTheDocument();

      unmount();
    });
  });

  it('applies correct classes to layout elements', () => {
    render(
      <RootLayout>
        <div data-testid="child">Child Content</div>
      </RootLayout>,
    );

    // Ждем завершения аутентификации
    vi.advanceTimersByTime(100);

    // Проверяем классы основного контейнера
    const mainContainer = document.querySelector(
      '.flex.h-screen.overflow-hidden',
    );
    expect(mainContainer).toBeInTheDocument();

    // Проверяем классы main content area
    const mainContent = document.querySelector(
      '.flex-1.flex.flex-col.overflow-hidden',
    );
    expect(mainContent).toBeInTheDocument();

    // Проверяем классы header
    const header = document.querySelector('.lg\\:hidden.bg-surface-dark');
    expect(header).toBeInTheDocument();

    // Проверяем классы main
    const main = document.querySelector('.flex-1.overflow-y-auto');
    expect(main).toBeInTheDocument();
  });

  it('redirects unauthenticated visitors to /auth', () => {
    mockUsePathname.mockReturnValue('/history');
    localStorage.removeItem('auth.token');

    render(
      <RootLayout>
        <div data-testid="child">Private Content</div>
      </RootLayout>,
    );

    vi.advanceTimersByTime(100);

    expect(mockRouterPush).toHaveBeenCalledWith('/auth');
  });
});
