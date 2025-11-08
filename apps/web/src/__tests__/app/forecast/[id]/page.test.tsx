import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ForecastDetail from '@/app/forecast/[id]/page';

describe('ForecastDetail', () => {
  it('renders forecast title with id', () => {
    render(<ForecastDetail params={{ id: '999' }} />);
    expect(screen.getByText('Прогноз #999')).toBeInTheDocument();
  });
});
