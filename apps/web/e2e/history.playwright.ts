import { test, expect } from '@playwright/test';
import { buildUrl } from './utils/basePath';

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
    explain: [{ name: 'Factor A', group: 'g1', impact_abs: 0.12, sign: '+' }],
  },
];

const accountStub = {
  id: 'e2e-user',
  email: 'e2e@example.com',
  username: 'E2E User',
  avatarUrl: '/images/profile-avatar.png',
};

test.describe('History Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/account**', async (route) => {
      const request = route.request();
      const url = new URL(request.url());
      const isApiCall =
        url.pathname === '/account' &&
        (request.resourceType() === 'fetch' ||
          request.resourceType() === 'xhr');

      if (!isApiCall) {
        await route.continue();
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(accountStub),
      });
    });

    await page.addInitScript(() => {
      window.localStorage.setItem('auth.token', 'e2e-token');
    });
  });

  test('should load and show table header', async ({ page }) => {
    const accountResponse = page.waitForResponse((response) =>
      response.url().includes('/account'),
    );
    await page.addInitScript((items) => {
      window.localStorage.setItem('localForecasts', JSON.stringify(items));
    }, seedHistory);
    await page.addInitScript(() => {
      window.localStorage.setItem('auth.token', 'e2e-token');
    });
    await page.goto(buildUrl('/history'));
    await accountResponse;

    // Дождались самой таблицы
    const table = page.locator('table');
    await expect(table).toBeVisible();

    // Берём все th из thead и сравниваем текст по порядку
    const ths = table.locator('thead th');
    await expect(ths).toHaveCount(5);

    await expect(ths).toHaveText(
      [
        'Asset',
        'Date',
        'Model',
        'Provider',
        'Period',
      ],
      { useInnerText: true }, // чтобы нормально схлопывались пробелы/переносы
    );
  });

  test('should type into Search input', async ({ page }) => {
    const accountResponse = page.waitForResponse((response) =>
      response.url().includes('/account'),
    );
    await page.addInitScript((items) => {
      window.localStorage.setItem('localForecasts', JSON.stringify(items));
    }, seedHistory);
    await page.addInitScript(() => {
      window.localStorage.setItem('auth.token', 'e2e-token');
    });
    await page.goto(buildUrl('/history'));
    await accountResponse;
    const input = page.getByPlaceholder('Search');
    await input.fill('btc');
    await expect(input).toHaveValue('btc');
  });
});
