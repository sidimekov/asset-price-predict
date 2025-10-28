import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect , vi } from 'vitest';
import { Input } from '@/shared/ui/Input';

describe('Input', () => {
    const defaultProps = {
        placeholder: 'Enter email',
        value: '',
        onChange: vi.fn(),
        ariaDescribedby: 'email-input',
    };

    it('renders with placeholder and label for screen readers', () => {
        render(<Input {...defaultProps} />);

        const input = screen.getByPlaceholderText('Enter email');
        const label = screen.getByText('Enter email');

        expect(input).toBeInTheDocument();
        expect(label).toHaveAttribute('for', 'email-input');
        expect(label).toHaveStyle('position: absolute');
    });

    it('displays value and hides placeholder when value is present', () => {
        render(<Input {...defaultProps} value="user@example.com" />);

        const input = screen.getByDisplayValue('user@example.com');
        expect(input).toHaveAttribute('placeholder', ''); // placeholder скрыт
        expect(input).toHaveStyle('color: #FFFFFF');
    });

    it('calls onChange when user types', () => {
        const handleChange = vi.fn();
        render(<Input {...defaultProps} onChange={handleChange} />);

        const input = screen.getByPlaceholderText('Enter email');
        fireEvent.change(input, { target: { value: 'test' } });

        expect(handleChange).toHaveBeenCalledTimes(1);
    });

    it('shows error message when error prop is provided', () => {
        render(<Input {...defaultProps} error="Invalid email" />);

        const error = screen.getByText('Invalid email');
        const input = screen.getByPlaceholderText('Enter email');

        expect(error).toBeInTheDocument();
        expect(error).toHaveAttribute('id', 'email-input-error');
        expect(input).toHaveAttribute('aria-describedby', 'email-input-error');
        expect(input).toHaveAttribute('aria-invalid', 'true');
    });

    it('applies focus and blur styles', () => {
        render(<Input {...defaultProps} />);

        const input = screen.getByPlaceholderText('Enter email');

        fireEvent.focus(input);
        expect(input).toHaveStyle('outline: 2px solid #FF409A');

        fireEvent.blur(input);
        expect(input).toHaveStyle('outline: none');
    });

    it('uses correct type when provided', () => {
        render(<Input {...defaultProps} type="password" />);

        const input = screen.getByPlaceholderText('Enter email');
        expect(input).toHaveAttribute('type', 'password');
    });

    it('has required attribute', () => {
        render(<Input {...defaultProps} />);

        const input = screen.getByPlaceholderText('Enter email');
        expect(input).toBeRequired();
    });
});