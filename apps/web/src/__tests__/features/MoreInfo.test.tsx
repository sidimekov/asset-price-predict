import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MoreInfo } from '@/features/landing/MoreInfo';

describe('MoreInfo', () => {
  it('renders title', () => {
    render(<MoreInfo />);
    expect(
      screen.getByText('About project - AssetPredict'),
    ).toBeInTheDocument();
  });

  it('renders text', () => {
    render(<MoreInfo />);
    expect(screen.getByText(/Веб-приложение/i)).toBeInTheDocument();
  });
});
