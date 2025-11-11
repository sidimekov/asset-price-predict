import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect } from 'vitest';
import FactorsTable from '@/features/factors/FactorsTable';
import mockFactors from '@/mocks/factors.json';

describe('FactorsTable', () => {
  it('renders empty state text', () => {
    render(<FactorsTable state="empty" />);

    // Показ заглушки и отсутствие таблицы
    expect(screen.getByText('No factors yet')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('renders loading skeletons (5 rows)', () => {
    const { container } = render(<FactorsTable state="loading" />);

    // В loading компонент отрисовывает 5 контейнеров-скелетонов с классами .flex.space-x-4.mb-2
    const skeletonRows = container.querySelectorAll('.flex.space-x-4.mb-2');
    expect(skeletonRows.length).toBe(5);

    // Таблицы в loading нет
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });
});
