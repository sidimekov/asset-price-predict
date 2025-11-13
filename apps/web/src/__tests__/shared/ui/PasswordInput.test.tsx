import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import PasswordInput from '@/shared/ui/PasswordInput';

describe('PasswordInput', () => {
  it('toggles password visibility', async () => {
    render(
      <PasswordInput
        value=""
        onChange={() => {}}
        placeholder="Password"
        ariaDescribedby="pass"
      />,
    );

    const input = screen.getByPlaceholderText('Password');
    const button = screen.getByText('Show');

    expect(input).toHaveAttribute('type', 'password');

    await userEvent.click(button);
    expect(input).toHaveAttribute('type', 'text');
    expect(screen.getByText('Hide')).toBeInTheDocument();

    await userEvent.click(button);
    expect(input).toHaveAttribute('type', 'password');
  });

  it('shows error when provided', () => {
    render(
      <PasswordInput
        value=""
        onChange={() => {}}
        error="Too weak"
        ariaDescribedby="pass"
      />,
    );

    expect(screen.getByText('Too weak')).toBeInTheDocument();
  });
});
