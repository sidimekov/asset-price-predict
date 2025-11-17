import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

// мок next/navigation: и useRouter, и useParams
vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: vi.fn(),
        replace: vi.fn(),
        prefetch: vi.fn(),
        back: vi.fn(),
        forward: vi.fn(),
        refresh: vi.fn(),
    }),
    useParams: () => ({ id: 'ASSET872' }),
}));

import ForecastPage from '@/app/forecast/[id]/page';

describe('ForecastPage (smoke test)', () => {
    it('renders forecast page with selected asset and panels', () => {
        const { container } = render(<ForecastPage/>);

        expect(container.textContent).toContain('ASSET872');
        expect(container.textContent).toContain('Parameters');
        expect(container.textContent).toContain('Factors');
    });
});