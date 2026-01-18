# Теория фронтенда: ответы на вопросы

## Вопрос 1. В чем заключается задача "bundling"? Какие проблемы решаются и каким образом?

**Ответ**

**Bundling** — это процесс сборки множества исходных файлов (JS/TS, CSS, изображения, шрифты и т.д.) в один или несколько финальных артефактов (бандлов), которые браузер будет загружать в продакшене. Цель — сделать загрузку и исполнение приложения быстрее, надежнее и предсказуемее.

### Какие проблемы решаются

1. **Слишком много запросов к серверу**
   * Без сборки каждый модуль/файл загружался бы отдельно, что увеличивает количество HTTP‑запросов и задержку.
   * Bundler объединяет файлы в один/несколько бандлов, уменьшая число запросов.

2. **Разная поддержка модулей в браузерах**
   * Исторически не все браузеры одинаково поддерживали ES‑модули и современный синтаксис.
   * Bundler делает транспиляцию (например, через Babel/TypeScript) и упаковывает код так, чтобы он работал в целевых браузерах.

3. **Зависимости (node_modules) не предназначены для прямой загрузки в браузере**
   * Пакеты часто написаны для Node.js или используют разные форматы модулей.
   * Bundler резолвит зависимости, преобразует форматы и складывает всё в браузерный бандл.

4. **Оптимизация производительности**
   * Bundler может делать tree‑shaking (удаление неиспользуемого кода), минификацию, сжатие, code splitting и ленивую загрузку.
   * Это уменьшает размер и ускоряет старт приложения.

5. **Управление статическими ресурсами**
   * Импорты CSS/изображений/шрифтов обрабатываются и попадают в финальную сборку по понятным правилам.
   * Bundler может выдать уникальные имена (content‑hash) для надежного кеширования.

### Как это работает (общая схема)

1. **Вход**: указанные entry‑points (например, `src/index.tsx`).
2. **Граф зависимостей**: bundler строит граф всех импортов.
3. **Трансформации**: применяются лоадеры/плагины (TypeScript → JS, SASS → CSS, минификация).
4. **Выход**: создаются финальные бандлы (JS/CSS/ассеты) и манифесты.

### Простой пример

```bash
# Пример с esbuild (упрощенно)
node -e "require('esbuild').build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  minify: true,
  outfile: 'dist/bundle.js'
}).catch(() => process.exit(1))"
```

**Что произойдет:**
* `src/index.ts` и все его зависимости будут собраны в `dist/bundle.js`.
* Код будет минифицирован.
* Браузеру нужно загрузить всего один файл.

### Пример в нашем проекте asset-price-predict

В `apps/web` сборка и бандлинг контролируются Next.js и его webpack‑конфигурацией. В `next.config.ts` есть настройка `transpilePackages` и алиасов, которые влияют на сборку:

```ts
const nextConfig: NextConfig = {
  reactStrictMode: true,
  basePath: basePath || undefined,
  assetPrefix: basePath ? `${basePath}/` : undefined,

  transpilePackages: ['@assetpredict/shared'],

  webpack(config) {
    config.resolve = config.resolve || {};

    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      '@': path.resolve(projectRoot, 'src'),
      '@shared': path.resolve(projectRoot, '../../packages/shared/src'),
    };

    return config;
  },
};
```

---

## Вопрос 2. Для чего нужен webpack-dev-server, как он работает?

**Ответ**

**webpack-dev-server** — это инструмент для локальной разработки, который запускает dev‑сервер с автоматической пересборкой бандлов и удобными возможностями вроде HMR (Hot Module Replacement). Он **не нужен в продакшене** — только для быстрого цикла разработки.

### Зачем нужен

1. **Автопересборка при изменениях**
   * При правке кода webpack пересобирает бандл автоматически.

2. **Мгновенное обновление браузера**
   * Сервер сигнализирует браузеру о необходимости обновления.

3. **HMR (горячая замена модулей)**
   * Вместо полной перезагрузки страницы обновляется только измененный модуль.
   * Это сохраняет состояние приложения и ускоряет разработку.

4. **Упрощенная отдача ассетов**
   * Бандлы обычно хранятся в памяти, а не записываются на диск.
   * Это быстрее и не загрязняет рабочую директорию.

### Как работает (коротко)

1. Запускается dev‑сервер на указанном порту.
2. Webpack собирает бандлы и хранит их в памяти.
3. Сервер отдает эти бандлы браузеру.
4. При изменениях в коде пересборка запускается автоматически.
5. Через WebSocket сервер уведомляет браузер — выполняется reload или HMR.

### Простой пример

```js
// webpack.config.js (минимальный пример)
module.exports = {
  mode: 'development',
  entry: './src/index.js',
  output: {
    filename: 'bundle.js',
    path: __dirname + '/dist',
  },
  devServer: {
    port: 3000,
    hot: true,
    open: true,
  },
};
```

```bash
# запуск
npx webpack serve
```

**Что произойдет:**
* Откроется `http://localhost:3000`.
* При сохранении файла код пересоберется.
* Страница обновится автоматически (или выполнится HMR).

### Пример в нашем проекте asset-price-predict

В приложении `apps/web` dev‑сервер запускается через Next.js, который обеспечивает HMR и пересборку:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build"
  }
}
```

Хотя мы не используем `webpack-dev-server` напрямую, поведение аналогично: локальный dev‑сервер, автопересборка и обновление браузера.

---

## Вопрос 3. Расскажите про назначение babeljs, как и какие задачи решает

**Ответ**

**Babel.js** — это транспилятор (компилятор) JavaScript, который преобразует современный код (ES2015+ и выше), JSX и другие расширения в более совместимый JavaScript для старых браузеров или специфических сред исполнения.

### Какие задачи решает Babel

1. **Совместимость с браузерами**
   * Преобразует новый синтаксис (например, optional chaining, nullish coalescing) в эквивалентный код, который понимают старые браузеры.
2. **Поддержка JSX/TSX**
   * Преобразует JSX в обычные вызовы `React.createElement` или другие runtime‑функции (в зависимости от конфигурации).
3. **Полная цепочка трансформаций**
   * Использует плагины и пресеты (`@babel/preset-env`, `@babel/preset-react`, `@babel/preset-typescript`) для гибкой настройки.
4. **Интеграция с bundler‑ами**
   * Babel обычно используется как этап внутри сборки (Webpack/Vite/Rollup), чтобы итоговый бандл подходил целевым браузерам.

### Как работает (схема)

1. **Парсинг**: Babel читает исходный код и строит AST (абстрактное синтаксическое дерево).
2. **Трансформации**: плагины модифицируют AST.
3. **Генерация**: из AST генерируется совместимый JavaScript.

### Простой пример

```bash
# преобразование файла src/index.js
npx babel src/index.js --out-file dist/index.js --presets=@babel/preset-env
```

**Что произойдет:**
* Новые возможности языка будут преобразованы в совместимый код.
* При необходимости можно включать полифиллы (через preset-env и core-js).

### Пример в нашем проекте asset-price-predict

В UI‑коде есть современный синтаксис (optional chaining), который обычно требует транспиляции для старых браузеров. Например, в `AssetCatalogPanel.tsx`:

```ts
const assetClass = item.assetClass?.toLowerCase() || '';

if (
  item.name?.toLowerCase().includes('облигация') ||
  item.name?.toLowerCase().includes('bond') ||
  assetClass.includes('bond')
) {
  return 'bonds';
}
```

В нашем проекте эту задачу выполняет сборщик Next.js (SWC), но с точки зрения назначения Babel цель такая же — привести современный синтаксис к поддерживаемому набору.

---

## Вопрос 4. Назначение browserslist, как использовать в проекте, как работает browserslist

**Ответ**

**Browserslist** — это стандарт описания целевых браузеров, который используют инструменты фронтенда (Babel, Autoprefixer, PostCSS, ESLint и др.) для принятия решений о том, какой код/префиксы нужны для поддержки нужных версий браузеров.

### Назначение Browserslist

1. **Единая точка правды**
   * Вы описываете целевые браузеры один раз, а инструменты автоматически подстраиваются под них.
2. **Оптимизация сборки**
   * Babel не будет транспилировать то, что уже поддерживается.
   * Autoprefixer добавит только нужные CSS‑префиксы.
3. **Контроль совместимости**
   * Команда заранее понимает, какие браузеры поддерживаются.

### Как работает

1. В проекте задается список браузеров (в `package.json` или `.browserslistrc`).
2. Инструменты (Babel/Autoprefixer) читают эти правила.
3. На основе реальных данных (caniuse) выбирается набор нужных трансформаций.

### Как использовать в проекте

**Вариант 1: в `package.json`**

```json
{
  "browserslist": [
    ">0.5%",
    "last 2 versions",
    "not dead"
  ]
}
```

**Вариант 2: `.browserslistrc`**

```
>0.5%
last 2 versions
not dead
```

### Простой пример

Если указать:

```
last 2 versions
```

* Babel будет транспилировать код только под последние версии популярных браузеров.
* Autoprefixer добавит минимум необходимых префиксов.

### Пример в нашем проекте asset-price-predict

CSS‑код проекта проходит через PostCSS (см. конфиг) и включает современные свойства, для которых инструменты вроде Autoprefixer могут добавлять префиксы на основе Browserslist:

```js
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};
```

```css
.filter-categories {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
}
```

Если добавить `browserslist`, он будет определять, какие префиксы нужны для подобных правил.

---

## Вопрос 5. Назначение Flux архитектуры, из каких элементов состоит, какие задачи решает? Реализуйте модули для Flux, продемонстрируйте как использовать в вашем проекте

**Ответ**

**Flux** — это архитектурный паттерн для фронтенд‑приложений с **однонаправленным потоком данных**. Он помогает упорядочить управление состоянием, сделать обновления предсказуемыми и убрать хаотичные взаимозависимости между компонентами.

### Какие задачи решает Flux

1. **Предсказуемость состояния**
   * Состояние меняется только через строго определенный поток действий.
2. **Разделение ответственности**
   * Действия, логика хранения состояния и UI разделены по ролям.
3. **Удобство отладки**
   * Понятно, какое событие привело к какому изменению состояния.

### Из каких элементов состоит Flux

1. **Action** — объект, описывающий событие (что произошло).
2. **Dispatcher** — центральный регистратор, который доставляет действия в сторы.
3. **Store** — хранит состояние и бизнес‑логику, реагирует на действия.
4. **View** — UI‑компоненты, которые подписываются на стор и отправляют действия.

### Простой пример: реализация Flux‑модулей

**dispatcher.js**

```js
export class Dispatcher {
  constructor() {
    this.handlers = new Set();
  }

  register(handler) {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  dispatch(action) {
    this.handlers.forEach((handler) => handler(action));
  }
}
```

**actions.js**

```js
export const CounterActionTypes = {
  INCREMENT: 'counter/increment',
  DECREMENT: 'counter/decrement',
};

export const CounterActions = {
  increment() {
    return { type: CounterActionTypes.INCREMENT };
  },
  decrement() {
    return { type: CounterActionTypes.DECREMENT };
  },
};
```

**store.js**

```js
import { CounterActionTypes } from './actions.js';

export class CounterStore {
  constructor(dispatcher) {
    this.value = 0;
    this.listeners = new Set();

    dispatcher.register((action) => {
      switch (action.type) {
        case CounterActionTypes.INCREMENT:
          this.value += 1;
          this.emitChange();
          break;
        case CounterActionTypes.DECREMENT:
          this.value -= 1;
          this.emitChange();
          break;
        default:
          break;
      }
    });
  }

  getState() {
    return { value: this.value };
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  emitChange() {
    this.listeners.forEach((listener) => listener(this.getState()));
  }
}
```

**view.js** (упрощенная демонстрация без фреймворка)

```js
import { Dispatcher } from './dispatcher.js';
import { CounterActions } from './actions.js';
import { CounterStore } from './store.js';

const dispatcher = new Dispatcher();
const store = new CounterStore(dispatcher);

store.subscribe((state) => {
  console.log('Counter state:', state.value);
});

dispatcher.dispatch(CounterActions.increment());
dispatcher.dispatch(CounterActions.increment());
dispatcher.dispatch(CounterActions.decrement());
```

**Что происходит:**
* View инициирует действие через `dispatcher.dispatch(...)`.
* Dispatcher передает действие в Store.
* Store обновляет состояние и уведомляет подписчиков.

### Пример использования в нашем проекте asset-price-predict

В проекте Flux‑подход реализован через Redux (однонаправленный поток и store). Например, `catalogSlice` описывает actions/reducers:

```ts
export const catalogSlice = createSlice({
  name: 'catalog',
  initialState,
  reducers: {
    setProvider: (state, action: PayloadAction<Provider>) => {
      state.provider = action.payload;
      state.results = [];
      state.query = '';
    },
  },
});
```

И в UI мы диспатчим action, что соответствует потоку “View → Action → Store → View”:

```tsx
const dispatch = useAppDispatch();

dispatch(setProvider(p));
```

---

## Вопрос 6. Назначение Redux, как работает функция connect? Напишите простейшую реализацию Redux

**Ответ**

**Redux** — это библиотека управления состоянием, которая основана на принципах Flux и Redux‑архитектуры: однонаправленный поток данных, единый store, обновления через reducer‑ы и экшены.

### Назначение Redux

1. **Единое глобальное состояние**
   * Вся модель приложения хранится в одном store.
2. **Предсказуемые изменения**
   * Состояние изменяется только через чистые функции (reducers).
3. **Отладка и воспроизводимость**
   * Легко повторить последовательность действий, которая привела к состоянию.

### Как работает `connect`

`connect` — это функция из `react-redux`, которая **подписывает React‑компонент на store**:

1. `mapStateToProps` берет нужные данные из store и передает как props.
2. `mapDispatchToProps` создает props‑функции, которые диспатчат actions.
3. При изменении store компонент автоматически перерисовывается.

### Простейшая реализация Redux (mini‑redux)

```js
export function createStore(reducer, preloadedState) {
  let state = preloadedState;
  const listeners = new Set();

  return {
    getState() {
      return state;
    },
    dispatch(action) {
      state = reducer(state, action);
      listeners.forEach((listener) => listener());
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
```

**Reducer и использование:**

```js
const initialState = { value: 0 };

function counterReducer(state = initialState, action) {
  switch (action.type) {
    case 'increment':
      return { value: state.value + 1 };
    case 'decrement':
      return { value: state.value - 1 };
    default:
      return state;
  }
}

const store = createStore(counterReducer, initialState);

store.subscribe(() => {
  console.log('State:', store.getState());
});

store.dispatch({ type: 'increment' });
store.dispatch({ type: 'increment' });
store.dispatch({ type: 'decrement' });
```

### Пример использования Redux в нашем проекте asset-price-predict

В `apps/web` store создается через `configureStore` и подключается через `Provider`:

```ts
export const store = configureStore({
  reducer: {
    forecast: forecastReducer,
    timeseries: timeseriesReducer,
    catalog: catalogReducer,
    [marketApi.reducerPath]: marketApi.reducer,
    [backendApi.reducerPath]: backendApi.reducer,
  },
});
```

```tsx
export function StoreProvider({ children }: { children: React.ReactNode }) {
  return <Provider store={store}>{children}</Provider>;
}
```

---

## Вопрос 7. CI/CD: постройте пайплайн для CI/CD в front-end проекте. Какие инструменты используете? Какие задачи решает?

**Ответ**

**CI/CD** — это набор практик и инструментов для автоматической проверки, сборки, тестирования и доставки фронтенд‑приложения. Цель — быстро получать обратную связь, снижать количество ошибок и автоматизировать релизы.

### Какие задачи решает CI/CD

1. **Автоматическая проверка качества**
   * Линтеры и форматирование предотвращают стилистические и логические ошибки.
2. **Запуск тестов**
   * Unit/Integration/E2E‑тесты подтверждают корректность приложения.
3. **Сборка артефактов**
   * Бандлы и Docker‑образы собираются одинаково на всех окружениях.
4. **Доставка и деплой**
   * Автоматический выпуск новых версий на сервер.

### Типичный пайплайн для фронтенда

1. **Lint** → 2. **Unit/Integration Tests** → 3. **Build** → 4. **E2E** → 5. **Deploy**

### Пример CI/CD пайплайна (GitHub Actions)

**lint.yml** — запуск линтеров:

```yaml
jobs:
  run-linters:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - uses: pnpm/action-setup@v2
        with:
          version: 9
      - name: Run linters
        run: pnpm run lint
```

**deploy.yml** — сборка Docker‑образов и деплой:

```yaml
      - name: Build and push WEB
        uses: docker/build-push-action@v6
        with:
          file: apps/web/Dockerfile
          push: true
          tags: |
            ${{ env.IMAGE_WEB }}:latest
            ${{ env.IMAGE_WEB }}:${{ github.sha }}

      - name: Deploy on server (pull & up)
        uses: appleboy/ssh-action@v1.0.3
```

### Пример в нашем проекте asset-price-predict

CI/CD уже реализован через GitHub Actions:

```yaml
      - name: Run tests
        run: pnpm -r test --if-present

      - name: Run tests with coverage
        run: pnpm -r test-cov
```

```yaml
      - name: Playwright e2e в контейнере (к сервисам через host)
        run: |
          docker run --rm \
            --add-host=host.docker.internal:host-gateway \
            -v "${{ github.workspace }}:/repo" \
            -w /repo \
            -e CI=true \
            -e NEXT_TELEMETRY_DISABLED=1 \
            -e NEXT_PUBLIC_BACKEND_URL=http://host.docker.internal:3001 \
            mcr.microsoft.com/playwright:v1.56.0-jammy \
            bash -lc "corepack enable && pnpm install --frozen-lockfile && pnpm -F @assetpredict/web e2e"
```

Это означает, что проект автоматически проверяется (lint/tests), прогоняет e2e и деплоится после успешной сборки образов.

---

## Вопрос 8. Тестирование: что такое пирамида тестирования? Приведите пример тестов для каждого уровня, продемонстрируйте тесты каждого уровня в вашем проекте

**Ответ**

**Пирамида тестирования** — это подход к распределению тестов по уровням:

1. **Unit‑тесты (основание пирамиды)** — много быстрых и дешевых тестов для отдельных функций/модулей.
2. **Integration‑тесты (середина)** — меньше тестов, проверяющих взаимодействие нескольких модулей.
3. **E2E‑тесты (верх)** — немного дорогих тестов, проверяющих весь пользовательский сценарий.

### Примеры тестов по уровням

**Unit**: тестируем reducer без UI.

```ts
describe('setProvider', () => {
  it('changes provider and clears results + query', () => {
    const state = catalogSlice.reducer(
      {
        ...initialState(),
        provider: 'binance',
        results: [createCatalogItem('X', 'Test Asset', 'BINANCE')],
        query: 'test',
      },
      setProvider('moex'),
    );

    expect(state.provider).toBe('moex');
  });
});
```

**Integration**: проверяем, что Redux‑хуки работают в связке с реальным Provider и store.

```tsx
render(
  <Provider store={store}>
    <TestComponent />
  </Provider>,
);

expect(typeof capturedDispatch).toBe('function');
expect(capturedState).toEqual(store.getState());
```

**E2E**: тестируем поведение страницы в браузере.

```ts
test('should load and show table header', async ({ page }) => {
  await page.addInitScript((items) => {
    window.localStorage.setItem('localForecasts', JSON.stringify(items));
  }, seedHistory);
  await page.goto(buildUrl('/history'));

  const table = page.locator('table');
  await expect(table).toBeVisible();
});
```

### Пример в нашем проекте asset-price-predict

* **Unit**: `apps/web/src/__tests__/features/asset-catalog/catalogSlice.test.ts` проверяет редьюсеры и локальное состояние.
* **Integration**: `apps/web/src/__tests__/shared/store/hooks.test.tsx` тестирует `useAppDispatch`/`useAppSelector` внутри `Provider`.
* **E2E**: `apps/web/e2e/history.playwright.ts` проверяет страницу истории через Playwright.

---

## Вопрос 9. Какими способами может быть организована перерисовка представления при изменении данных в UI‑библиотеках? Как это работает в библиотеке, которую используете вы?

**Ответ**

### Способы организации перерисовки UI

1. **Наблюдатели (Observer)**
   * Компоненты подписываются на изменения состояния и перерисовываются при уведомлении.
2. **Поток данных (Unidirectional data flow)**
   * Изменения состояния проходят через единый источник правды, UI обновляется при изменении store.
3. **Реактивность (Reactive systems)**
   * Компонент автоматически реагирует на изменения реактивных переменных (Vue, Solid).
4. **Сигналы/стримы**
   * Представление подписывается на события (RxJS, signals) и перерисовывается при эмиссии.
5. **Диффинг виртуального DOM**
   * Новое дерево UI сравнивается со старым, и DOM обновляется минимально (React).

### Как это работает в React (наш проект)

React использует **Virtual DOM** и **подписку на состояние** через хуки. Когда состояние меняется, React пересчитывает дерево и применяет минимальные изменения к DOM. Если используется Redux, `useSelector` подписывает компонент на часть store и вызывает перерендер только при её изменении.

### Простой пример (React)

```tsx
const [count, setCount] = useState(0);

return <button onClick={() => setCount(count + 1)}>{count}</button>;
```

### Пример в нашем проекте asset-price-predict

В `apps/web` компонент подписывается на Redux‑store и перерисовывается при изменении выбранного провайдера:

```tsx
const dispatch = useAppDispatch();
const provider = useAppSelector(selectCurrentProvider);

<button
  key={p}
  aria-selected={provider === p}
  onClick={() => {
    dispatch(setProvider(p));
  }}
>
  {p.toUpperCase()}
</button>
```

Здесь `useAppSelector` подписывает компонент на `provider`, а `dispatch(setProvider(p))` меняет store → React перерисовывает кнопки с актуальным состоянием.

---

## Вопрос 10. Иммутабельность: что такое иммутабельность? Какие проблемы решает? Как применяется в front-end? Как применяется в вашем проекте? Какие недостатки?

**Ответ**

**Иммутабельность** — это принцип, при котором данные не изменяются «на месте». Вместо мутации создается новый объект/структура с изменениями.

### Какие проблемы решает

1. **Предсказуемость**
   * Любое изменение — это новый объект, легче отслеживать, что изменилось.
2. **Простота сравнения**
   * Ссылочное сравнение (`prev !== next`) быстро определяет, было ли изменение.
3. **Отладка и история**
   * Легко реализовать time‑travel/debugging, откаты состояний.

### Как применяется во фронтенде

* В Redux/Vuex/MobX state хранится как immutable‑объекты.
* React использует сравнение ссылок, чтобы решать, когда перерисовывать компоненты.
* В тестах удобно сравнивать новые/старые состояния.

### Недостатки

1. **Дополнительные аллокации**
   * Нужно создавать новые объекты/массивы.
2. **Сложность при глубокой вложенности**
   * Без библиотек обновления могут быть громоздкими.
3. **Потенциальные затраты на память**
   * Больше объектов в памяти при частых обновлениях.

### Пример в нашем проекте asset-price-predict

В Redux Toolkit используется Immer, поэтому код выглядит как «мутация», но фактически создает новое состояние:

```ts
export const catalogSlice = createSlice({
  name: 'catalog',
  initialState,
  reducers: {
    setProvider: (state, action: PayloadAction<Provider>) => {
      state.provider = action.payload;
      state.results = [];
      state.query = '';
    },
  },
});
```

Иммутабельность позволяет Redux корректно определить изменения и триггерить перерисовку компонентов, подписанных на store.

---

## Вопрос 11. Как работает HTML5 event loop, какие проблемы решает?

**Ответ**

**Event Loop** — это механизм, который управляет выполнением JavaScript в браузере: координирует очередь задач (task queue), микрозадач (microtask queue) и отрисовку.

### Какие проблемы решает

1. **Однопоточность JS**
   * JS исполняется в одном потоке, Event Loop позволяет не блокировать UI.
2. **Асинхронность**
   * События, таймеры, сетевые запросы обрабатываются по очередям.
3. **Согласование с рендерингом**
   * Браузер вставляет этапы перерисовки между задачами.

### Как работает (упрощенно)

1. Выполняется текущий стек вызовов.
2. Очищаются **микрозадачи** (Promise callbacks).
3. Выполняются **задачи** из очереди (setTimeout, events, IO).
4. При необходимости браузер делает **рендер**.

### Простой пример

```js
console.log('A');
setTimeout(() => console.log('B'), 0);
Promise.resolve().then(() => console.log('C'));
console.log('D');
// Вывод: A, D, C, B
```

### Пример в нашем проекте asset-price-predict

В `mlWorkerClient` мы используем асинхронный обмен сообщениями с Web Worker. Сообщение попадает в очередь задач, а ответ обрабатывается через `onmessage`, что является частью event loop:

```ts
const w = new Worker(new URL('../../workers/ml-worker.ts', import.meta.url), {
  type: 'module',
});

w.onmessage = (event: MessageEvent<InferDoneMessage | InferErrorMessage>) => {
  const msg = event.data as any;
  const { id, type } = msg;
  // обработка результата воркера
};
```

---

## Вопрос 12. WebWorkers. Atomics API: какую проблему решают? Приведите пример кода как с этим работать

**Ответ**

### Web Workers: назначение

**Web Worker** позволяет выполнить тяжелые вычисления в отдельном потоке, чтобы не блокировать UI. Это решает проблему «фризов» интерфейса при сложных вычислениях или парсинге данных.

### Atomics API: назначение

**Atomics** и `SharedArrayBuffer` позволяют безопасно работать с общей памятью между потоками. Это решает проблему синхронизации данных при параллельных вычислениях (например, разделяемые счетчики, флаги готовности).

### Простой пример Web Worker

**worker.js**

```js
self.onmessage = (event) => {
  const result = event.data * 2;
  self.postMessage(result);
};
```

**main.js**

```js
const worker = new Worker('worker.js');
worker.onmessage = (event) => console.log('Result:', event.data);
worker.postMessage(21);
```

### Простой пример Atomics + SharedArrayBuffer

```js
// main.js
const shared = new SharedArrayBuffer(4);
const counter = new Int32Array(shared);
counter[0] = 0;

const worker = new Worker('worker.js');
worker.postMessage(shared);

Atomics.store(counter, 0, 1);
Atomics.notify(counter, 0, 1);
```

```js
// worker.js
self.onmessage = (event) => {
  const counter = new Int32Array(event.data);
  Atomics.wait(counter, 0, 0);
  const value = Atomics.load(counter, 0);
  self.postMessage(value);
};
```

### Пример в нашем проекте asset-price-predict

В `apps/web` используется Web Worker для ML‑инференса, чтобы вычисления не блокировали UI. Создание воркера и обмен сообщениями выглядит так:

```ts
const w = new Worker(new URL('../../workers/ml-worker.ts', import.meta.url), {
  type: 'module',
});

w.onmessage = (event: MessageEvent<InferDoneMessage | InferErrorMessage>) => {
  const msg = event.data as any;
  const { id, type } = msg;
  // resolve/reject pending запросов
};
```

А запрос на вычисление отправляется через `postMessage`:

```ts
worker.postMessage(req);
```

---

## Вопрос 13. WebAssembly: какую проблему решает?

**Ответ**

**WebAssembly (Wasm)** — это бинарный формат для выполнения кода в браузере с близкой к нативной производительностью. Он решает проблему **медленной работы тяжелых вычислений в JS** (машинное обучение, обработка изображений, физика) и позволяет переносить код из C/C++/Rust в веб.

### Что дает Wasm

1. **Высокая производительность**
   * Компилированный код выполняется быстрее, чем интерпретируемый JS.
2. **Кросс‑платформенность**
   * Один бинарник работает в разных браузерах.
3. **Безопасная песочница**
   * Код выполняется изолированно и не имеет прямого доступа к системе.

### Простой пример

```js
const wasmModule = await WebAssembly.instantiateStreaming(fetch('math.wasm'));
const { add } = wasmModule.instance.exports;
console.log(add(2, 3)); // 5
```

### Пример в нашем проекте asset-price-predict

В `apps/web` используется `onnxruntime-web` с Wasm‑бэкендом для инференса моделей. Мы явно выбираем провайдера `wasm` и конфигурируем пути к wasm‑бинарникам:

```ts
ort.env.wasm.numThreads = 1;
ort.env.wasm.simd = true;
ort.env.wasm.wasmPaths =
  ort.env.wasm.wasmPaths || `${BASE_PATH}/onnxruntime/`;
```

```ts
const session = await tryCreateSession('wasm', candidates);
```

Это позволяет выполнять ML‑модель прямо в браузере через WebAssembly.

---

## Вопрос 14. Service Worker: какую проблему решает? Приведите пример кода как с этим работать

**Ответ**

**Service Worker** — это фоновой скрипт браузера, который перехватывает сетевые запросы и позволяет реализовывать офлайн‑режим, кеширование, push‑уведомления и ускорение загрузки.

### Какие проблемы решает

1. **Офлайн‑доступ**
   * Приложение работает даже без сети.
2. **Ускорение загрузки**
   * Статические ресурсы берутся из кеша.
3. **Контроль сетевых стратегий**
   * Возможность выбирать стратегии: cache‑first, network‑first и т.д.

### Простой пример регистрации Service Worker

```js
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js');
  });
}
```

### Простой пример Service Worker (sw.js)

```js
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('static-v1').then((cache) => {
      return cache.addAll(['/index.html', '/styles.css']);
    }),
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request)),
  );
});
```

### Пример в нашем проекте asset-price-predict

В текущем коде `apps/web` Service Worker не зарегистрирован, но его можно подключить в `layout.tsx` или через отдельный модуль в `app/`:

```tsx
useEffect(() => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js');
  }
}, []);
```

Так можно добавить офлайн‑кеш и ускорить загрузку статических файлов.
