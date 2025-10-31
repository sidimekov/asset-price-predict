import { test, expect } from '@playwright/test';

test.describe('History Page', () => {
  test('should load and show table header', async ({ page }) => {
    await page.goto('/history');

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
        'Input',
        'Period',
        'Factors (TOP 5): impact, SHAP, Conf.',
      ],
      { useInnerText: true }, // чтобы нормально схлопывались пробелы/переносы
    );
  });

  test('should type into Search input', async ({ page }) => {
    await page.goto('/history');
    const input = page.getByPlaceholder('Search');
    await input.fill('btc');
    await expect(input).toHaveValue('btc');
  });
});
