import { describe, it, expectTypeOf } from 'vitest';
import type { AccountProfile, AccountRes } from '../src/dto/account.js';
import type { AuthUser, LoginReq, LoginRes } from '../src/dto/auth.js';
import type {
  ForecastCreateReq,
  ForecastDetailRes,
  ForecastListRes,
} from '../src/dto/forecast.js';

describe('DTO types', () => {
  it('AccountRes совпадает с AccountProfile', () => {
    const profile: AccountProfile = {
      id: 'u1' as AccountProfile['id'],
      username: 'Demo',
      login: 'demo',
      email: 'demo@example.com',
    };

    expectTypeOf(profile).toMatchTypeOf<AccountRes>();
  });

  it('Auth DTO поддерживает обязательные и опциональные поля', () => {
    const user: AuthUser = {
      id: 'u1' as AuthUser['id'],
      email: 'user@example.com',
    };

    const loginReq: LoginReq = {
      email: 'user@example.com',
      password: 'secret',
    };

    const loginRes: LoginRes = {
      token: 'mock',
      user,
    };

    expectTypeOf(loginReq).toMatchTypeOf<LoginReq>();
    expectTypeOf(loginRes.user).toMatchTypeOf<AuthUser>();
  });

  it('Forecast DTO включает базовые и детальные поля', () => {
    const createReq: ForecastCreateReq = {
      symbol: 'AAPL',
      timeframe: '1d',
      horizon: 12,
    };

    const detailRes: ForecastDetailRes = {
      id: 'f1' as ForecastDetailRes['id'],
      symbol: 'AAPL',
      timeframe: '1d',
      createdAt: '2025-01-31T12:00:00Z',
      horizon: 12,
      series: {
        p10: [1],
        p50: [2],
        p90: [3],
        t: [1000],
      },
      factors: [{ name: 'volume', impact: 0.1, shap: 0.2, conf: 0.9 }],
      metrics: { mae: 0.2, mape: 0.1, coverage: 0.95 },
    };

    const listRes: ForecastListRes = {
      items: [
        {
          id: 'f1' as ForecastDetailRes['id'],
          symbol: 'AAPL',
          timeframe: '1d',
          createdAt: '2025-01-31T12:00:00Z',
          horizon: 12,
        },
      ],
      total: 1,
      page: 1,
      limit: 20,
    };

    expectTypeOf(createReq).toMatchTypeOf<ForecastCreateReq>();
    expectTypeOf(detailRes).toMatchTypeOf<ForecastDetailRes>();
    expectTypeOf(listRes.items[0]).toMatchTypeOf<ForecastListRes['items'][0]>();
  });
});
