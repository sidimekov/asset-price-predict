import { test, expect } from '@playwright/test';
import { buildUrl } from './utils/basePath';

test.describe('Account Page', () => {
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
        body: JSON.stringify({
          id: 'e2e-user',
          email: 'e2e@example.com',
          username: 'E2E User',
          avatarUrl: '/images/profile-avatar.png',
        }),
      });
    });

    await page.addInitScript(() => {
      window.localStorage.setItem('auth.token', 'e2e-token');
    });
  });

  test('should load and show profile information', async ({ page }) => {
    const accountResponse = page.waitForResponse((response) =>
      response.url().includes('/account'),
    );
    await page.goto(buildUrl('/account'));
    await accountResponse;
    await expect(page.getByText('Username:')).toBeVisible();
    await expect(page.getByText('Email:')).toBeVisible();
  });

  test('should display action buttons for account management', async ({
    page,
  }) => {
    const accountResponse = page.waitForResponse((response) =>
      response.url().includes('/account'),
    );
    await page.goto(buildUrl('/account'));
    await accountResponse;
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
    const accountResponse = page.waitForResponse((response) =>
      response.url().includes('/account'),
    );
    await page.goto(buildUrl('/account'));
    await accountResponse;

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
