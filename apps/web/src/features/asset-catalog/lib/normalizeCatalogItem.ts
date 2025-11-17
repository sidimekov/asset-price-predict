import type { CatalogItem } from '../model/catalogSlice';

export const normalizeCatalogItem = (
  raw: any,
  provider: 'binance' | 'moex',
): CatalogItem | null => {
  if (!raw?.symbol && !raw?.SECID) return null;

  const symbol = (raw.symbol || raw.SECID || '').toString().trim();
  if (!symbol) return null;

  if (provider === 'binance') {
    return {
      symbol,
      name: raw.baseAsset
        ? `${raw.baseAsset}/${raw.quoteAsset || 'USDT'}`
        : symbol,
      assetClass: 'crypto',
      currency: raw.quoteAsset || 'USDT',
      provider: 'binance',
    };
  }

  if (provider === 'moex') {
    const typeMap: Record<string, CatalogItem['assetClass']> = {
      stock: 'equity',
      shares: 'equity',
      currency: 'fx',
      fund: 'etf',
      etf: 'etf',
      bond: 'bond',
      future: 'futures',
    };

    const rawType = (raw.TYPE || raw.SECTYPE || '').toString().toLowerCase();
    const assetClass = typeMap[rawType] || rawType || 'equity';

    return {
      symbol,
      name: raw.SHORTNAME || raw.NAME || raw.description || symbol,
      exchange: raw.MARKET || raw.BOARDID || 'moex',
      assetClass,
      currency: raw.CURRENCYID || raw.CURRENCY || 'RUB',
      provider: 'moex',
    };
  }

  return null;
};

export const normalizeCatalogResponse = (
  data: any[],
  provider: 'binance' | 'moex',
): CatalogItem[] => {
  if (!Array.isArray(data)) return [];
  return data
    .map((item) => normalizeCatalogItem(item, provider))
    .filter((item): item is CatalogItem => item !== null);
};
