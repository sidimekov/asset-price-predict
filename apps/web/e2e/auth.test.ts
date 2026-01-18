import { test, expect } from '@playwright/test';
import { buildUrl } from './utils/basePath';

test.describe('Auth Page', () => {
  test('should load and show signup form', async ({ page }) => {
    await page.goto(buildUrl('/auth'));
    await expect(
      page.getByRole('heading', { name: 'Sign up for AssetPredict' }),
    ).toBeVisible();
  });

  test('should switch to signin mode via top-right link', async ({ page }) => {
    await page.goto(buildUrl('/auth'));
    await expect(
      page.getByRole('heading', { name: 'Sign up for AssetPredict' }),
    ).toBeVisible();

    const toggleLink = page.getByRole('link', { name: /войти/i });
    await expect(toggleLink).toBeVisible();
    await toggleLink.click();
    await expect(
      page.getByRole('heading', { name: 'Welcome back' }),
    ).toBeVisible();
  });
});
