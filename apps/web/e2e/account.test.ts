import { test, expect } from '@playwright/test';

test.describe('Account Page', () => {
    test('should load and show profile information', async ({ page }) => {
        await page.goto('/account');
        await expect(page.getByText('Username:')).toBeVisible();
    });

    test('should display action buttons for account management', async ({ page }) => {
        await page.goto('/account');
        await expect(page.getByRole('button', { name: 'Edit photo' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Change password' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Log out' })).toBeVisible();
    });

    test('should show not implemented alerts when clicking buttons', async ({ page }) => {
        await page.goto('/account');

        page.on('dialog', dialog => {
            expect(dialog.message()).toContain('Not implemented');
            dialog.dismiss();
        });

        await page.getByRole('button', { name: 'Edit photo' }).click();
    });
});