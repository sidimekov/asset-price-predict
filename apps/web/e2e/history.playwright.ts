import { test, expect } from '@playwright/test';

const basePath = (process.env.NEXT_PUBLIC_BASE_PATH || '').replace(/\/$/, '');
const withBasePath = (path: string) => `${basePath}${path}`;

const seedHistory = [
  {
    id: 'e2e-1',
    created_at: '2025-10-28T10:00:00.000Z',
    symbol: 'BTC',
    tf: '1h',
    horizon: 12,
    provider: 'MOEX',
    p50: [
      [1, 100],
      [2, 101],
    ],
    meta: { runtime_ms: 12, backend: 'client', model_ver: 'v1' },
    explain: [
      { name: 'Factor A', group: 'g1', impact_abs: 0.12, sign: '+' },
    ],
  },
];

test.describe('History Page', () => {
  test('should load and show table header', async ({ page }) => {
    await page.addInitScript((items) => {
      window.localStorage.setItem('localForecasts', JSON.stringify(items));
    }, seedHistory);
    await page.goto(withBasePath('/history'));

    // Дождались самой таблицы
    const table = page.locator('table');
    await expect(table).toBeVisible();

    // Берём все th из thead и сравниваем текст по порядку
    const ths = table.locator('thead th');
    await expect(ths).toHaveCount(6); // 5 колонок + последний объединённый заголовок

    await expect(ths).toHaveText(
      [
        'Asset',
        'Date',
        'Model',
        'Provider',
        'Period',
        'Factors (TOP 5): impact, SHAP, Conf.',
      ],
      { useInnerText: true }, // чтобы нормально схлопывались пробелы/переносы
    );
  });

  test('should type into Search input', async ({ page }) => {
    await page.addInitScript((items) => {
      window.localStorage.setItem('localForecasts', JSON.stringify(items));
    }, seedHistory);
    await page.goto(withBasePath('/history'));
    const input = page.getByPlaceholder('Search');
    await input.fill('btc');
    await expect(input).toHaveValue('btc');
  });
});
