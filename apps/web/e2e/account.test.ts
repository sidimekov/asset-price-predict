import { test, expect } from '@playwright/test';
import { buildUrl } from './utils/basePath';

test.describe('Account Page', () => {
  test('should load and show profile information', async ({ page }) => {
    await page.goto(buildUrl('/account'));

    // Проверяем, что профиль загружен
    await expect(page.getByText('Username:')).toBeVisible();
    await expect(page.getByText('Login:')).toBeVisible();
  });

  test('should display action buttons when no form is open', async ({
    page,
  }) => {
    await page.goto(buildUrl('/account'));

    // Кнопки ActionsList видны
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
      page.getByRole('button', { name: 'Change login' }),
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
    await page.goto(buildUrl('/account'));

    await page.getByRole('button', { name: 'Change login' }).click();

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
