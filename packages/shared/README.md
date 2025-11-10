# @assetpredict/shared

Единый пакет с типами, DTO и Zod-схемами для использования в `apps/web` и `apps/api`. Обеспечивает типобезопасность и валидацию данных на обеих сторонах.

## Установка

Пакет публикуется локально через pnpm workspaces. Установка происходит автоматически при установке зависимостей в корне monorepo:

```bash
pnpm install
```

## Использование

### Импорт типов и схем

```typescript
import {
  // Типы
  type Timeframe,
  type Symbol,
  type Bar,
  type Bars,
  type ForecastCreateReq,
  type ForecastItem,
  type ForecastDetailRes,
  
  // Zod-схемы
  zForecastCreateReq,
  zForecastDetailRes,
  zBars,
  zTimeframe,
  
  // Константы
  SUPPORTED_TIMEFRAMES,
  MAX_HORIZON,
  MAX_BARS,
  
  // Утилиты
  formatZodErrors,
} from '@assetpredict/shared';
```

### Пример: валидация запроса

```typescript
import { zForecastCreateReq, formatZodErrors } from '@assetpredict/shared';

// В API endpoint
app.post('/forecasts', (req, res) => {
  const result = zForecastCreateReq.safeParse(req.body);
  
  if (!result.success) {
    return res.status(400).json({
      error: 'Validation failed',
      details: formatZodErrors(result.error),
    });
  }
  
  // result.data имеет тип ForecastCreateReq
  const { symbol, timeframe, horizon } = result.data;
  // ...
});
```

### Пример: валидация ответа

```typescript
import { zForecastDetailRes } from '@assetpredict/shared';

// В API endpoint
app.get('/forecasts/:id', async (req, res) => {
  const forecast = await getForecastById(req.params.id);
  
  // Валидация перед отправкой
  const result = zForecastDetailRes.safeParse(forecast);
  
  if (!result.success) {
    console.error('Invalid forecast data:', result.error);
    return res.status(500).json({ error: 'Internal server error' });
  }
  
  res.json(result.data);
});
```

### Пример: использование типов в TypeScript

```typescript
import type { ForecastCreateReq, ForecastItem, Timeframe } from '@assetpredict/shared';

function createForecast(req: ForecastCreateReq): Promise<ForecastItem> {
  // TypeScript проверяет типы на этапе компиляции
  if (!SUPPORTED_TIMEFRAMES.includes(req.timeframe)) {
    throw new Error('Unsupported timeframe');
  }
  
  // ...
}
```

## Структура пакета

```
packages/shared/
├── src/
│   ├── types/
│   │   ├── market.ts      # Timeframe, Symbol, Bar, Bars, Provider
│   │   └── common.ts      # BrandedId, ISODate, Pagination, Range
│   ├── dto/
│   │   └── forecast.ts    # ForecastCreateReq, ForecastItem, ForecastDetailRes, etc.
│   ├── schemas/
│   │   ├── market.schema.ts    # Zod-схемы для рыночных типов
│   │   ├── common.schema.ts    # Zod-схемы для общих типов
│   │   └── forecast.schema.ts  # Zod-схемы для DTO прогнозов
│   ├── utils/
│   │   └── zodErrors.ts   # Форматирование ошибок валидации
│   ├── version.ts
│   └── index.ts           # Главная точка входа
├── test/
│   ├── forecast.schema.spec.ts
│   └── market.schema.spec.ts
└── README.md
```

## Типы

### Рыночные типы (`types/market.ts`)

- **Timeframe**: `'1h' | '8h' | '1d' | '7d' | '1mo'` — поддерживаемые таймфреймы
- **Provider**: `'MOEX' | 'BINANCE' | 'CUSTOM'` — источники данных
- **Symbol**: `string` — символ инструмента (тикер)
- **Bar**: `[ts: number, open: number, high: number, low: number, close: number, volume?: number]` — один бар (свеча)
- **Bars**: `Bar[]` — массив баров, отсортированный от старых к новым

### Общие типы (`types/common.ts`)

- **BrandedId<T>**: брендированный тип для идентификаторов (например, `ForecastId = BrandedId<'forecast'> & string`)
- **ISODate**: `string` — дата в формате ISO 8601
- **Pagination**: `{ page: number; limit: number }` — параметры пагинации
- **Range**: `{ from?: ISODate; to?: ISODate }` — временной диапазон

### DTO прогноза (`dto/forecast.ts`)

- **ForecastCreateReq**: запрос на создание прогноза
  ```typescript
  {
    symbol: Symbol;
    timeframe: Timeframe;
    horizon: number;
    inputUntil?: ISODate;
    model?: string;
  }
  ```

- **ForecastItem**: элемент прогноза
  ```typescript
  {
    id: ForecastId;
    symbol: Symbol;
    timeframe: Timeframe;
    createdAt: ISODate;
    horizon: number;
    series: ForecastSeries;
  }
  ```

- **ForecastSeries**: прогнозные ряды
  ```typescript
  {
    p10: number[];  // 10-й перцентиль (нижняя граница)
    p50: number[];  // 50-й перцентиль (медиана)
    p90: number[];  // 90-й перцентиль (верхняя граница)
    t: number[];    // временные метки
  }
  ```

- **ForecastDetailRes**: детальный ответ о прогнозе (с `factors` и `metrics`)
- **ForecastListReq/Res**: запрос и ответ списка прогнозов с пагинацией

## Zod-схемы

Все публичные DTO и базовые типы имеют соответствующие Zod-схемы для валидации:

- `zTimeframe` — проверяет поддерживаемые таймфреймы
- `zBar` — проверяет структуру и логику OHLC
- `zBars` — проверяет массив баров и монотонность времени
- `zForecastCreateReq` — валидация запроса на создание прогноза
- `zForecastDetailRes` — валидация детального ответа
- И другие...

### Особенности валидации

- **zBars**: проверяет монотонность времени (timestamp не убывает)
- **zBar**: проверяет логику OHLC (high >= max(open, close), low <= min(open, close))
- **zForecastSeries**: проверяет одинаковую длину всех массивов и логику перцентилей (p10 <= p50 <= p90)
- **zForecastCreateReq**: ограничивает `horizon` значением `MAX_HORIZON` (500)

## Константы

- **SUPPORTED_TIMEFRAMES**: `['1h', '8h', '1d', '7d', '1mo']` — допустимые таймфреймы
- **SUPPORTED_PROVIDERS**: `['MOEX', 'BINANCE', 'CUSTOM']` — поддерживаемые провайдеры
- **MAX_HORIZON**: `500` — максимальный горизонт прогноза
- **MAX_BARS**: `50_000` — максимальное количество баров в ряде

## Скрипты

```bash
# Сборка пакета
pnpm build

# Проверка типов
pnpm typecheck

# Запуск тестов
pnpm test

# Линтинг
pnpm lint

# Полная проверка (lint + build + test)
pnpm check
```

## Версионирование

Пакет использует [Semantic Versioning](https://semver.org/):

- **MAJOR**: несовместимые изменения API
- **MINOR**: новая функциональность с обратной совместимостью
- **PATCH**: исправления ошибок с обратной совместимостью

При изменении типов или схем, которые могут сломать совместимость, необходимо обновить версию пакета.

## Тестирование

Все схемы покрыты юнит-тестами с позитивными и негативными сценариями:

```bash
pnpm test
```

Тесты проверяют:
- Валидацию корректных данных
- Отклонение невалидных данных
- Проверку граничных значений (MAX_HORIZON, MAX_BARS)
- Логику валидации (OHLC, перцентили, монотонность времени)

