import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Illustration } from '@/features/landing/Illustration';

describe('Illustration', () => {
  it('renders image', () => {
    render(<Illustration />);
    expect(screen.getByAltText('Ethereum Illustration')).toBeInTheDocument();
  });
});
