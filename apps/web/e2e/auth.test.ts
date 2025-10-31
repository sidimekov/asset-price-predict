import { test, expect } from '@playwright/test';

test.describe('Auth Page', () => {
  test('should load and show signup form', async ({ page }) => {
    await page.goto('/auth');
    await expect(page.getByText('Sign up for AssetPredict')).toBeVisible();
  });

  test('should switch to signin mode via top-right link', async ({ page }) => {
    await page.goto('/auth');
    await page.getByText('Already have an account? Sign in').click();
    await expect(page.getByText('Welcome back')).toBeVisible();
  });
});
