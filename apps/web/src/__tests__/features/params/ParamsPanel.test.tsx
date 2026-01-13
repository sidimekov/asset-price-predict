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

  it('renders loading skeletons', () => {
    const { container } = render(<ParamsPanel state="loading" />);
    expect(container.querySelectorAll('.param-panel-item').length).toBeGreaterThan(0);
  });

  it('renders error state', () => {
    render(<ParamsPanel state="error" />);
    expect(screen.getByText('Error loading parameters')).toBeInTheDocument();
  });

  it('disables predict when params are incomplete', () => {
    render(
      <ParamsPanel
        state="success"
        onPredict={vi.fn()}
        selectedTimeframe=""
        selectedWindow={0}
        selectedHorizon={0}
      />,
    );

    const button = screen.getByRole('button', { name: /predict/i });
    expect(button).toBeDisabled();
    expect(
      screen.getByText('Select timeframe, window, and horizon to run a forecast.'),
    ).toBeInTheDocument();
  });

  it('allows clearing model to default', () => {
    const onModelChange = vi.fn();
    render(
      <ParamsPanel
        state="success"
        onPredict={vi.fn()}
        selectedTimeframe="1h"
        selectedWindow={200}
        selectedHorizon={24}
        selectedModel="client"
        onModelChange={onModelChange}
      />,
    );

    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[1], { target: { value: '' } });
    expect(onModelChange).toHaveBeenCalledWith(null);
  });

  it('updates internal values when controlled props are not provided', () => {
    render(<ParamsPanel state="success" onPredict={vi.fn()} />);

    const selects = screen.getAllByRole('combobox');
    const numberInputs = screen.getAllByRole('spinbutton');

    expect(selects[0]).toHaveValue('1h');
    expect(numberInputs[0]).toHaveValue(200);
    expect(numberInputs[1]).toHaveValue(24);

    fireEvent.change(selects[0], { target: { value: '8h' } });
    fireEvent.change(numberInputs[0], { target: { value: '180' } });
    fireEvent.change(numberInputs[1], { target: { value: '12' } });

    expect(selects[0]).toHaveValue('8h');
    expect(numberInputs[0]).toHaveValue(180);
    expect(numberInputs[1]).toHaveValue(12);
  });

  it('coerces invalid numeric input to 0', () => {
    const onWindowChange = vi.fn();
    const onHorizonChange = vi.fn();

    render(
      <ParamsPanel
        state="success"
        onPredict={vi.fn()}
        onWindowChange={onWindowChange}
        onHorizonChange={onHorizonChange}
      />,
    );

    const numberInputs = screen.getAllByRole('spinbutton');
    fireEvent.change(numberInputs[0], { target: { value: '' } });
    fireEvent.change(numberInputs[1], { target: { value: '' } });

    expect(onWindowChange).toHaveBeenCalledWith(0);
    expect(onHorizonChange).toHaveBeenCalledWith(0);
  });

  it('disables predict when onPredict is missing', () => {
    render(
      <ParamsPanel
        state="success"
        selectedTimeframe="1h"
        selectedWindow={200}
        selectedHorizon={24}
      />,
    );

    const button = screen.getByRole('button', { name: /predict/i });
    expect(button).toBeDisabled();
  });

  it('enables predict in readOnly mode even when params are incomplete', () => {
    render(
      <ParamsPanel
        state="success"
        onPredict={vi.fn()}
        selectedTimeframe=""
        selectedWindow={0}
        selectedHorizon={0}
        readOnly
      />,
    );

    const button = screen.getByRole('button', { name: /predict/i });
    expect(button).toBeEnabled();
  });
});
