import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi } from 'vitest';
import ParamsPanel from '@/features/params/ParamsPanel';

describe('ParamsPanel', () => {
    it('calls onPredict when button is clicked', () => {
        const onPredict = vi.fn();

        render(<ParamsPanel state="success" onPredict={onPredict} />);

        const button = screen.getByRole('button', { name: /predict/i });
        fireEvent.click(button);

        expect(onPredict).toHaveBeenCalledTimes(1);
    });

    it('calls onModelChange and onDateChange when not readOnly', () => {
        const onModelChange = vi.fn();
        const onDateChange = vi.fn();

        const { container } = render(
            <ParamsPanel
                state="success"
                onPredict={vi.fn()}
                selectedModel=""
                selectedDate="2025-12-14"
                onModelChange={onModelChange}
                onDateChange={onDateChange}
            />,
        );

        const select = screen.getByRole('combobox');
        fireEvent.change(select, { target: { value: 'model-2' } });
        expect(onModelChange).toHaveBeenCalledWith('model-2');

        const dateInput = container.querySelector('input[type="date"]');

        expect(dateInput).not.toBeNull();

        if (dateInput) {
            fireEvent.change(dateInput, { target: { value: '2025-12-31' } });
        }

        expect(onDateChange).toHaveBeenCalledWith('2025-12-31');
    });

    it('does not allow changing model or date when readOnly', () => {
        const onModelChange = vi.fn();
        const onDateChange = vi.fn();

        const { container } = render(
            <ParamsPanel
                state="success"
                onPredict={vi.fn()}
                selectedModel="model-1"
                selectedDate="2025-12-14"
                onModelChange={onModelChange}
                onDateChange={onDateChange}
                readOnly
            />,
        );

        const select = screen.getByRole('combobox');
        const dateInput = container.querySelector('input[type="date"]');

        expect(dateInput).not.toBeNull();

        fireEvent.change(select, { target: { value: 'model-3' } });
        if (dateInput) {
            fireEvent.change(dateInput, { target: { value: '2025-12-31' } });
        }

        expect(onModelChange).not.toHaveBeenCalled();
        expect(onDateChange).not.toHaveBeenCalled();
    });
});