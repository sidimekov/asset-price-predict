import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Button } from '@/shared/ui/Button';

describe('Button', () => {
    it('renders with default primary variant', () => {
        render(<Button>Click</Button>);
        const btn = screen.getByRole('button', { name: 'Click' });
        expect(btn).toHaveStyle('background: linear-gradient(to right, #FF409A, #C438EF)');
    });

    it('renders danger variant', () => {
        render(<Button variant="danger">Delete</Button>);
        const btn = screen.getByRole('button', { name: 'Delete' });
        expect(btn).toHaveStyle('background: linear-gradient(to right, #FF0000, #FF4D4D)');
    });

    it('is disabled and has reduced opacity', () => {
        render(<Button disabled>Disabled</Button>);
        const btn = screen.getByRole('button', { name: 'Disabled' });
        expect(btn).toBeDisabled();
        expect(btn).toHaveStyle('opacity: 0.5');
    });

    it('applies focus style', () => {
        render(<Button>Focus</Button>);
        const btn = screen.getByRole('button', { name: 'Focus' });
        fireEvent.focus(btn);
        expect(btn).toHaveStyle('box-shadow: 0 0 0 3px rgba(255, 64, 154, 0.7), 0 2px 8px rgba(0,0,0,0.15)');
    });

    it('applies blur style', () => {
        render(<Button>Blur</Button>);
        const btn = screen.getByRole('button', { name: 'Blur' });
        fireEvent.focus(btn);
        fireEvent.blur(btn);
        expect(btn).toHaveStyle('box-shadow: 0 2px 8px rgba(0,0,0,0.15)');
    });

    it('applies mouse down scale', () => {
        render(<Button>Press</Button>);
        const btn = screen.getByRole('button', { name: 'Press' });
        fireEvent.mouseDown(btn);
        expect(btn).toHaveStyle('transform: scale(0.97)');
    });

    it('applies mouse up scale', () => {
        render(<Button>Release</Button>);
        const btn = screen.getByRole('button', { name: 'Release' });
        fireEvent.mouseDown(btn);
        fireEvent.mouseUp(btn);
        expect(btn).toHaveStyle('transform: scale(1)');
    });

    it('applies hover opacity', () => {
        render(<Button>Hover</Button>);
        const btn = screen.getByRole('button', { name: 'Hover' });
        fireEvent.mouseEnter(btn);
        expect(btn).toHaveStyle('opacity: 0.9');
    });

    it('resets opacity on mouse leave when not disabled', () => {
        render(<Button>Leave</Button>);
        const btn = screen.getByRole('button', { name: 'Leave' });
        fireEvent.mouseEnter(btn);
        fireEvent.mouseLeave(btn);
        expect(btn).toHaveStyle('opacity: 1');
    });

    it('keeps opacity 0.5 on mouse leave when disabled', () => {
        render(<Button disabled>Disabled Hover</Button>);
        const btn = screen.getByRole('button', { name: 'Disabled Hover' });
        fireEvent.mouseEnter(btn);
        fireEvent.mouseLeave(btn);
        expect(btn).toHaveStyle('opacity: 0.5');
    });
});