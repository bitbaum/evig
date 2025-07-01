import { test, expect } from '@playwright/test';

test.describe('Dropdown Menu Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the development server
    await page.goto('http://localhost:3003');
    
    // Wait for the page to load completely
    await page.waitForLoadState('networkidle');
    
    // Handle welcome modal if it exists
    try {
      const welcomeModal = page.locator('[role="dialog"], .fixed.inset-0.z-50, .modal').first();
      if (await welcomeModal.isVisible({ timeout: 2000 })) {
        console.log('Welcome modal detected, closing it...');
        
        // Try to close modal by clicking close button or outside
        const closeButton = page.locator('button[aria-label*="Close"], button[aria-label*="close"], .close, [data-testid="close"]').first();
        if (await closeButton.isVisible({ timeout: 1000 })) {
          await closeButton.click();
        } else {
          // Click outside modal to close
          await page.mouse.click(50, 50);
        }
        
        // Wait for modal to disappear
        await page.waitForTimeout(500);
      }
    } catch (error) {
      console.log('No welcome modal or failed to close:', (error as Error).message);
    }
    
    // Ensure we're at the top of the page
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(300);
  });

  test('should open Services dropdown on hover and keep it open when hovering over content', async ({ page }) => {
    // Wait for navigation to be fully rendered
    await page.waitForSelector('nav', { state: 'visible' });
    
    // Find the Services dropdown trigger
    const servicesDropdown = page.locator('text=Services').first();
    
    // Scroll to top to ensure header is visible
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(200);
    
    await expect(servicesDropdown).toBeVisible();
    console.log('Services dropdown trigger is visible');

    // Hover over the Services trigger
    await servicesDropdown.hover({ force: true });
    
    // Wait a bit for the dropdown to appear
    await page.waitForTimeout(300);

    // Check if dropdown appeared - look for the portal dropdown
    const dropdown = page.locator('.fixed.z-50').first();
    
    try {
      await expect(dropdown).toBeVisible({ timeout: 3000 });
      console.log('✅ Services dropdown appears on hover');

      // Get dropdown bounding box and move mouse to its center
      const dropdownBox = await dropdown.boundingBox();
      if (dropdownBox) {
        const centerX = dropdownBox.x + dropdownBox.width / 2;
        const centerY = dropdownBox.y + dropdownBox.height / 2;
        
        console.log(`Moving mouse to dropdown center: ${centerX}, ${centerY}`);
        await page.mouse.move(centerX, centerY);
        
        // Wait to ensure any timeout would have triggered
        await page.waitForTimeout(400);
        
        // Verify dropdown is still visible
        await expect(dropdown).toBeVisible();
        console.log('✅ Services dropdown stays open when hovering over content');

        // Move mouse completely away from dropdown area
        await page.mouse.move(50, 50);

        // Wait for the timeout (500ms + buffer)
        await page.waitForTimeout(800);

        // Verify dropdown closes
        await expect(dropdown).toBeHidden({ timeout: 3000 });
        console.log('✅ Services dropdown closes when mouse moves away');
      } else {
        throw new Error('Could not get dropdown bounding box');
      }
    } catch (error) {
      console.error('Services dropdown test failed:', (error as Error).message);
      
      // Take a screenshot for debugging
      await page.screenshot({ path: 'dropdown-test-failure.png', fullPage: true });
      throw error;
    }
  });

  test('should open About dropdown (simple dropdown) and handle hover correctly', async ({ page }) => {
    // Wait for navigation to be fully rendered
    await page.waitForSelector('nav', { state: 'visible' });
    
    const aboutDropdown = page.locator('text=About').first();
    
    // Scroll to top to ensure header is visible
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(200);
    
    await expect(aboutDropdown).toBeVisible();
    console.log('About dropdown trigger is visible');

    await aboutDropdown.hover({ force: true });
    await page.waitForTimeout(300);

    const dropdown = page.locator('.fixed.z-50').first();
    
    try {
      await expect(dropdown).toBeVisible({ timeout: 3000 });
      console.log('✅ About dropdown appears on hover');

      // Move to dropdown content
      const dropdownBox = await dropdown.boundingBox();
      if (dropdownBox) {
        const centerX = dropdownBox.x + dropdownBox.width / 2;
        const centerY = dropdownBox.y + dropdownBox.height / 2;
        
        await page.mouse.move(centerX, centerY);
        await page.waitForTimeout(400);
        
        // Verify still visible
        await expect(dropdown).toBeVisible();
        console.log('✅ About dropdown stays open when hovering over content');
      }
    } catch (error) {
      console.error('About dropdown test failed:', (error as Error).message);
      await page.screenshot({ path: 'about-dropdown-failure.png', fullPage: true });
      throw error;
    }
  });
}); 