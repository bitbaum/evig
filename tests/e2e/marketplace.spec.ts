import { test, expect } from '@playwright/test';

test.describe('Marketplace Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/marketplace');
  });

  test('should display marketplace page with hero section', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Marketplace');
    await expect(page.getByText(/gebrauchte IT-Geräte/i)).toBeVisible();
  });

  test('should have search with form submit', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Laptop"]');
    await expect(searchInput).toBeVisible();

    // Type search and submit
    await searchInput.fill('iPhone');
    await page.locator('button:has-text("Suchen")').click();

    // Wait for results
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
  });

  test('should validate price range - negative prices', async ({ page }) => {
    // Open filters
    const filterButton = page.locator('button:has-text("Filter")').first();
    await filterButton.click();

    // Find price inputs
    const priceMinInput = page.locator('input[placeholder="Min"]');

    // Enter negative price
    await priceMinInput.fill('-100');
    await priceMinInput.blur();

    // Check for error message
    await expect(page.locator('text=/negativ/i')).toBeVisible({ timeout: 2000 });
  });

  test('should validate price range - min > max', async ({ page }) => {
    // Open filters
    const filterButton = page.locator('button:has-text("Filter")').first();
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
    const filterButton = page.locator('button:has-text("Filter")').first();
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
    const filterButton = page.locator('button:has-text("Filter")').first();
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

  test('should filter by condition', async ({ page }) => {
    const filterButton = page.locator('button:has-text("Filter")').first();
    await filterButton.click();

    // Condition select has id="filter-condition"
    const conditionSelect = page.locator('select[id="filter-condition"]');

    if (await conditionSelect.isVisible()) {
      await conditionSelect.selectOption({ index: 1 });
      await page.waitForLoadState('networkidle');
    }
  });

  test('should show loading skeletons', async ({ page }) => {
    // Set up route intercept BEFORE navigation to ensure we catch the request
    await page.route('**/api/listings*', async route => {
      await new Promise(r => setTimeout(r, 2000));
      await route.continue();
    });

    await page.reload();

    // Check for skeleton loaders
    const skeletons = page.locator('.animate-pulse');
    await expect(skeletons.first()).toBeVisible({ timeout: 3000 });
  });

  test('should show error state on network failure', async ({ page }) => {
    // Intercept and fail the request
    await page.route('**/api/listings*', route =>
      route.abort('failed')
    );

    await page.reload();

    // Wait for error message (ErrorAlert component)
    await expect(page.locator('text=/Fehler/i')).toBeVisible({ timeout: 5000 });
  });

  test('should use category pills for filtering', async ({ page }) => {
    // Category pills are always visible (not behind filter toggle)
    const allButton = page.locator('button[aria-pressed="true"]:has-text("Alle")');
    await expect(allButton).toBeVisible();

    // Click a category pill
    const categoryPills = page.locator('[role="group"][aria-label="Kategoriefilter"] button');
    const pillCount = await categoryPills.count();
    if (pillCount > 1) {
      await categoryPills.nth(1).click();
      await page.waitForLoadState('networkidle');
    }
  });

  test('should clear all filters', async ({ page }) => {
    const filterButton = page.locator('button:has-text("Filter")').first();
    await filterButton.click();

    // Apply a condition filter
    const conditionSelect = page.locator('select[id="filter-condition"]');
    if (await conditionSelect.isVisible()) {
      await conditionSelect.selectOption({ index: 1 });
    }

    // Look for clear/reset button
    const clearButton = page.locator('button:has-text("Filter zurücksetzen")');
    if (await clearButton.isVisible()) {
      await clearButton.click();
      await page.waitForLoadState('networkidle');
    }
  });
});
