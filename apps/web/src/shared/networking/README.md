# Networking module

Единый транспортный слой для REST API, используемый через RTK Query.
Компоненты и оркестратор не работают напрямую с `fetch` и URL - вся
сетевуха инкапсулирована в `baseQuery`

- `baseQuery` - единственная точка входа для REST-запросов в `backendApi`.
- Авторизация: если в `localStorage` есть `auth.token`, он добавляется как
  `Authorization: Bearer <token>`.
- Ошибки нормализуются в единый формат `HttpError`.
- Логирование запросов включается только в `development`.

## Структура

```
shared/networking/
  baseQuery.ts   // RTK Query transport
  errors.ts      // нормализация ошибок
  types.ts       // HttpError
  README.md
```

## Использование

`backendApi` использует `baseQuery`:

```ts
import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from '@/shared/networking/baseQuery';

export const backendApi = createApi({
  reducerPath: 'backendApi',
  baseQuery,
  endpoints: () => ({}),
});
```

Далее все доменные модули описываются через `injectEndpoints`:

```ts
export const forecastApi = backendApi.injectEndpoints({
  endpoints: (builder) => ({
    getForecasts: builder.query<ForecastListRes, ForecastListReq>({
      query: (params) => ({
        url: '/forecasts',
        method: 'GET',
        params,
      }),
    }),
  }),
});
```

## API модули

Доступные модули для работы с backend API:

- `auth.api.ts`
  - `useLoginMutation()` : POST `/auth/login` (сохраняет `auth.token`)
- `account.api.ts`
  - `useGetMeQuery()` : GET `/account`
- `forecast.api.ts`
  - `useCreateForecastMutation()` : POST `/forecast`
  - `useGetForecastsQuery()` : GET `/forecasts`
  - `useGetForecastByIdQuery()` : GET `/forecasts/:id`
- `history.api.ts`
  - `useGetHistoryQuery()` : GET `/forecasts` (алиас для истории)

## Ошибки

`baseQuery` приводит все ошибки к типу `HttpError`:

```ts
export type HttpError = {
  status: number;
  message: string;
  code?: string;
};
```

RTK Query будет возвращать их в `error` у результата хука
