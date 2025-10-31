import { describe } from 'vitest';

if ((globalThis as any).vi) {
  describe.skip('e2e (playwright only)', () => {});
}

(async () => {
  if ((globalThis as any).vi) return; // под Vitest выходим

  const { test, expect } = await import('@playwright/test');

  test.describe('History Page', () => {
    test('should load and show table header', async ({ page }) => {
      await page.goto('/history');
      await expect(page.locator('table')).toBeVisible();
      const headerRow = page.locator('thead tr').first();
      await expect(headerRow).toContainText([
        'Asset',
        'Date',
        'Model',
        'Input',
        'Period',
      ]);
      await expect(headerRow).toContainText(/Factors \(TOP 5\):/i);
    });

    test('should type into Search input', async ({ page }) => {
      await page.goto('/history');
      const input = page.getByPlaceholder('Search');
      await input.fill('btc');
      await expect(input).toHaveValue('btc');
    });
  });
})();
