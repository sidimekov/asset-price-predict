import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ParamsPanel from '@/features/params/ParamsPanel';

describe('ParamsPanel', () => {
  it('renders loading state', () => {
    render(<ParamsPanel state="loading" />);
    expect(screen.getByText('Parameters')).toBeInTheDocument();
  });

  it('renders error state', () => {
    render(<ParamsPanel state="error" />);
    expect(screen.getByText('Error loading parameters')).toBeInTheDocument();
  });

  it('renders success state', () => {
    render(<ParamsPanel state="success" />);
    expect(screen.getByText('Parameters')).toBeInTheDocument();
    expect(screen.getByText('Select predict model')).toBeInTheDocument();
    expect(screen.getByText('Predict')).toBeInTheDocument();
  });
});
