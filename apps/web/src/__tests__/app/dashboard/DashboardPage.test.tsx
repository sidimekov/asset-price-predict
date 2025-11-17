import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect } from 'vitest';
import Dashboard from '@/app/dashboard/page';
import { Provider } from 'react-redux';
import { store } from '@/shared/store';

const renderWithStore = () =>
  render(
    <Provider store={store}>
      <Dashboard />
    </Provider>,
  );

describe('Dashboard (smoke test)', () => {
  it('renders without crashing', () => {
    const { container } = renderWithStore();

    expect(container.firstChild).toBeTruthy();

    // есть базовые куски UI
    expect(container.textContent).toContain('Parameters'); // присутствует и в loading
    expect(container.textContent).toContain('Recent Assets');
    expect(container.textContent).toContain('Factors');
  });
});
