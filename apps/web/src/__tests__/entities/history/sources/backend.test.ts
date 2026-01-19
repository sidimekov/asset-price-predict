import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { HistoryEntry } from '@/entities/history/model';
import { baseQuery } from '@/shared/networking/baseQuery';
import { backendHistorySource } from '@/entities/history/sources/backend';
import { DEFAULT_MODEL_VER } from '@/config/ml';

vi.mock('@/shared/networking/baseQuery', () => ({
  baseQuery: vi.fn(),
}));

const baseQueryMock = vi.mocked(baseQuery);

describe('backendHistorySource', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('maps listPage results to HistoryPage', async () => {
    baseQueryMock.mockResolvedValueOnce({
      data: {
        items: [
          {
            id: 'fc-1',
            symbol: 'BTC',
            timeframe: '1h',
            createdAt: '2025-01-01T00:00:00.000Z',
            horizon: 4,
          },
        ],
        total: 1,
        page: 2,
        limit: 5,
      },
    });

    const result = await backendHistorySource.listPage({
      page: 2,
      limit: 5,
    });

    expect(baseQueryMock).toHaveBeenCalledWith(
      {
        url: '/forecasts',
        method: 'GET',
        params: { page: 2, limit: 5 },
      },
      expect.anything(),
      {},
    );
    expect(result).toEqual({
      items: [
        {
          id: 'fc-1',
          created_at: '2025-01-01T00:00:00.000Z',
          symbol: 'BTC',
          tf: '1h',
          horizon: 4,
          provider: 'binance',
          p50: [],
          meta: { runtime_ms: 0, backend: 'server', model_ver: DEFAULT_MODEL_VER },
        },
      ],
      total: 1,
      page: 2,
      limit: 5,
    });
  });

  it('maps detailed forecast data into history entry', async () => {
    baseQueryMock.mockResolvedValueOnce({
      data: {
        id: 'fc-42',
        symbol: 'ETH',
        timeframe: '1d',
        createdAt: '2025-01-02T00:00:00.000Z',
        horizon: 8,
        series: {
          t: [1, 2],
          p50: [10, 20],
          p10: [8, 18],
          p90: [12, 22],
        },
        factors: [
          { name: 'A', impact: 1.5, shap: 0.5, conf: 0.9 },
          { name: 'B', impact: -2, shap: 0.2, conf: 0.1 },
        ],
      },
    });

    const entry = await backendHistorySource.getById('fc-42');

    expect(baseQueryMock).toHaveBeenCalled();
    expect(entry).toEqual({
      id: 'fc-42',
      created_at: '2025-01-02T00:00:00.000Z',
      symbol: 'ETH',
      tf: '1d',
      horizon: 8,
      provider: 'binance',
      p50: [
        [1, 10],
        [2, 20],
      ],
      p10: [
        [1, 8],
        [2, 18],
      ],
      p90: [
        [1, 12],
        [2, 22],
      ],
      explain: [
        {
          name: 'A',
          group: 'model',
          impact_abs: 1.5,
          sign: '+',
          shap: 0.5,
          confidence: 0.9,
        },
        {
          name: 'B',
          group: 'model',
          impact_abs: 2,
          sign: '-',
          shap: 0.2,
          confidence: 0.1,
        },
      ],
      meta: { runtime_ms: 0, backend: 'server', model_ver: DEFAULT_MODEL_VER },
    } as HistoryEntry);
  });

  it('returns null for missing id', async () => {
    baseQueryMock.mockResolvedValueOnce({
      error: { status: 404, message: 'Not found' },
    });

    const entry = await backendHistorySource.getById('missing');
    expect(entry).toBeNull();
  });

  it('list() delegates to listPage helper', async () => {
    baseQueryMock.mockResolvedValueOnce({
      data: {
        items: [
          {
            id: 'fc-2',
            symbol: 'BTC',
            timeframe: '1h',
            createdAt: '2025-01-03T00:00:00.000Z',
            horizon: 3,
          },
        ],
        total: 1,
        page: 1,
        limit: 10,
      },
    });

    const list = await backendHistorySource.list();
    expect(list).toHaveLength(1);
  });
});
