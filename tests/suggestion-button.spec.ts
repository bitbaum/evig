import { test, expect } from '@playwright/test';

// Configure test environment for visual UX testing
test.use({
  baseURL: 'http://localhost:3000',
  viewport: { width: 1280, height: 720 },
  headless: false, // Visual testing for UX
  screenshot: 'only-on-failure',
  video: 'retain-on-failure',
});

/**
 * SuggestionButton User Flow Tests
 *
 * Tests all user interactions with the feedback suggestion system
 * to ensure smooth, enjoyable experiences for users with low attention spans
 */

test.describe('SuggestionButton - User Experience Flows', () => {
  test.setTimeout(60000); // 1 minute timeout for complex interactions

  test.beforeEach(async ({ page }) => {
    // Ensure we're on a page with content to interact with
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Wait for the suggestion button to be visible
    await expect(page.locator('[aria-label*="Verbesserungen vorschlagen"]')).toBeVisible();
  });

  test('🚀 Quick Feedback Flow - 15 seconds to value', async ({ page }) => {
    console.log('🎯 Testing: Quick feedback submission (page scope)');

    // 1. Click the floating button (should be instant)
    const suggestionButton = page.locator('[aria-label*="Verbesserungen vorschlagen"]');
    await suggestionButton.click();

    // 2. Panel should appear immediately
    await expect(page.locator('[data-suggestion-panel]')).toBeVisible();
    await expect(page.locator('text=Verbesserungen vorschlagen')).toBeVisible();

    // 3. Type a quick suggestion (no thinking required)
    const textarea = page.locator('textarea');
    await textarea.fill('Das Design gefällt mir sehr gut!');

    // 4. Submit immediately (Ctrl+Enter or button click)
    await page.keyboard.press('Control+Enter');

    // 5. Should see success message within 2 seconds
    await expect(page.locator('text=Vielen Dank!')).toBeVisible();
    await expect(page.locator('text=erfolgreich gesendet')).toBeVisible();

    // 6. Panel should auto-close after success
    await page.waitForTimeout(2500); // Wait for auto-close
    await expect(page.locator('[data-suggestion-panel]')).not.toBeVisible();

    console.log('✅ Quick feedback flow completed successfully!');
  });

  test('🎯 Element Selection Flow - Visual feedback targeting', async ({ page }) => {
    console.log('🎯 Testing: Element-specific feedback');

    // 1. Open suggestion panel
    await page.locator('[aria-label*="Verbesserungen vorschlagen"]').click();
    await expect(page.locator('[data-suggestion-panel]')).toBeVisible();

    // 2. Select element scope
    await page.locator('text=Spezifische Elemente').click();

    // 3. Should show element selection instructions
    await expect(page.locator('text=Element-Auswahl aktiv')).toBeVisible();
    await expect(page.locator('text=Klicken Sie auf Elemente zum Auswählen')).toBeVisible();

    // 4. Click on a visible element (like a heading or paragraph)
    const heading = page.locator('h1, h2, h3').first();
    await heading.click();

    // 5. Element should be highlighted
    await expect(page.locator('.suggestion-selected-element')).toBeVisible();
    await expect(page.locator('text=1 Element ausgewählt')).toBeVisible();

    // 6. Type feedback for the selected element
    const textarea = page.locator('textarea');
    await textarea.fill('Diese Überschrift könnte grösser sein');

    // 7. Submit the element-specific feedback
    await page.click('button:has-text("Senden")');

    // 8. Success message and auto-close
    await expect(page.locator('text=Vielen Dank!')).toBeVisible();
    await page.waitForTimeout(2500);
    await expect(page.locator('[data-suggestion-panel]')).not.toBeVisible();

    console.log('✅ Element selection flow completed successfully!');
  });

  test('⚡ Quick Suggestions - One-click feedback', async ({ page }) => {
    console.log('⚡ Testing: Quick suggestion buttons');

    // 1. Open panel
    await page.locator('[aria-label*="Verbesserungen vorschlagen"]').click();

    // 2. Quick suggestions should be visible
    await expect(page.locator('text=Schnellvorschläge:')).toBeVisible();

    // 3. Click a quick suggestion
    await page.locator('text=Die Seite lädt zu langsam').click();

    // 4. Should auto-fill the textarea
    const textarea = page.locator('textarea');
    await expect(textarea).toHaveValue('Die Seite lädt zu langsam');

    // 5. Submit immediately
    await page.click('button:has-text("Senden")');

    // 6. Success flow
    await expect(page.locator('text=Vielen Dank!')).toBeVisible();

    console.log('✅ Quick suggestions flow completed successfully!');
  });

  test('🌐 Site-wide Feedback Flow', async ({ page }) => {
    console.log('🌐 Testing: Site-wide feedback scope');

    // 1. Open panel
    await page.locator('[aria-label*="Verbesserungen vorschlagen"]').click();

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

    console.log('✅ Site-wide feedback flow completed successfully!');
  });

  test('📱 Mobile Experience - Touch interactions', async ({ page }) => {
    console.log('📱 Testing: Mobile responsiveness');

    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // 1. Button should still be visible on mobile
    await expect(page.locator('[aria-label*="Verbesserungen vorschlagen"]')).toBeVisible();

    // 2. Click button (touch interaction)
    await page.locator('[aria-label*="Verbesserungen vorschlagen"]').click();

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

    console.log('✅ Mobile experience tested successfully!');
  });

  test('⌨️ Keyboard Navigation - Accessibility flow', async ({ page }) => {
    console.log('⌨️ Testing: Keyboard accessibility');

    // 1. Tab to the suggestion button
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab'); // May need multiple tabs depending on page

    // Try to focus the button
    const button = page.locator('[aria-label*="Verbesserungen vorschlagen"]');
    await button.focus();

    // 2. Press Enter to open
    await page.keyboard.press('Enter');
    await expect(page.locator('[data-suggestion-panel]')).toBeVisible();

    // 3. Tab through form elements
    await page.keyboard.press('Tab'); // Focus textarea
    await page.keyboard.type('Keyboard navigation test');

    // 4. Tab to submit button
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // 5. Submit with Enter
    await page.keyboard.press('Enter');

    // 6. Success
    await expect(page.locator('text=Vielen Dank!')).toBeVisible();

    console.log('✅ Keyboard navigation tested successfully!');
  });

  test('🚫 Validation & Error Handling', async ({ page }) => {
    console.log('🚫 Testing: Form validation');

    // 1. Open panel
    await page.locator('[aria-label*="Verbesserungen vorschlagen"]').click();

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

    console.log('✅ Validation and error handling tested successfully!');
  });

  test('🔄 Multiple Element Selection', async ({ page }) => {
    console.log('🔄 Testing: Multiple element selection');

    // 1. Open panel and select element scope
    await page.locator('[aria-label*="Verbesserungen vorschlagen"]').click();
    await page.locator('text=Spezifische Elemente').click();

    // 2. Select multiple elements
    const elements = page.locator('p, h1, h2, h3, button').all();
    const elementsArray = await elements;

    // Click first 3 elements
    for (let i = 0; i < Math.min(3, elementsArray.length); i++) {
      await elementsArray[i].click();
      await page.waitForTimeout(200); // Brief pause for visual feedback
    }

    // 3. Should show multiple selection count
    await expect(page.locator(`text=${Math.min(3, elementsArray.length)} Element`)).toBeVisible();

    // 4. Submit feedback for multiple elements
    const textarea = page.locator('textarea');
    await textarea.fill('Diese Elemente könnten besser abgestimmt werden');
    await page.click('button:has-text("Senden")');

    // 5. Success
    await expect(page.locator('text=Vielen Dank!')).toBeVisible();

    console.log('✅ Multiple element selection tested successfully!');
  });

  test('⏰ Performance - Fast interactions', async ({ page }) => {
    console.log('⏰ Testing: Performance and responsiveness');

    const startTime = Date.now();

    // 1. Click button
    await page.locator('[aria-label*="Verbesserungen vorschlagen"]').click();

    // 2. Panel should appear within 500ms
    await expect(page.locator('[data-suggestion-panel]')).toBeVisible();
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
    expect(totalSubmitTime).toBeLessThan(1000); // Should complete within 1 second

    console.log(`✅ Performance test passed! Panel: ${panelVisibleTime}ms, Submit: ${totalSubmitTime}ms`);
  });

  test('🎪 Edge Cases & Robustness', async ({ page }) => {
    console.log('🎪 Testing: Edge cases and robustness');

    // 1. Test with very long text
    await page.locator('[aria-label*="Verbesserungen vorschlagen"]').click();
    const longText = 'A'.repeat(950); // Near character limit
    await page.locator('textarea').fill(longText);
    await expect(page.locator('text=950/1000 Zeichen')).toBeVisible();

    // Submit long text
    await page.click('button:has-text("Senden")');
    await expect(page.locator('text=Vielen Dank!')).toBeVisible();

    // 2. Test special characters
    await page.locator('[aria-label*="Verbesserungen vorschlagen"]').click();
    await page.locator('textarea').fill('Test with émojis 🎉 and spëcial chärs');
    await page.click('button:has-text("Senden")');
    await expect(page.locator('text=Vielen Dank!')).toBeVisible();

    // 3. Test rapid clicking
    await page.locator('[aria-label*="Verbesserungen vorschlagen"]').click();
    await page.locator('text=Spezifische Elemente').click();

    // Rapid element clicking
    for (let i = 0; i < 5; i++) {
      const element = page.locator('p').nth(i % 3);
      await element.click();
      await page.waitForTimeout(50);
    }

    console.log('✅ Edge cases and robustness tested successfully!');
  });
});
