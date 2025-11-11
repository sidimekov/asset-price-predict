import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect } from 'vitest';
import Dashboard from '@/app/dashboard/page';

describe('Dashboard (smoke test)', () => {
  it('renders without crashing', () => {
    const { container } = render(<Dashboard />);

    // просто проверяем, что корневой контейнер появился
    expect(container.firstChild).toBeTruthy();

    // опционально можно проверить хотя бы кусочек текста, который точно есть
    expect(container.textContent).toContain('Parameters');
    expect(container.textContent).toContain('Predict');
    expect(container.textContent).toContain('Factors');
  });
});
