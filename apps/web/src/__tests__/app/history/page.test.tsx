import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import HistoryPage from '@/app/history/page';

describe('HistoryPage', () => {
  it('renders history title', () => {
    render(<HistoryPage />);
    expect(screen.getByText('История')).toBeInTheDocument();
  });
});
