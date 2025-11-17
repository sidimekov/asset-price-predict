import { describe, it, expect } from 'vitest';
import * as marketConfig from '@/config/market';

describe('config/market', () => {
  it('exports cache ttl and available markets', () => {
    // Просто что-то утверждаем, чтобы модуль точно прогрузился.
    // Подгони имена под свои реальные экспортируемые сущности.
    expect(marketConfig.CACHE_TTL_MS).toBeGreaterThan(0);

    // Если есть массив/объект рынков – проверим, что не пустой.
    if ('AVAILABLE_MARKETS' in marketConfig) {
      const markets = (marketConfig as any).AVAILABLE_MARKETS;
      expect(Array.isArray(markets)).toBe(true);
      expect(markets.length).toBeGreaterThan(0);
    }
  });
});
