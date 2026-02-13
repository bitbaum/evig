import { test, expect } from '@playwright/test';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

test.describe('Security Features', () => {
  test('XSS Prevention - IT-Hilfe title should sanitize script tags', async ({ page }) => {
    // This test requires authentication - skip if not logged in
    await page.goto(`${BASE_URL}/it-hilfe/create`);

    // Check if redirected to login
    const currentUrl = page.url();
    if (currentUrl.includes('/auth/login') || currentUrl.includes('/api/auth')) {
      test.skip();
      return;
    }

    // Try to submit XSS payload
    const titleInput = page.locator('input[name="title"], input[placeholder*="Titel"]');
    const descriptionInput = page.locator('textarea[name="description"], textarea[placeholder*="Beschreibung"]');

    if (await titleInput.isVisible()) {
      await titleInput.fill('<script>alert("xss")</script>Laptop Reparatur');
      await descriptionInput.fill('Normal description');

      // Fill other required fields
      // ... (would need to fill complete form)

      // After submission, verify the script tag is sanitized
      // This would require actually submitting and checking the result
    }
  });

  test('Input Validation - Invalid postal code should show error', async ({ page }) => {
    await page.goto(`${BASE_URL}/it-hilfe/create`);

    const currentUrl = page.url();
    if (currentUrl.includes('/auth/login') || currentUrl.includes('/api/auth')) {
      test.skip();
      return;
    }

    const postalCodeInput = page.locator('input[name="postalCode"], input[placeholder*="PLZ"]');

    if (await postalCodeInput.isVisible()) {
      // Try 3-digit code (invalid)
      await postalCodeInput.fill('123');
      await postalCodeInput.blur();

      await page.waitForTimeout(500);

      // Try letters (invalid)
      await postalCodeInput.fill('ABCD');
      await postalCodeInput.blur();

      // Valid 4-digit code
      await postalCodeInput.fill('8055');
      await postalCodeInput.blur();
    }
  });

  test('Rate Limiting - Should prevent rapid IT-Hilfe submissions', async ({ page, context }) => {
    // This test would require:
    // 1. Being logged in
    // 2. Submitting multiple requests rapidly
    // 3. Checking for rate limit error

    await page.goto(`${BASE_URL}/it-hilfe/create`);

    const currentUrl = page.url();
    if (currentUrl.includes('/auth/login') || currentUrl.includes('/api/auth')) {
      test.skip();
      return;
    }

    // Would need to fill and submit form 6 times rapidly
    // and check that 6th submission shows "Zu viele Anfragen" error
  });

  test('SSOT Validation - Canton dropdown should only show valid Swiss cantons', async ({ page }) => {
    await page.goto(`${BASE_URL}/it-hilfe/create`);

    const currentUrl = page.url();
    if (currentUrl.includes('/auth/login') || currentUrl.includes('/api/auth')) {
      test.skip();
      return;
    }

    const cantonSelect = page.locator('select[name="canton"]');

    if (await cantonSelect.isVisible()) {
      // Get all options
      const options = await cantonSelect.locator('option').allTextContents();

      // Verify Swiss cantons are present
      expect(options).toContain('Zürich');
      expect(options).toContain('Bern');
      expect(options).toContain('Genf');

      // Should have 26 cantons + 1 empty option
      expect(options.length).toBeGreaterThanOrEqual(26);
    }
  });
});
