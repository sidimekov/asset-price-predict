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

  test('should display action buttons when no form is open', async ({
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
    await expect(
      page.getByRole('button', { name: 'Change username' }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Change email' }),
    ).toBeVisible();
    await expect(page.getByRole('button', { name: 'Log out' })).toBeVisible();
  });

  test('should open inline form when clicking an action button', async ({
    page,
  }) => {
    await page.goto(buildUrl('/account'));

    // Кликаем по кнопке "Change username"
    const button = page.getByRole('button', { name: 'Change username' });
    await button.click();

    // После клика список кнопок скрыт
    await expect(page.getByRole('button', { name: 'Edit photo' })).toHaveCount(
      0,
    );

    // Форма для изменения username отображается через textbox
    const usernameInput = page.getByRole('textbox', { name: /username/i });
    await expect(usernameInput).toBeVisible();

    // Кнопки Save / Cancel видны
    await expect(page.getByRole('button', { name: 'Save' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible();
  });

  test('should close form and show actions list after Cancel', async ({
    page,
  }) => {
    const accountResponse = page.waitForResponse((response) =>
      response.url().includes('/account'),
    );
    await page.goto(buildUrl('/account'));
    await accountResponse;

    await page.getByRole('button', { name: 'Change email' }).click();

    // Cancel закрывает форму
    await page.getByRole('button', { name: 'Cancel' }).click();

    // Список кнопок снова виден
    await expect(
      page.getByRole('button', { name: 'Edit photo' }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Change password' }),
    ).toBeVisible();
  });

  test('should log out and redirect to /auth', async ({ page }) => {
    await page.goto(buildUrl('/account'));

    await page.getByRole('button', { name: 'Log out' }).click();

    // Проверяем URL
    await expect(page).toHaveURL(/\/auth$/);

    // Проверяем, что auth mock обновился
    const authFlag = await page.evaluate(() =>
      localStorage.getItem('ap.auth.mock'),
    );
    expect(authFlag).toBe('false');
  });
});
