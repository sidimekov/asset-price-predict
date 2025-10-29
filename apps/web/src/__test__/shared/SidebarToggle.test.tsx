import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SidebarToggle } from '@/shared/sidebar/SidebarToggle';

// Мокаем lucide-react иконки
vi.mock('lucide-react', () => ({
    ChevronLeft: vi.fn(() => <span>{'<'}</span>),
    ChevronRight: vi.fn(() => <span>{'>'}</span>),
}));

describe('SidebarToggle', () => {
    it('renders collapse icon when sidebar is expanded', () => {
        const setCollapsed = vi.fn();
        render(<SidebarToggle collapsed={false} setCollapsed={setCollapsed} />);

        expect(screen.getByText('<')).toBeInTheDocument();
        expect(screen.getByLabelText('Collapse sidebar')).toBeInTheDocument();
    });

    it('renders expand icon when sidebar is collapsed', () => {
        const setCollapsed = vi.fn();
        render(<SidebarToggle collapsed={true} setCollapsed={setCollapsed} />);

        expect(screen.getByText('>')).toBeInTheDocument();
        expect(screen.getByLabelText('Expand sidebar')).toBeInTheDocument();
    });

    it('calls setCollapsed when clicked', () => {
        const setCollapsed = vi.fn();
        render(<SidebarToggle collapsed={false} setCollapsed={setCollapsed} />);

        const button = screen.getByRole('button');
        fireEvent.click(button);

        expect(setCollapsed).toHaveBeenCalledWith(true);
    });

});