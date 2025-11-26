import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import FactorsTable from '@/features/factors/FactorsTable';

vi.mock('../../mocks/factors.json', () => [
  { name: 'Factor 1', impact: 'High', shap: '0.5', conf: '95%' },
  { name: 'Factor 2', impact: 'Medium', shap: '0.3', conf: '85%' },
]);

describe('FactorsTable', () => {
  it('renders empty state', () => {
    render(<FactorsTable state="empty" />);
    expect(screen.getByText('No factors yet')).toBeInTheDocument();
  });

  it('renders loading state', () => {
    render(<FactorsTable state="loading" />);
    expect(screen.getByText('Factors')).toBeInTheDocument();
    expect(screen.getByText('Impact')).toBeInTheDocument();
    expect(screen.getByText('SHAP')).toBeInTheDocument();
    expect(screen.getByText('Conf.')).toBeInTheDocument();
  });
});
