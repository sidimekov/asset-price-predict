import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Input } from '@/shared/ui/Input';

describe('Input', () => {
  const props = {
    placeholder: 'Email',
    value: '',
    onChange: vi.fn(),
    ariaDescribedby: 'email',
  };

  it('renders input with class', () => {
    render(<Input {...props} />);
    expect(screen.getByPlaceholderText('Email')).toHaveClass('input');
  });

  it('shows error text', () => {
    render(<Input {...props} error="Invalid" />);
    expect(screen.getByText('Invalid')).toHaveClass('error-text');
  });
});
