import { test, expect } from '@playwright/test';

const basePath = (process.env.NEXT_PUBLIC_BASE_PATH || '').replace(/\/$/, '');
const withBasePath = (path: string) => `${basePath}${path}`;

test.describe('Account Page', () => {
  test('should load and show profile information', async ({ page }) => {
    await page.goto(withBasePath('/account'));
    await expect(page.getByText('Username:')).toBeVisible();
  });

  test('should display action buttons for account management', async ({
    page,
  }) => {
    await page.goto(withBasePath('/account'));
    await expect(page.getByRole('button', { name: 'Edit photo' })).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Change password' }),
    ).toBeVisible();
    await expect(page.getByRole('button', { name: 'Log out' })).toBeVisible();
  });

  test('should show not implemented alerts when clicking buttons', async ({
    page,
  }) => {
    await page.goto(withBasePath('/account'));

    await expect(page.getByRole('button', { name: 'Edit photo' })).toBeVisible();
    const dialogPromise = page.waitForEvent('dialog');

    await page.getByRole('button', { name: 'Edit photo' }).click();
    const dialog = await dialogPromise;
    expect(dialog.message()).toContain('Not implemented');
    await dialog.dismiss();
  });
});
