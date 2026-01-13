import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi } from 'vitest';
import ParamsPanel from '@/features/params/ParamsPanel';

describe('ParamsPanel', () => {
  it('calls onPredict when button is clicked', () => {
    const onPredict = vi.fn();

    render(
      <ParamsPanel
        state="success"
        onPredict={onPredict}
        selectedTimeframe="1h"
        selectedWindow={200}
        selectedHorizon={24}
      />,
    );

    const button = screen.getByRole('button', { name: /predict/i });
    fireEvent.click(button);

    expect(onPredict).toHaveBeenCalledTimes(1);
  });

  it('calls onModelChange and horizon/window changes when not readOnly', () => {
    const onModelChange = vi.fn();
    const onWindowChange = vi.fn();
    const onHorizonChange = vi.fn();
    const onTimeframeChange = vi.fn();

    const { container } = render(
      <ParamsPanel
        state="success"
        onPredict={vi.fn()}
        selectedModel=""
        selectedTimeframe="1h"
        selectedWindow={100}
        selectedHorizon={12}
        onModelChange={onModelChange}
        onWindowChange={onWindowChange}
        onHorizonChange={onHorizonChange}
        onTimeframeChange={onTimeframeChange}
      />,
    );

    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[0], { target: { value: '8h' } });
    expect(onTimeframeChange).toHaveBeenCalledWith('8h');

    fireEvent.change(selects[1], { target: { value: 'lgbm_v1' } });
    expect(onModelChange).toHaveBeenCalledWith('lgbm_v1');

    const numberInputs = container.querySelectorAll('input[type="number"]');

    expect(numberInputs.length).toBeGreaterThan(1);

    fireEvent.change(numberInputs[0], { target: { value: '220' } });
    fireEvent.change(numberInputs[1], { target: { value: '30' } });

    expect(onWindowChange).toHaveBeenCalledWith(220);
    expect(onHorizonChange).toHaveBeenCalledWith(30);
  });

  it('does not allow changing inputs when readOnly', () => {
    const onModelChange = vi.fn();
    const onWindowChange = vi.fn();
    const onHorizonChange = vi.fn();
    const onTimeframeChange = vi.fn();

    const { container } = render(
      <ParamsPanel
        state="success"
        onPredict={vi.fn()}
        selectedModel="client"
        selectedTimeframe="1h"
        selectedWindow={100}
        selectedHorizon={12}
        onModelChange={onModelChange}
        onWindowChange={onWindowChange}
        onHorizonChange={onHorizonChange}
        onTimeframeChange={onTimeframeChange}
        readOnly
      />,
    );

    const selects = screen.getAllByRole('combobox');
    const numberInputs = container.querySelectorAll('input[type="number"]');

    expect(numberInputs.length).toBeGreaterThan(1);

    fireEvent.change(selects[0], { target: { value: '8h' } });
    fireEvent.change(selects[1], { target: { value: 'baseline' } });
    fireEvent.change(numberInputs[0], { target: { value: '220' } });
    fireEvent.change(numberInputs[1], { target: { value: '30' } });

    expect(onModelChange).not.toHaveBeenCalled();
    expect(onWindowChange).not.toHaveBeenCalled();
    expect(onHorizonChange).not.toHaveBeenCalled();
    expect(onTimeframeChange).not.toHaveBeenCalled();
  });
});
