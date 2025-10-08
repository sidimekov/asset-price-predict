import { test, expect } from '@playwright/test';

test('navigation to FirstPage and back', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('load');
    await expect(page.locator('h1')).toHaveText('Welcome to the Home Page!');
    await page.waitForSelector('text=Go to Next Page');
    await page.click('text=Go to Next Page');
    await expect(page).toHaveURL('/FirstPage');
    await expect(page.getByText('Now you are here!')).toHaveText('Now you are here!');
    await page.click('text=Back to Home Page');
    await expect(page).toHaveURL('/');
});

test('navigation to SecondPage and back', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('load');
    await expect(page.locator('h1')).toHaveText('Welcome to the Home Page!');
    await page.waitForSelector('text=Go to Another Page');
    await page.click('text=Go to Another Page');
    await expect(page).toHaveURL('/SecondPage');
    await expect(page.getByText('Now you are here!')).toHaveText('Now you are here!');
    await expect(page.getByText('Now you are here!')).toHaveCSS('color', 'rgb(255, 0, 0)');
    await page.click('text=Back to Home Page');
    await expect(page).toHaveURL('/');
});
