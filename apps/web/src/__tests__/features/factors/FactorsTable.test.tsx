import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import FactorsTable from '@/features/factors/FactorsTable';

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

  it('renders provided factors', () => {
    render(
      <FactorsTable
        state="ready"
        items={[
          { name: 'Factor 1', impact: 'High', shap: '0.5', conf: '95%' },
          { name: 'Factor 2', impact: 'Medium', shap: '0.3', conf: '85%' },
        ]}
      />,
    );

    expect(screen.getByText('Factor 1')).toBeInTheDocument();
    expect(screen.getByText('Factor 2')).toBeInTheDocument();
  });

  it('renders empty state when ready but no items', () => {
    render(<FactorsTable state="ready" items={[]} />);
    expect(screen.getByText('No factors yet')).toBeInTheDocument();
  });

  it('fills missing factor values with dashes', () => {
    render(<FactorsTable state="ready" items={[{ name: 'Factor X' }]} />);
    expect(screen.getByText('Factor X')).toBeInTheDocument();
    expect(screen.getAllByText('—')).toHaveLength(3);
  });
});
