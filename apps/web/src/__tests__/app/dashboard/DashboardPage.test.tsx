import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect } from 'vitest';
import Dashboard from '@/app/dashboard/page'; // скорректируй путь, если у тебя другой

describe('Dashboard (smoke test)', () => {
  it('renders without crashing', () => {
    const { container } = render(<Dashboard />);
    expect(container.firstChild).toBeTruthy();

    // есть базовые куски UI
    expect(container.textContent).toContain('Parameters'); // присутствует и в loading
    expect(container.textContent).toContain('Recent Assets');
    expect(container.textContent).toContain('Factors');
  });
});
