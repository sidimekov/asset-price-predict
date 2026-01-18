import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import RecentAssetsBar from '@/widgets/recent-assets/RecentAssetsBar';

describe('RecentAssetsBar', () => {
  const mockAssets = [
    {
      symbol: 'BTCUSDT',
      provider: 'binance',
      lastPrice: 50000,
      changePct: 1.234,
      currency: 'USDT',
    },
    {
      symbol: 'ROSN',
      provider: 'moex',
      lastPrice: 512.4,
      changePct: -0.5,
      currency: 'RUB',
    },
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
    expect(screen.getByText('BTCUSDT')).toBeInTheDocument();
    expect(screen.getByText('BINANCE')).toBeInTheDocument();
    expect(screen.getByText('50000.00 USDT · +1.2%')).toBeInTheDocument();
    expect(screen.getByText('ROSN')).toBeInTheDocument();
    expect(screen.getByText('MOEX')).toBeInTheDocument();
    expect(screen.getByText('512.4 ₽ · -0.5%')).toBeInTheDocument();
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
