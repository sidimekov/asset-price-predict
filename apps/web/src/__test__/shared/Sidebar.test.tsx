import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Sidebar } from '@/shared/sidebar/Sidebar';

// Мокаем зависимости
const mockUsePathname = vi.fn(() => '/dashboard');

vi.mock('next/navigation', () => ({
  usePathname: () => mockUsePathname(),
}));

vi.mock('@/shared/sidebar/SidebarToggle', () => ({
  SidebarToggle: vi.fn(({ collapsed, setCollapsed }) => (
    <button
      data-testid="sidebar-toggle"
      onClick={() => setCollapsed(!collapsed)}
    >
      {collapsed ? '>' : '<'}
    </button>
  )),
}));

vi.mock('@/mocks/profile.json', () => ({
  default: {
    avatarUrl: '/test-avatar.jpg',
    username: 'testuser',
    login: 'test@example.com',
  },
}));

describe('Sidebar', () => {
  it('renders expanded sidebar correctly', () => {
    const setCollapsed = vi.fn();
    render(<Sidebar collapsed={false} setCollapsed={setCollapsed} />);

    expect(screen.getByText('Asset')).toBeInTheDocument();
    expect(screen.getByText('Predict')).toBeInTheDocument();
    expect(screen.getByAltText('testuser avatar')).toBeInTheDocument();
    expect(screen.getByText('testuser')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('History')).toBeInTheDocument();
    expect(screen.getByText('Account Settings')).toBeInTheDocument();
  });

  it('renders collapsed sidebar correctly', () => {
    const setCollapsed = vi.fn();
    render(<Sidebar collapsed={true} setCollapsed={setCollapsed} />);

    // В свернутом состоянии контент не должен отображаться
    expect(screen.queryByText('Asset')).not.toBeInTheDocument();
    expect(screen.queryByText('testuser')).not.toBeInTheDocument();
  });
});
