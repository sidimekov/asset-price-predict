import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect } from 'vitest';
import FactorsTable from '@/features/factors/FactorsTable';

describe('FactorsTable', () => {
  it('renders empty state text', () => {
    render(<FactorsTable state="empty" />);
    expect(screen.getByText('No factors yet')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });
});
