import { render } from '@testing-library/react';
import Layout from '@/app/layout';
import Page from '@/app/page';
import Skeleton from '@/shared/ui/Skeleton';
import { describe, it, expect } from 'vitest';

describe('Smoke tests', () => {
  it('renders Page without crash', () => {
    render(<Page />);
    expect(true).toBe(true);
  });

  it('renders Skeleton without crash', () => {
    render(<Skeleton />);
    expect(true).toBe(true);
  });
});
