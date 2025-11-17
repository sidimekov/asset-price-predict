import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
}));

import Dashboard from '@/app/dashboard/page';

describe('Dashboard (smoke test)', () => {
  it('renders without crashing', () => {
    const { container } = render(<Dashboard />);
    expect(container.firstChild).toBeTruthy();

    expect(container.textContent).toContain('Parameters');
    expect(container.textContent).toContain('Recent Assets');
    expect(container.textContent).toContain('Factors');
  });
});
