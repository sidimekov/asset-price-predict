import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import AccountPage from '@/app/account/page';

describe('AccountPage', () => {
  it('renders account settings title', () => {
    render(<AccountPage />);
    expect(screen.getByText('Настройки аккаунта')).toBeInTheDocument();
  });
});
