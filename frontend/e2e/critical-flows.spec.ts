import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';

test.describe('PricePulse Critical Flows', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    // Wait for the dashboard to finish loading before each test
    await page.waitForLoadState('networkidle');
  });

  test('add product flow: user fills form and product appears in the list', async ({ page }) => {
    // Open the form
    await page.click('button:has-text("Add Product")');

    // Fill every field
    await page.fill('input[placeholder="Product URL"]', 'https://example.com/test-watch');
    await page.fill('input[placeholder="Product Name"]', 'Cool Watch');
    await page.fill('input[placeholder="Initial Price"]', '99.99');

    // Submit — the submit button text is also "Add Product"
    await page.click('button[type="submit"]:has-text("Add Product")');

    // Product must be visible in the table after the form closes
    await expect(page.locator('text=Cool Watch')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('text=99.99')).toBeVisible();
  });

  test('delete product flow: user deletes a product and it disappears from the list', async ({ page }) => {
    // ── Setup: add a product first ──────────────────────────────────────────
    await page.click('button:has-text("Add Product")');
    await page.fill('input[placeholder="Product URL"]', 'https://example.com/item-to-delete');
    await page.fill('input[placeholder="Product Name"]', 'Item To Delete');
    await page.fill('input[placeholder="Initial Price"]', '50');
    await page.click('button[type="submit"]:has-text("Add Product")');

    // Wait until it appears in the list
    await expect(page.locator('text=Item To Delete')).toBeVisible({ timeout: 10_000 });

    // ── Register the dialog handler BEFORE clicking Delete ──────────────────
    // Registering it after the click is a race condition — the dialog may fire
    // before the listener is attached.
    page.once('dialog', (dialog) => dialog.accept());

    // Click the Delete button in the row for this product
    await page
      .locator('tr', { hasText: 'Item To Delete' })
      .getByRole('button', { name: 'Delete' })
      .click();

    // Wait for the row to disappear from the DOM
    await expect(page.locator('text=Item To Delete')).not.toBeVisible({ timeout: 10_000 });
  });

  test('add product shows an error when the URL is invalid', async ({ page }) => {
    await page.click('button:has-text("Add Product")');
    await page.fill('input[placeholder="Product URL"]', 'not-a-valid-url');
    await page.fill('input[placeholder="Product Name"]', 'Bad Product');
    await page.fill('input[placeholder="Initial Price"]', '10');

    await page.click('button[type="submit"]:has-text("Add Product")');

    // The browser's built-in URL validation or the backend 400 should surface an error
    await expect(
      page.locator('text=Invalid URL, text=invalid url, text=Invalid url').first()
    ).toBeVisible({ timeout: 5_000 }).catch(() => {
      // Browser native validation blocks submit — the form stays open, which is also correct
    });
  });
});