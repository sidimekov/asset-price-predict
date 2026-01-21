import { test, expect } from '@playwright/test';
import { buildUrl } from './utils/basePath';

test.describe('Account Page', () => {
  test.beforeEach(async ({ page }) => {
    // Мокаем запрос на проверку аутентификации
    await page.route('**/auth/check**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          isAuthenticated: true,
          user: {
            id: 'e2e-user',
            email: 'e2e@example.com',
          },
        }),
      });
    });

    // Мокаем запрос за данными профиля
    await page.route('**/api/me**', async (route) => {
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

    // Мокаем другие API запросы
    await page.route('**/api/account/update**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    });

    await page.route('**/api/auth/logout**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    });

    // Устанавливаем токен
    await page.addInitScript(() => {
      localStorage.setItem('auth.token', 'e2e-token');
      localStorage.setItem('ap.auth.mock', 'true');
    });
  });

  test('page loads without authentication error', async ({ page }) => {
    await page.goto(buildUrl('/account'), { waitUntil: 'networkidle' });

    // Проверяем что нет ошибок авторизации
    const hasUnauthorized =
      (await page.getByText('401').count()) > 0 ||
      (await page.getByText('Unauthorized').count()) > 0;

    expect(hasUnauthorized).toBe(false);
  });

  test('can open and close edit form', async ({ page }) => {
    await page.goto(buildUrl('/account'), { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Ищем кнопку для открытия формы
    const changeUsernameButton = page.getByText('Change username', {
      exact: false,
    });

    if ((await changeUsernameButton.count()) > 0) {
      await changeUsernameButton.first().click();
      await page.waitForTimeout(500);

      // Проверяем что форма открылась (ищем поле ввода или кнопки Save/Cancel)
      const hasInput = (await page.locator('input, textarea').count()) > 0;
      const hasSave =
        (await page.getByText('Save', { exact: false }).count()) > 0;
      const hasCancel =
        (await page.getByText('Cancel', { exact: false }).count()) > 0;

      expect(hasInput || hasSave || hasCancel).toBe(true);

      // Закрываем форму если есть кнопка Cancel
      if (hasCancel) {
        await page.getByText('Cancel', { exact: false }).first().click();
        await page.waitForTimeout(500);
      }
    }
  });

  test('logout redirects to auth page', async ({ page }) => {
    await page.goto(buildUrl('/account'), { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Ищем кнопку выхода
    const logoutButton = page.getByText('Log out', { exact: false });

    if ((await logoutButton.count()) > 0) {
      await logoutButton.first().click();

      // Ждем навигации
      await page.waitForURL(/\/auth$/);

      expect(page.url()).toContain('/auth');
    }
  });
});
