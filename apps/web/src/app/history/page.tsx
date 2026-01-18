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
  const { items, loading, error, page, limit, total, setPage, setLimit } =
    useHistory();

  const handleSearch = (value: string) => {
    setQuery(value);
    setPage(1);
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

  const paginationOptions = [10, 20, 50];
  const pageCount = Math.max(1, Math.ceil(total / Math.max(1, limit)));

  const handlePrevPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  const handleNextPage = () => {
    if (page < pageCount) {
      setPage(page + 1);
    }
  };

  const handleLimitChange = (value: number) => {
    setLimit(value);
    setPage(1);
  };

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

      <div className="flex items-center gap-3 mb-4">
        <button
          data-testid="history-prev"
          type="button"
          onClick={handlePrevPage}
          disabled={page <= 1 || loading}
          className="px-3 py-1 rounded bg-surface-dark/50"
        >
          Prev
        </button>
        <span
          data-testid="history-page-info"
          className="text-sm text-ink-muted"
        >
          Страница {page} / {pageCount}
        </span>
        <button
          data-testid="history-next"
          type="button"
          onClick={handleNextPage}
          disabled={page >= pageCount || loading}
          className="px-3 py-1 rounded bg-surface-dark/50"
        >
          Next
        </button>
        <div className="flex items-center gap-2 ml-auto">
          <label htmlFor="history-limit" className="text-sm text-ink-muted">
            Limit
          </label>
          <select
            id="history-limit"
            data-testid="history-limit"
            value={limit}
            onChange={(event) =>
              handleLimitChange(
                Number(event.target.value) || paginationOptions[0],
              )
            }
            className="bg-surface-dark/70 rounded px-2 py-1 text-sm text-white"
          >
            {paginationOptions.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="history-page-content">
        {error ? <div className="no-history">{error}</div> : null}
        <HistoryTable loading={loading} items={filteredItems} />
      </div>
    </main>
  );
}
