import { test, expect } from '@playwright/test';
import { buildUrl } from './utils/basePath';

test.describe('Account Page', () => {
  test('should load and show profile information', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('auth.token', 'e2e-token');
    });
    await page.goto(buildUrl('/account'));
    await expect(page.getByText('Username:')).toBeVisible();
  });

  test('should display action buttons for account management', async ({
    page,
  }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('auth.token', 'e2e-token');
    });
    await page.goto(buildUrl('/account'));
    await expect(
      page.getByRole('button', { name: 'Edit photo' }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Change password' }),
    ).toBeVisible();
    await expect(page.getByRole('button', { name: 'Log out' })).toBeVisible();
  });

  test('should show not implemented alerts when clicking buttons', async ({
    page,
  }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('auth.token', 'e2e-token');
    });
    await page.goto(buildUrl('/account'));

    await expect(
      page.getByRole('button', { name: 'Edit photo' }),
    ).toBeVisible();
    const button = page.getByRole('button', { name: 'Edit photo' });
    await button.scrollIntoViewIfNeeded();

    let dialogMessage = '';
    page.once('dialog', (dialog) => {
      dialogMessage = dialog.message();
      dialog.dismiss();
    });

    await button.click();
    await expect.poll(() => dialogMessage).toContain('Not implemented');
  });
});
