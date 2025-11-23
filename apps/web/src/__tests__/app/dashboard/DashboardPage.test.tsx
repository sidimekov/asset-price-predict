import '@testing-library/jest-dom';
import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Provider } from 'react-redux';

import Dashboard from '@/app/dashboard/page';
import { store } from '@/shared/store';

const pushMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
}));

// Мокаем ParamsPanel, чтобы дернуть onPredict (и заодно onModelChange/onDateChange)
vi.mock('@/features/params/ParamsPanel', () => ({
  __esModule: true,
  default: (props: any) => (
    <div>
      <div>Parameters</div>
      <button
        onClick={() => {
          // вызываем, чтобы код дашборда точно пробежал через коллбеки
          props.onModelChange?.('model-2');
          props.onDateChange?.('2030-01-01');
          props.onPredict?.();
        }}
      >
        Predict
      </button>
    </div>
  ),
}));

const renderWithStore = () =>
  render(
    <Provider store={store}>
      <Dashboard />
    </Provider>,
  );

describe('Dashboard', () => {
  it('renders without crashing and shows main sections', () => {
    const { container } = renderWithStore();

    expect(container.firstChild).toBeTruthy();
    expect(container.textContent).toContain('Parameters');
    expect(container.textContent).toContain('Recent Assets');
    expect(container.textContent).toContain('Factors');
  });

  it('navigates to forecast page when Predict is clicked', () => {
    const { getByText } = renderWithStore();

    const predictButton = getByText('Predict');
    fireEvent.click(predictButton);

    expect(pushMock).toHaveBeenCalledTimes(1);

    const url = pushMock.mock.calls[0][0] as string;

    // базовые проверки на корректный url
    expect(url.startsWith('/forecast/')).toBe(true);
    expect(url).toContain('ticker=');

    const [path, query] = url.split('?');
    expect(path).toMatch(/^\/forecast\/\d+$/);
    expect(query).toBeTruthy();
  });
});
