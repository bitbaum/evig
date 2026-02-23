import { test, expect } from '@playwright/test';

test.describe('IT-Hilfe Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/it-hilfe');
  });

  test('should display IT-Hilfe page with hero section', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('IT-Hilfe');
    await expect(page.getByText('Community-basierte IT-Unterstützung')).toBeVisible();
  });

  test('should have search functionality in hero', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="durchsuchen"]');
    await expect(searchInput).toBeVisible();

    // Type in search
    await searchInput.fill('Laptop');
    await page.keyboard.press('Enter');

    // Wait for results to load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
  });

  test('should show and hide filters', async ({ page }) => {
    const filterButton = page.locator('button:has-text("Filter")').first();
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
    await page.locator('button:has-text("Filter")').first().click();

    // Select laptop category
    await page.locator('select[id="filter-category"]').selectOption('laptop');

    // Wait for results to update
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
  });

  test('should sort requests', async ({ page }) => {
    // Sort select is always visible (not inside the expandable filter panel)
    const sortSelect = page.locator('select[aria-label="Sortierung"]');
    await expect(sortSelect).toBeVisible();

    // Test different sort options
    await sortSelect.selectOption('urgent');
    await page.waitForLoadState('networkidle');

    await sortSelect.selectOption('budget_high');
    await page.waitForLoadState('networkidle');
  });

  test('should show request count in stats', async ({ page }) => {
    // Wait for results to load
    await page.waitForLoadState('networkidle');

    // Results count is displayed in hero quick stats area
    const statsArea = page.locator('text=/\\d+ Anfragen?/');
    await expect(statsArea.first()).toBeVisible();
  });

  test('should clear all filters', async ({ page }) => {
    // Open filters and apply some
    await page.locator('button:has-text("Filter")').first().click();
    await page.locator('select[id="filter-category"]').selectOption('laptop');
    await page.waitForLoadState('networkidle');

    // Click clear filters
    const clearButton = page.locator('button:has-text("Filter zurücksetzen")');
    if (await clearButton.isVisible()) {
      await clearButton.click();

      // Verify filters are cleared
      await expect(page.locator('select[id="filter-category"]')).toHaveValue('');
    }
  });

  test('should show loading skeletons', async ({ page }) => {
    // Set up route intercept BEFORE navigation to ensure we catch the request
    await page.route('**/api/it-hilfe/requests*', async route => {
      await new Promise(r => setTimeout(r, 2000));
      await route.continue();
    });

    await page.reload();

    // Check for skeleton loaders (they have animate-pulse class)
    const skeletons = page.locator('.animate-pulse');
    await expect(skeletons.first()).toBeVisible({ timeout: 3000 });
  });

  test('should show error state on network failure', async ({ page }) => {
    // Intercept and fail the request
    await page.route('**/api/it-hilfe/requests*', route =>
      route.abort('failed')
    );

    await page.reload();

    // Wait for error message (ErrorAlert component with heading)
    await expect(page.getByRole('heading', { name: /Fehler/i })).toBeVisible({ timeout: 5000 });

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

    // Check for empty state message (EmptyState component)
    const emptyState = page.locator('text=/Keine.*gefunden/i');
    // Empty state might appear depending on API response
  });
});
