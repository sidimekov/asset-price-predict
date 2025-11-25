import type { CatalogItem } from '@shared/types/market';

export const normalizeCatalogItem = (
  raw: any,
  provider: 'BINANCE' | 'MOEX' | 'MOCK' | 'CUSTOM',
): CatalogItem | null => {
  if (!raw) return null;

  if (provider === 'BINANCE') {
    const symbol = raw.symbol || `${raw.baseAsset}${raw.quoteAsset}`;
    if (!symbol) return null;

    return {
      symbol: symbol.toUpperCase(),
      name: raw.baseAsset
        ? `${raw.baseAsset}/${raw.quoteAsset || 'USDT'}`
        : symbol,
      exchange: 'BINANCE',
      assetClass: 'crypto',
      currency: raw.quoteAsset || 'USDT',
      provider: 'BINANCE',
    };
  }

  if (provider === 'MOEX') {
    const symbol = (raw.SECID || raw.symbol || '').toString().trim();
    if (!symbol) return null;

    return {
      symbol,
      name: raw.SHORTNAME || raw.NAME || symbol,
      exchange: 'MOEX',
      assetClass: 'equity',
      currency: raw.CURRENCYID || 'RUB',
      provider: 'MOEX',
    };
  }

  if (
    (provider === 'MOCK' || provider === 'CUSTOM') &&
    raw.symbol &&
    raw.name
  ) {
    return {
      symbol: String(raw.symbol).toUpperCase(),
      name: String(raw.name),
      exchange: provider === 'MOCK' ? 'MOCKEX' : 'CUSTOM',
      assetClass: 'other',
      currency: 'USD',
      provider,
    };
  }

  return null;
};

export const normalizeCatalogResponse = (
  data: any[],
  provider: 'BINANCE' | 'MOEX' | 'MOCK' | 'CUSTOM',
): CatalogItem[] => {
  if (!Array.isArray(data)) return [];
  return data
    .map((item) => normalizeCatalogItem(item, provider))
    .filter((item): item is CatalogItem => item !== null);
};
