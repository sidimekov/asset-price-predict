import type { BaseQueryApi, FetchArgs } from '@reduxjs/toolkit/query';
import type {
  ForecastDetailRes,
  ForecastListItem,
  ForecastListRes,
} from '@assetpredict/shared';
import { baseQuery } from '@/shared/networking/baseQuery';
import type { HistoryEntry } from '../model';
import type {
  HistoryPage,
  HistoryPageRequest,
  HistoryRepository,
} from '../repository';

const makeBaseQueryApi = (): BaseQueryApi => ({
  signal: new AbortController().signal,
  abort: () => undefined,
  dispatch: (() => undefined) as BaseQueryApi['dispatch'],
  getState: () => ({}),
  extra: undefined,
  endpoint: '',
  type: 'query',
});

const mapListItem = (item: ForecastListItem): HistoryEntry => ({
  id: item.id,
  created_at: item.createdAt,
  symbol: item.symbol,
  tf: item.timeframe,
  horizon: item.horizon,
  provider: 'BACKEND',
  p50: [],
  meta: {
    runtime_ms: 0,
    backend: 'server',
  },
});

const zipSeries = (series?: { t?: number[] }, values?: number[]) => {
  if (!series || !Array.isArray(series.t) || series.t.length === 0) {
    return [];
  }
  if (!values?.length) {
    return [];
  }
  const zipped: Array<[number, number]> = [];
  for (let index = 0; index < values.length; index += 1) {
    const ts = series.t[index];
    const value = values[index];
    if (typeof ts === 'number' && typeof value === 'number') {
      zipped.push([ts, value] as [number, number]);
    }
  }
  return zipped;
};

const mapDetail = (item: ForecastDetailRes): HistoryEntry => {
  const explain =
    item.factors?.map((factor) => {
      const sign: '+' | '-' = factor.impact >= 0 ? '+' : '-';
      return {
        name: factor.name,
        group: 'model',
        sign,
        impact_abs: Math.abs(factor.impact),
        shap: factor.shap,
        confidence: factor.conf,
      };
    }) ?? undefined;

  return {
    id: item.id,
    created_at: item.createdAt,
    symbol: item.symbol,
    tf: item.timeframe,
    horizon: item.horizon,
    provider: 'BACKEND',
    p50: zipSeries(item.series, item.series.p50),
    p10: zipSeries(item.series, item.series.p10),
    p90: zipSeries(item.series, item.series.p90),
    explain,
    meta: {
      runtime_ms: 0,
      backend: 'server',
    },
  };
};

type BaseQueryArgs = string | FetchArgs;

const callBaseQuery = async <T>(args: BaseQueryArgs) => {
  const result = await baseQuery(args, makeBaseQueryApi(), {});
  if ('error' in result) {
    throw result.error;
  }
  return result.data as T;
};

const mapListResponse = (res: ForecastListRes): HistoryPage => ({
  items: res.items.map(mapListItem),
  total: res.total,
  page: res.page,
  limit: res.limit,
});

export const backendHistorySource: HistoryRepository = {
  async list() {
    const { items } = await backendHistorySource.listPage({
      page: 1,
      limit: 10_000,
    });
    return items;
  },

  async listPage(req: HistoryPageRequest) {
    const page = Math.max(1, req.page ?? 1);
    const limit = Math.max(1, req.limit ?? 20);
    const result = await callBaseQuery<ForecastListRes>({
      url: '/forecasts',
      method: 'GET',
      params: { page, limit },
    });
    return mapListResponse(result);
  },

  async getById(id: string) {
    if (!id) return null;
    try {
      const result = await callBaseQuery<ForecastDetailRes>({
        url: `/forecasts/${encodeURIComponent(id)}`,
        method: 'GET',
      });
      return mapDetail(result);
    } catch (err: unknown) {
      if (typeof err === 'object' && err !== null && 'status' in err) {
        const httpErr = err as { status: number };
        if (httpErr.status === 404) {
          return null;
        }
      }
      throw err;
    }
  },

  async save() {
    return;
  },

  async remove() {
    return;
  },

  async clear() {
    return;
  },
};
