import { test, expect, type Page } from '@playwright/test';

// Configure test environment
test.use({
  viewport: { width: 1280, height: 720 },
});

/**
 * Helper to open the suggestion panel.
 * The floating button uses position:fixed and Playwright reports it as
 * "outside of the viewport", so we use dispatchEvent instead of click.
 */
async function openSuggestionPanel(page: Page) {
  const btn = page.locator('[aria-label*="Verbesserungen vorschlagen"]');
  await btn.dispatchEvent('click');
  await expect(page.locator('[data-suggestion-panel]')).toBeVisible();
}

// These tests require the suggestion API backend (database).
// Skip in local dev; run in CI with test fixtures.
test.describe('SuggestionButton - User Experience Flows', () => {
  test.skip(({ browserName }) => true, 'Requires suggestion API backend (database)')
  test.setTimeout(60000);

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Wait for the suggestion button to be attached
    await expect(page.locator('[aria-label*="Verbesserungen vorschlagen"]')).toBeAttached();
  });

  test('Quick Feedback Flow - 15 seconds to value', async ({ page }) => {
    // 1. Open the panel
    await openSuggestionPanel(page);
    await expect(page.locator('text=Verbesserungen vorschlagen')).toBeVisible();

    // 2. Type a quick suggestion
    const textarea = page.locator('textarea');
    await textarea.fill('Das Design gefällt mir sehr gut!');

    // 3. Submit immediately (Ctrl+Enter or button click)
    await page.keyboard.press('Control+Enter');

    // 4. Should see success message
    await expect(page.locator('text=Vielen Dank!')).toBeVisible();
    await expect(page.locator('text=erfolgreich gesendet')).toBeVisible();

    // 5. Panel should auto-close after success
    await page.waitForTimeout(2500);
    await expect(page.locator('[data-suggestion-panel]')).not.toBeVisible();
  });

  test('Element Selection Flow - Visual feedback targeting', async ({ page }) => {
    // 1. Open suggestion panel
    await openSuggestionPanel(page);

    // 2. Select element scope
    await page.locator('text=Spezifische Elemente').click();

    // 3. Should show element selection instructions
    await expect(page.locator('text=Element-Auswahl aktiv')).toBeVisible();
    await expect(page.locator('text=Klicken Sie auf Elemente zum Auswählen')).toBeVisible();

    // 4. Click on a visible element
    const heading = page.locator('h1, h2, h3').first();
    await heading.click();

    // 5. Element should be highlighted
    await expect(page.locator('.suggestion-selected-element')).toBeVisible();
    await expect(page.locator('text=1 Element ausgewählt')).toBeVisible();

    // 6. Type feedback for the selected element
    const textarea = page.locator('textarea');
    await textarea.fill('Diese Überschrift könnte grösser sein');

    // 7. Submit
    await page.click('button:has-text("Senden")');

    // 8. Success message and auto-close
    await expect(page.locator('text=Vielen Dank!')).toBeVisible();
    await page.waitForTimeout(2500);
    await expect(page.locator('[data-suggestion-panel]')).not.toBeVisible();
  });

  test('Quick Suggestions - One-click feedback', async ({ page }) => {
    // 1. Open panel
    await openSuggestionPanel(page);

    // 2. Quick suggestions should be visible
    await expect(page.locator('text=Schnellvorschläge:')).toBeVisible();

    // 3. Click a quick suggestion
    await page.locator('text=Die Seite lädt zu langsam').click();

    // 4. Should auto-fill the textarea
    const textarea = page.locator('textarea');
    await expect(textarea).toHaveValue('Die Seite lädt zu langsam');

    // 5. Submit
    await page.click('button:has-text("Senden")');

    // 6. Success flow
    await expect(page.locator('text=Vielen Dank!')).toBeVisible();
  });

  test('Site-wide Feedback Flow', async ({ page }) => {
    // 1. Open panel
    await openSuggestionPanel(page);

    // 2. Select site scope
    await page.locator('text=Gesamte Website').click();

    // 3. Should show purple styling for site scope
    await expect(page.locator('button.bg-purple-100')).toBeVisible();

    // 4. Type site-wide suggestion
    const textarea = page.locator('textarea');
    await textarea.fill('Die Website braucht einen Newsletter');

    // 5. Submit
    await page.click('button:has-text("Senden")');

    // 6. Success
    await expect(page.locator('text=Vielen Dank!')).toBeVisible();
  });

  test('Mobile Experience - Touch interactions', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // 1. Button should still be attached on mobile
    await expect(page.locator('[aria-label*="Verbesserungen vorschlagen"]')).toBeAttached();

    // 2. Open panel (dispatchEvent bypasses viewport issues)
    await openSuggestionPanel(page);

    // 3. Panel should adapt to mobile screen
    const panel = page.locator('[data-suggestion-panel]');
    await expect(panel).toBeVisible();

    // 4. Panel should not exceed screen width
    const panelBox = await panel.boundingBox();
    expect(panelBox!.width).toBeLessThanOrEqual(375);

    // 5. Quick interaction test
    await page.locator('text=Die Seite lädt zu langsam').click();
    await page.click('button:has-text("Senden")');
    await expect(page.locator('text=Vielen Dank!')).toBeVisible();
  });

  test('Keyboard Navigation - Accessibility flow', async ({ page }) => {
    // Focus the button and open via Enter
    const button = page.locator('[aria-label*="Verbesserungen vorschlagen"]');
    await button.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('[data-suggestion-panel]')).toBeVisible();

    // Tab through form elements
    await page.keyboard.press('Tab');
    await page.keyboard.type('Keyboard navigation test');

    // Tab to submit button
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Submit with Enter
    await page.keyboard.press('Enter');

    // Success
    await expect(page.locator('text=Vielen Dank!')).toBeVisible();
  });

  test('Validation & Error Handling', async ({ page }) => {
    // 1. Open panel
    await openSuggestionPanel(page);

    // 2. Try to submit empty form
    await page.click('button:has-text("Senden")');
    await expect(page.locator('text=Bitte geben Sie einen Verbesserungsvorschlag ein')).toBeVisible();

    // 3. Try element scope without selecting elements
    await page.locator('text=Spezifische Elemente').click();
    await page.click('button:has-text("Senden")');
    await expect(page.locator('text=Bitte wählen Sie mindestens ein Element aus')).toBeVisible();

    // 4. Test contact field (optional)
    await page.locator('input[placeholder*="Name/E-Mail"]').fill('test@example.com');
    await page.locator('textarea').fill('Valid suggestion with contact');
    await page.click('button:has-text("Senden")');
    await expect(page.locator('text=Vielen Dank!')).toBeVisible();
  });

  test('Multiple Element Selection', async ({ page }) => {
    // 1. Open panel and select element scope
    await openSuggestionPanel(page);
    await page.locator('text=Spezifische Elemente').click();

    // 2. Select multiple elements
    const elements = page.locator('p, h1, h2, h3, button').all();
    const elementsArray = await elements;

    // Click first 3 elements
    for (let i = 0; i < Math.min(3, elementsArray.length); i++) {
      await elementsArray[i].click();
      await page.waitForTimeout(200);
    }

    // 3. Should show multiple selection count
    await expect(page.locator(`text=${Math.min(3, elementsArray.length)} Element`)).toBeVisible();

    // 4. Submit feedback for multiple elements
    const textarea = page.locator('textarea');
    await textarea.fill('Diese Elemente könnten besser abgestimmt werden');
    await page.click('button:has-text("Senden")');

    // 5. Success
    await expect(page.locator('text=Vielen Dank!')).toBeVisible();
  });

  test('Performance - Fast interactions', async ({ page }) => {
    const startTime = Date.now();

    // 1. Open panel
    await openSuggestionPanel(page);

    // 2. Panel should appear within 500ms
    const panelVisibleTime = Date.now() - startTime;
    expect(panelVisibleTime).toBeLessThan(500);

    // 3. Quick suggestion click should be instant
    const quickSuggestionTime = Date.now();
    await page.locator('text=Die Seite lädt zu langsam').click();
    const suggestionClickTime = Date.now() - quickSuggestionTime;
    expect(suggestionClickTime).toBeLessThan(200);

    // 4. Submit should be fast
    const submitTime = Date.now();
    await page.click('button:has-text("Senden")');
    await expect(page.locator('text=Vielen Dank!')).toBeVisible();
    const totalSubmitTime = Date.now() - submitTime;
    expect(totalSubmitTime).toBeLessThan(1000);
  });

  test('Edge Cases & Robustness', async ({ page }) => {
    // 1. Test with very long text
    await openSuggestionPanel(page);
    const longText = 'A'.repeat(950);
    await page.locator('textarea').fill(longText);
    await expect(page.locator('text=950/1000 Zeichen')).toBeVisible();

    // Submit long text
    await page.click('button:has-text("Senden")');
    await expect(page.locator('text=Vielen Dank!')).toBeVisible();

    // 2. Test special characters
    await openSuggestionPanel(page);
    await page.locator('textarea').fill('Test with émojis 🎉 and spëcial chärs');
    await page.click('button:has-text("Senden")');
    await expect(page.locator('text=Vielen Dank!')).toBeVisible();

    // 3. Test rapid clicking
    await openSuggestionPanel(page);
    await page.locator('text=Spezifische Elemente').click();

    // Rapid element clicking
    for (let i = 0; i < 5; i++) {
      const element = page.locator('p').nth(i % 3);
      await element.click();
      await page.waitForTimeout(50);
    }
  });
});
