// apps/web/e2e/history.test.ts
import { test, expect } from '@playwright/test';

test.describe('History Page', () => {
  test('should load and show table header', async ({ page }) => {
    await page.goto('/history');

    // дождаться таблицы
    const table = page.locator('table');
    await expect(table).toBeVisible();

    const headerRow = table.locator('thead tr').first();
    await expect(headerRow).toBeVisible();

    // проверяем, что в первой строке хедера есть нужные заголовки
    await expect(headerRow).toContainText('Asset');
    await expect(headerRow).toContainText('Date');
    await expect(headerRow).toContainText('Model');
    await expect(headerRow).toContainText('Input');
    await expect(headerRow).toContainText('Period');
    await expect(headerRow).toContainText(/Factors \(TOP 5\):/i);
  });

  test('should type into Search input', async ({ page }) => {
    await page.goto('/history');

    const input = page.getByPlaceholder('Search');
    await expect(input).toBeVisible();

    await input.fill('btc');
    await expect(input).toHaveValue('btc');
  });
});
