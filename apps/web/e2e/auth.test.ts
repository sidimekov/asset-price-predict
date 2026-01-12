import { test, expect } from '@playwright/test';

const basePath = (process.env.NEXT_PUBLIC_BASE_PATH || '').replace(/\/$/, '');
const withBasePath = (path: string) => `${basePath}${path}`;

test.describe('Auth Page', () => {
  test('should load and show signup form', async ({ page }) => {
    await page.goto(withBasePath('/auth'));
    await expect(page.getByText('Sign up for AssetPredict')).toBeVisible();
  });

  test('should switch to signin mode via top-right link', async ({ page }) => {
    await page.goto(withBasePath('/auth'));
    const toggleLink = page.getByRole('link', {
      name: 'Already have an account? Sign in',
    });
    await expect(toggleLink).toBeVisible();
    await toggleLink.click();
    await expect(page.getByText('Welcome back')).toBeVisible();
  });
});
