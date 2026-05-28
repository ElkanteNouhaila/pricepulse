import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';
const API_URL = 'http://localhost:3000';

test.describe('PricePulse Critical Flows', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
  });

  test('add product flow', async ({ page }) => {
    // Click add button
    await page.click('button:has-text("Add Product")');

    // Fill form
    await page.fill('input[placeholder="Product URL"]', 'https://example.com/watch');
    await page.fill('input[placeholder="Product Name"]', 'Cool Watch');
    await page.fill('input[placeholder="Initial Price"]', '99.99');

    // Submit
    await page.click('button:has-text("Add Product")');

    // Verify product appears
    await expect(page.locator('text=Cool Watch')).toBeVisible();
    await expect(page.locator('text=99.99')).toBeVisible();
  });

  test('delete product flow', async ({ page }) => {
    // Add product first
    await page.click('button:has-text("Add Product")');
    await page.fill('input[placeholder="Product URL"]', 'https://example.com/item');
    await page.fill('input[placeholder="Product Name"]', 'Test Item');
    await page.fill('input[placeholder="Initial Price"]', '50');
    await page.click('button:has-text("Add Product")');

    // Wait for it to appear
    await expect(page.locator('text=Test Item')).toBeVisible();

    // Delete
    await page.click('button:has-text("Delete")');
    await page.on('dialog', dialog => dialog.accept());

    // Verify gone
    await expect(page.locator('text=Test Item')).not.toBeVisible();
  });
});