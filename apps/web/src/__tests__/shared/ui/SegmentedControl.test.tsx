import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import SegmentedControl from '@/shared/ui/SegmentedControl';

describe('SegmentedControl', () => {
  it('renders options and calls onChange', () => {
    const onChange = vi.fn();
    render(
      <SegmentedControl
        value="line"
        options={[
          { value: 'line', label: 'Line' },
          { value: 'candles', label: 'Candles' },
        ]}
        onChange={onChange}
      />,
    );

    fireEvent.click(screen.getByText('Candles'));
    expect(onChange).toHaveBeenCalledWith('candles');
  });

  it('applies active class to selected option', () => {
    const { container } = render(
      <SegmentedControl
        value="candles"
        options={[
          { value: 'line', label: 'Line' },
          { value: 'candles', label: 'Candles' },
        ]}
        onChange={() => undefined}
        size="md"
      />,
    );

    const active = container.querySelector('.segmented-option-active');
    expect(active).toBeTruthy();
    expect(active?.textContent).toBe('Candles');
  });
});
