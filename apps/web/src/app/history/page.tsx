'use client';

import { useMemo, useState } from 'react';
import SearchBar, {
  type HistoryFilters,
} from '@/features/history/HistorySearch';
import HistoryTable from '@/features/history/HistoryTable';
import { useHistory } from '@/entities/history/useHistory';
import { MOCK_SYMBOLS } from '@/features/market-adapter/providers/MockProvider';

const BINANCE_QUOTES = ['USDT', 'USDC', 'BUSD', 'USD', 'EUR', 'BTC', 'ETH'];

const DEFAULT_FILTERS: HistoryFilters = {
  providers: { binance: false, moex: false, mock: false },
  assetClasses: {
    equity: false,
    fx: false,
    crypto: false,
    etf: false,
    bond: false,
    other: false,
  },
  currencies: {},
  order: 'desc',
};

const inferBinanceCurrency = (symbol: string): string | undefined => {
  const upper = symbol.toUpperCase();
  return BINANCE_QUOTES.find((quote) => upper.endsWith(quote));
};

const inferMockMeta = (symbol: string) => {
  const found = MOCK_SYMBOLS.find(
    (item) => item.symbol.toLowerCase() === symbol.toLowerCase(),
  );
  if (!found) return {};
  return {
    assetClass: found.assetClass,
    currency: found.currency,
  };
};

const inferHistoryMeta = (entry: { symbol: string; provider: string }) => {
  const provider = entry.provider.toLowerCase();
  if (provider === 'binance') {
    return {
      assetClass: 'crypto',
      currency: inferBinanceCurrency(entry.symbol),
    };
  }
  if (provider === 'moex') {
    return { assetClass: 'equity', currency: 'RUB' };
  }
  if (provider === 'mock') {
    return inferMockMeta(entry.symbol);
  }
  return {};
};

export default function HistoryPage() {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<HistoryFilters>(DEFAULT_FILTERS);
  const { items, loading, error } = useHistory();

  const handleSearch = (query: string) => {
    setQuery(query);
  };

  const currencyOptions = useMemo(() => {
    const currencies = new Set<string>();
    items.forEach((item) => {
      const meta = inferHistoryMeta(item);
      if (meta.currency) {
        currencies.add(meta.currency);
      }
    });
    return Array.from(currencies).sort();
  }, [items]);

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    const activeProviders = Object.entries(filters.providers)
      .filter(([_, active]) => active)
      .map(([provider]) => provider);
    const activeClasses = Object.entries(filters.assetClasses)
      .filter(([_, active]) => active)
      .map(([assetClass]) => assetClass);
    const activeCurrencies = Object.entries(filters.currencies)
      .filter(([_, active]) => active)
      .map(([currency]) => currency.toUpperCase());

    const withFilters = items.filter((item) => {
      const provider = item.provider.toLowerCase();
      if (
        q &&
        !item.symbol.toLowerCase().includes(q) &&
        !provider.includes(q)
      ) {
        return false;
      }

      if (activeProviders.length > 0 && !activeProviders.includes(provider)) {
        return false;
      }

      const meta = inferHistoryMeta(item);
      if (
        activeClasses.length > 0 &&
        (!meta.assetClass || !activeClasses.includes(meta.assetClass))
      ) {
        return false;
      }

      if (
        activeCurrencies.length > 0 &&
        (!meta.currency ||
          !activeCurrencies.includes(meta.currency.toUpperCase()))
      ) {
        return false;
      }

      return true;
    });

    return withFilters.sort((a, b) => {
      const aDate = Date.parse(a.created_at) || 0;
      const bDate = Date.parse(b.created_at) || 0;
      return filters.order === 'asc' ? aDate - bDate : bDate - aDate;
    });
  }, [items, query, filters]);

  return (
    <main className="history-page">
      <div className="search-bar-wrapper">
        <SearchBar
          searchAction={handleSearch}
          applyFiltersAction={setFilters}
          currencyOptions={currencyOptions}
        />
      </div>

      <div className="history-page-content">
        {error ? <div className="no-history">{error}</div> : null}
        <HistoryTable loading={loading} items={filteredItems} />
      </div>
    </main>
  );
}
