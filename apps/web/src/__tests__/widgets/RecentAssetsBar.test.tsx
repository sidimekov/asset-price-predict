import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import RecentAssetsBar from '@/widgets/recent-assets/RecentAssetsBar';

describe('RecentAssetsBar', () => {
  const mockAssets = [
    { symbol: 'BTCUSDT', price: '50000' },
    { symbol: 'ETHUSDT', price: '3000' },
  ];

  const mockProps = {
    state: 'ready' as const,
    assets: mockAssets,
    selected: 'BTCUSDT',
    onSelect: vi.fn(),
    onRemove: vi.fn(),
    onAdd: vi.fn(),
  };

  it('renders loading state', () => {
    render(<RecentAssetsBar {...mockProps} state="loading" />);
    expect(screen.getByText('Recent Assets')).toBeInTheDocument();
  });

  it('renders assets in ready state', () => {
    render(<RecentAssetsBar {...mockProps} />);
    expect(screen.getByText('BTCUSDT 50000')).toBeInTheDocument();
    expect(screen.getByText('ETHUSDT 3000')).toBeInTheDocument();
    expect(screen.getByText('+ Add Asset')).toBeInTheDocument();
  });

  it('renders empty state', () => {
    render(<RecentAssetsBar {...mockProps} assets={[]} />);
    expect(screen.getByText('No assets')).toBeInTheDocument();
    expect(screen.getByText('+ Add Asset')).toBeInTheDocument();
  });

  it('calls onAdd when add button is clicked', () => {
    render(<RecentAssetsBar {...mockProps} />);
    fireEvent.click(screen.getByText('+ Add Asset'));
    expect(mockProps.onAdd).toHaveBeenCalled();
  });
});
