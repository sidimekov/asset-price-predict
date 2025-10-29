import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import AccountPage from '@/app/account/page';

// Мокаем дочерние компоненты
vi.mock('@/features/account/ProfileHeader', () => ({
  ProfileHeader: vi.fn(({ loading, onClick }) => (
    <div data-testid="profile-header" onClick={onClick}>
      ProfileHeader {loading ? 'loading' : 'loaded'}
    </div>
  )),
}));

vi.mock('@/features/account/ActionsList', () => ({
  ActionsList: vi.fn(({ loading, onClick }) => (
    <div data-testid="actions-list" onClick={() => onClick?.('test')}>
      ActionsList {loading ? 'loading' : 'loaded'}
    </div>
  )),
}));

describe('AccountPage', () => {
  it('renders account page with main content', () => {
    render(<AccountPage />);

    const main = screen.getByRole('main');
    expect(main).toBeInTheDocument();
    expect(main.style.display).toBe('flex');
    expect(main.style.flexDirection).toBe('column');
    expect(main.style.alignItems).toBe('center');
    expect(main.style.backgroundColor).toBe('rgb(23, 21, 59)');
  });

  it('renders profile header and actions list', async () => {
    render(<AccountPage />);

    // Ждем завершения загрузки
    await vi.waitFor(() => {
      expect(screen.getByTestId('profile-header')).toBeInTheDocument();
      expect(screen.getByTestId('actions-list')).toBeInTheDocument();
    });
  });

  it('handles profile click', async () => {
    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});

    render(<AccountPage />);

    await vi.waitFor(() => {
      const profileHeader = screen.getByTestId('profile-header');
      fireEvent.click(profileHeader);
      expect(alertMock).toHaveBeenCalledWith('Go to Account Settings');
    });

    alertMock.mockRestore();
  });
});
