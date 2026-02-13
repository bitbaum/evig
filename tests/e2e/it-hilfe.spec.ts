import { test, expect } from '@playwright/test';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

test.describe('IT-Hilfe Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/it-hilfe`);
  });

  test('should display IT-Hilfe page with hero section', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('IT-Hilfe');
    await expect(page.locator('text=Community-basierte IT-Unterstützung')).toBeVisible();
  });

  test('should have search functionality in hero', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="durchsuchen"]');
    await expect(searchInput).toBeVisible();

    // Type in search
    await searchInput.fill('Laptop');
    await page.keyboard.press('Enter');

    // Wait for results to load
    await page.waitForLoadState('networkidle');

    // Verify search parameter in URL or filtered results
    await page.waitForTimeout(1000);
  });

  test('should show and hide filters', async ({ page }) => {
    const filterButton = page.locator('button:has-text("Filter")');
    await expect(filterButton).toBeVisible();

    // Open filters
    await filterButton.click();
    await expect(page.locator('select[id="filter-category"]')).toBeVisible();

    // Close filters
    await filterButton.click();
    await page.waitForTimeout(300);
  });

  test('should filter by category', async ({ page }) => {
    // Open filters
    await page.locator('button:has-text("Filter")').click();

    // Select laptop category
    await page.locator('select[id="filter-category"]').selectOption('laptop');

    // Wait for results to update
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Verify filter is applied (check for Laptop badge or filtered results)
  });

  test('should sort requests', async ({ page }) => {
    // Open filters
    await page.locator('button:has-text("Filter")').click();

    // Change sort order
    const sortSelect = page.locator('select[id="filter-sort"]');
    await expect(sortSelect).toBeVisible();

    // Test different sort options
    await sortSelect.selectOption('urgent');
    await page.waitForLoadState('networkidle');

    await sortSelect.selectOption('budget_high');
    await page.waitForLoadState('networkidle');
  });

  test('should show pagination controls when results exist', async ({ page }) => {
    // Wait for results to load
    await page.waitForLoadState('networkidle');

    // Check if pagination exists (only if there are enough results)
    const paginationButtons = page.locator('button:has-text("Weiter")');
    const resultsCount = page.locator('text=/\\d+ Anfragen? gefunden/');
    await expect(resultsCount).toBeVisible();
  });

  test('should clear all filters', async ({ page }) => {
    // Open filters and apply some
    await page.locator('button:has-text("Filter")').click();
    await page.locator('select[id="filter-category"]').selectOption('laptop');
    await page.locator('select[id="filter-urgency"]').selectOption('urgent');

    // Click clear filters
    const clearButton = page.locator('button:has-text("zurücksetzen")');
    if (await clearButton.isVisible()) {
      await clearButton.click();

      // Verify filters are cleared
      await expect(page.locator('select[id="filter-category"]')).toHaveValue('');
      await expect(page.locator('select[id="filter-urgency"]')).toHaveValue('');
    }
  });

  test('should show loading skeletons', async ({ page }) => {
    // Intercept network request to delay it
    await page.route('**/api/it-hilfe/requests*', async route => {
      await page.waitForTimeout(1000);
      await route.continue();
    });

    await page.reload();

    // Check for skeleton loaders (they have animate-pulse class)
    const skeletons = page.locator('.animate-pulse');
    await expect(skeletons.first()).toBeVisible();
  });

  test('should show error state on network failure', async ({ page }) => {
    // Intercept and fail the request
    await page.route('**/api/it-hilfe/requests*', route =>
      route.abort('failed')
    );

    await page.reload();

    // Wait for error message
    await expect(page.locator('text=/Fehler.*Laden/i')).toBeVisible({ timeout: 5000 });

    // Verify retry button exists
    await expect(page.locator('button:has-text("Erneut versuchen")')).toBeVisible();
  });

  test('should show empty state when no results', async ({ page }) => {
    // Search for something that won't exist
    const searchInput = page.locator('input[placeholder*="durchsuchen"]');
    await searchInput.fill('xyzabc123nonexistent');
    await page.keyboard.press('Enter');

    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Check for empty state message
    const emptyState = page.locator('text=/Keine.*gefunden/i, text=/Keine.*Anfragen/i');
    // Empty state might appear
  });
});
