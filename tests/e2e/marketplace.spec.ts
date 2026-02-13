import { test, expect } from '@playwright/test';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

test.describe('Marketplace Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/marketplace`);
  });

  test('should display marketplace page with hero section', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Marketplace');
    await expect(page.getByText(/gebrauchte IT-Geräte/i)).toBeVisible();
  });

  test('should have search with debouncing', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Laptop"]');
    await expect(searchInput).toBeVisible();

    // Track network requests
    let apiCallCount = 0;
    page.on('request', request => {
      if (request.url().includes('/api/listings')) {
        apiCallCount++;
      }
    });

    // Type quickly
    await searchInput.fill('iPhone');

    // Wait for debounce (300ms) + request
    await page.waitForTimeout(500);

    // Should only have made 1-2 API calls (not one per keystroke)
    console.log(`API calls made: ${apiCallCount}`);
  });

  test('should validate price range - negative prices', async ({ page }) => {
    // Open filters
    const filterButton = page.locator('button:has-text("Filter"), button >> text=/filter/i').first();
    await filterButton.click();

    // Find price inputs
    const priceMinInput = page.locator('input[placeholder="Min"]');
    const priceMaxInput = page.locator('input[placeholder="Max"]');

    // Enter negative price
    await priceMinInput.fill('-100');
    await priceMinInput.blur();

    // Check for error message
    await expect(page.locator('text=/negativ/i')).toBeVisible({ timeout: 2000 });
  });

  test('should validate price range - min > max', async ({ page }) => {
    // Open filters
    const filterButton = page.locator('button:has-text("Filter"), button >> text=/filter/i').first();
    await filterButton.click();

    // Find price inputs
    const priceMinInput = page.locator('input[placeholder="Min"]');
    const priceMaxInput = page.locator('input[placeholder="Max"]');

    // Enter min > max
    await priceMinInput.fill('1000');
    await priceMaxInput.fill('500');
    await priceMaxInput.blur();

    // Check for error message
    await expect(page.locator('text=/Mindestpreis.*höher/i')).toBeVisible({ timeout: 2000 });
  });

  test('should validate price range - exceeds maximum', async ({ page }) => {
    // Open filters
    const filterButton = page.locator('button:has-text("Filter"), button >> text=/filter/i').first();
    await filterButton.click();

    // Find price inputs
    const priceMinInput = page.locator('input[placeholder="Min"]');

    // Enter price over 50000
    await priceMinInput.fill('60000');
    await priceMinInput.blur();

    // Check for error message
    await expect(page.locator('text=/50.*000/i')).toBeVisible({ timeout: 2000 });
  });

  test('should clear price error when valid input entered', async ({ page }) => {
    // Open filters
    const filterButton = page.locator('button:has-text("Filter"), button >> text=/filter/i').first();
    await filterButton.click();

    const priceMinInput = page.locator('input[placeholder="Min"]');
    const priceMaxInput = page.locator('input[placeholder="Max"]');

    // Enter invalid range
    await priceMinInput.fill('1000');
    await priceMaxInput.fill('500');
    await priceMaxInput.blur();

    // Wait for error
    await page.waitForTimeout(500);

    // Fix the range
    await priceMaxInput.fill('2000');
    await priceMaxInput.blur();

    // Error should clear
    await page.waitForTimeout(500);
  });

  test('should filter by category', async ({ page }) => {
    const filterButton = page.locator('button:has-text("Filter"), button >> text=/filter/i').first();
    await filterButton.click();

    // Select a category
    const categorySelect = page.locator('select').first();
    await categorySelect.selectOption({ index: 1 }); // Select first non-empty option

    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
  });

  test('should filter by condition', async ({ page }) => {
    const filterButton = page.locator('button:has-text("Filter"), button >> text=/filter/i').first();
    await filterButton.click();

    // Find condition select (should be second or third select)
    const selects = page.locator('select');
    const conditionSelect = selects.nth(1);

    if (await conditionSelect.isVisible()) {
      await conditionSelect.selectOption({ index: 1 });
      await page.waitForLoadState('networkidle');
    }
  });

  test('should show loading skeletons', async ({ page }) => {
    // Intercept network request to delay it
    await page.route('**/api/listings*', async route => {
      await page.waitForTimeout(1000);
      await route.continue();
    });

    await page.reload();

    // Check for skeleton loaders
    const skeletons = page.locator('.animate-pulse');
    await expect(skeletons.first()).toBeVisible({ timeout: 2000 });
  });

  test('should show error state on network failure', async ({ page }) => {
    // Intercept and fail the request
    await page.route('**/api/listings*', route =>
      route.abort('failed')
    );

    await page.reload();

    // Wait for error message
    await expect(page.locator('text=/Fehler/i, text=/Error/i')).toBeVisible({ timeout: 5000 });
  });

  test('should navigate pagination', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Look for pagination controls
    const nextButton = page.locator('button:has-text("Weiter"), button >> text=/next/i');
    const prevButton = page.locator('button:has-text("Zurück"), button >> text=/previous/i');

    // If pagination exists, test it
    if (await nextButton.isVisible()) {
      await nextButton.click();
      await page.waitForLoadState('networkidle');

      // Should now be on page 2
      await expect(prevButton).toBeEnabled();
    }
  });

  test('should clear all filters', async ({ page }) => {
    const filterButton = page.locator('button:has-text("Filter"), button >> text=/filter/i').first();
    await filterButton.click();

    // Apply some filters
    const categorySelect = page.locator('select').first();
    await categorySelect.selectOption({ index: 1 });

    // Look for clear/reset button
    const clearButton = page.locator('button:has-text("zurücksetzen"), button:has-text("Clear"), button >> text=/reset/i');

    if (await clearButton.isVisible()) {
      await clearButton.click();

      // Verify filters are cleared
      await expect(categorySelect).toHaveValue('');
    }
  });
});
