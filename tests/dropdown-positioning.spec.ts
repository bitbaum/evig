import { test, expect } from '@playwright/test';

test.describe('Dropdown Positioning Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the development server
    await page.goto('http://localhost:3001');
    
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

  test('should position Get Involved dropdown elegantly (Strapi-style)', async ({ page }) => {
    // Wait for navigation to be fully rendered
    await page.waitForSelector('nav', { state: 'visible' });
    
    // Find the Get Involved dropdown trigger
    const getInvolvedTrigger = page.locator('text=Get Involved').first();
    
    await expect(getInvolvedTrigger).toBeVisible();
    console.log('Get Involved dropdown trigger is visible');

    // Get the trigger's position
    const triggerBox = await getInvolvedTrigger.boundingBox();
    if (!triggerBox) throw new Error('Could not get trigger bounding box');
    
    console.log('Trigger position:', triggerBox);

    // Hover over the Get Involved trigger
    await getInvolvedTrigger.hover({ force: true });
    
    // Wait for the dropdown to appear
    await page.waitForTimeout(500);

    // Check if dropdown appeared
    const dropdown = page.locator('[id^="dropdown-"]').first();
    
    try {
      await expect(dropdown).toBeVisible({ timeout: 3000 });
      console.log('✅ Get Involved dropdown appears on hover');

      // Get dropdown position
      const dropdownBox = await dropdown.boundingBox();
      if (!dropdownBox) throw new Error('Could not get dropdown bounding box');
      
      console.log('Dropdown position:', dropdownBox);
      
      // Calculate trigger center
      const triggerCenter = triggerBox.x + triggerBox.width / 2;
      const dropdownCenter = dropdownBox.x + dropdownBox.width / 2;
      
      console.log(`Trigger center: ${triggerCenter}, Dropdown center: ${dropdownCenter}`);
      
      // Check if dropdown is reasonably centered relative to trigger
      const centerDifference = Math.abs(triggerCenter - dropdownCenter);
      console.log(`Center difference: ${centerDifference}px`);
      
      // For Strapi-style positioning, the dropdown should be somewhat centered
      // Allow for some flexibility but ensure it's not rigidly edge-aligned
      const isReasonablyCentered = centerDifference < dropdownBox.width * 0.3; // Within 30% of dropdown width
      
      if (isReasonablyCentered) {
        console.log('✅ Dropdown is reasonably centered (Strapi-style)');
      } else {
        console.log('❌ Dropdown is NOT reasonably centered');
        console.log(`Expected center difference < ${dropdownBox.width * 0.3}px, got ${centerDifference}px`);
      }
      
      // Check if dropdown stays within viewport
      const viewportSize = page.viewportSize();
      const viewportWidth = viewportSize?.width || 1200;
      const isWithinViewport = dropdownBox.x >= 0 && (dropdownBox.x + dropdownBox.width) <= viewportWidth;
      
      if (isWithinViewport) {
        console.log('✅ Dropdown stays within viewport');
      } else {
        console.log('❌ Dropdown goes outside viewport');
        console.log(`Dropdown right edge: ${dropdownBox.x + dropdownBox.width}, Viewport width: ${viewportWidth}`);
      }

      // Take a screenshot for visual verification
      await page.screenshot({ 
        path: 'get-involved-dropdown-positioning.png', 
        fullPage: false,
        clip: {
          x: Math.max(0, triggerBox.x - 100),
          y: Math.max(0, triggerBox.y - 50),
          width: Math.min(viewportWidth, dropdownBox.width + 200),
          height: dropdownBox.height + triggerBox.height + 100
        }
      });
      
      expect(isReasonablyCentered).toBe(true);
      expect(isWithinViewport).toBe(true);
      
    } catch (error) {
      console.error('Get Involved dropdown positioning test failed:', (error as Error).message);
      
      // Take a screenshot for debugging
      await page.screenshot({ path: 'dropdown-positioning-failure.png', fullPage: true });
      throw error;
    }
  });

  test('should position Services dropdown with category columns correctly', async ({ page }) => {
    // Wait for navigation to be fully rendered
    await page.waitForSelector('nav', { state: 'visible' });
    
    const servicesDropdown = page.locator('text=Services').first();
    
    await expect(servicesDropdown).toBeVisible();
    console.log('Services dropdown trigger is visible');

    // Hover over the Services trigger
    await servicesDropdown.hover({ force: true });
    
    // Wait for the dropdown to appear
    await page.waitForTimeout(500);

    const dropdown = page.locator('[id^="dropdown-"]').first();
    
    try {
      await expect(dropdown).toBeVisible({ timeout: 3000 });
      console.log('✅ Services dropdown appears on hover');

      // Check for category headers (should be 3 columns)
      const categoryHeaders = dropdown.locator('h3').filter({ hasText: /HARDWARE SERVICES|SOFTWARE SOLUTIONS|COMING SOON/i });
      const headerCount = await categoryHeaders.count();
      
      console.log(`Found ${headerCount} category headers`);
      
      if (headerCount >= 3) {
        console.log('✅ Services dropdown has category-based columns');
      } else {
        console.log('❌ Services dropdown missing category headers');
      }
      
      // Take a screenshot of the services dropdown
      await page.screenshot({ 
        path: 'services-dropdown-categories.png', 
        fullPage: false 
      });
      
      expect(headerCount).toBeGreaterThanOrEqual(3);
      
    } catch (error) {
      console.error('Services dropdown category test failed:', (error as Error).message);
      await page.screenshot({ path: 'services-dropdown-failure.png', fullPage: true });
      throw error;
    }
  });
}); 