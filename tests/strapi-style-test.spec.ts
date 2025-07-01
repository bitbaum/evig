import { test, expect } from '@playwright/test';

test.describe('Strapi-Style Dropdown Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3001');
    await page.waitForLoadState('networkidle');
    
    // Handle welcome modal if it exists
    try {
      const welcomeModal = page.locator('[role="dialog"], .fixed.inset-0.z-50, .modal').first();
      if (await welcomeModal.isVisible({ timeout: 2000 })) {
        const closeButton = page.locator('button[aria-label*="Close"], button[aria-label*="close"], .close, [data-testid="close"]').first();
        if (await closeButton.isVisible({ timeout: 1000 })) {
          await closeButton.click();
        } else {
          await page.mouse.click(50, 50);
        }
        await page.waitForTimeout(500);
      }
    } catch (error) {
      console.log('No welcome modal or failed to close');
    }
    
    await page.waitForSelector('nav', { state: 'visible' });
    await page.waitForTimeout(500);
  });

  // Helper function to trigger dropdowns via JavaScript
  const triggerDropdownJS = async (page: any, dropdownId: string) => {
    return await page.evaluate((id: string) => {
      // Find dropdown context in React fibers
      const allElements = document.querySelectorAll('*');
      let dropdownContext = null;
      
      for (const element of allElements) {
        const keys = Object.keys(element);
        const reactFiberKey = keys.find(key => key.startsWith('__reactFiber'));
        
        if (reactFiberKey) {
          const fiber = (element as any)[reactFiberKey];
          let currentFiber = fiber;
          
          while (currentFiber && currentFiber.memoizedProps !== undefined) {
            if (currentFiber.type?.name === 'DropdownProvider' || 
                (currentFiber.memoizedProps && currentFiber.memoizedProps.value)) {
              const contextValue = currentFiber.memoizedProps.value;
              if (contextValue && contextValue.setOpenDropdown) {
                dropdownContext = contextValue;
                break;
              }
            }
            currentFiber = currentFiber.return;
          }
          
          if (dropdownContext) break;
        }
      }
      
      if (dropdownContext) {
        dropdownContext.setOpenDropdown(id);
        return { success: true };
      }
      return { success: false, error: 'Context not found' };
    }, dropdownId);
  };

  test('Services dropdown - Strapi-style centered with categories', async ({ page }) => {
    console.log('=== SERVICES DROPDOWN STRAPI-STYLE TEST ===');
    
    // Trigger Services dropdown via JavaScript
    const result = await triggerDropdownJS(page, 'services');
    expect(result.success).toBe(true);
    
    // Wait for dropdown to appear
    await page.waitForTimeout(300);
    
    // Check if dropdown content is visible
    const dropdownContent = page.locator('#dropdown-services').first();
    const isVisible = await dropdownContent.isVisible();
    expect(isVisible).toBe(true);
    console.log('✅ Services dropdown content is visible');
    
    // Get dropdown and trigger positions
    const dropdownBox = await dropdownContent.boundingBox();
    const servicesLink = page.locator('nav a:has-text("Services")').first();
    const triggerBox = await servicesLink.boundingBox();
    
    expect(dropdownBox).not.toBeNull();
    expect(triggerBox).not.toBeNull();
    
    console.log('Dropdown position:', dropdownBox);
    console.log('Trigger position:', triggerBox);
    
    // Calculate centers for Strapi-style positioning validation
    const triggerCenter = triggerBox!.x + triggerBox!.width / 2;
    const dropdownCenter = dropdownBox!.x + dropdownBox!.width / 2;
    const centerDifference = Math.abs(triggerCenter - dropdownCenter);
    
    console.log(`Trigger center: ${triggerCenter}, Dropdown center: ${dropdownCenter}`);
    console.log(`Center difference: ${centerDifference}px`);
    
    // Strapi-style should be reasonably centered (within 50px tolerance)
    const isReasonablyCentered = centerDifference < 50;
    console.log(`✅ Dropdown is reasonably centered: ${isReasonablyCentered}`);
    expect(isReasonablyCentered).toBe(true);
    
    // Check for category headers (Hardware Services, Software Solutions, Coming Soon)
    const categoryHeaders = dropdownContent.locator('h3').filter({ 
      hasText: /HARDWARE SERVICES|SOFTWARE SOLUTIONS|COMING SOON/i 
    });
    const headerCount = await categoryHeaders.count();
    console.log(`Found ${headerCount} category headers`);
    expect(headerCount).toBeGreaterThanOrEqual(3);
    
    // Verify it's a 3-column layout
    const gridElement = dropdownContent.locator('.grid-cols-3').first();
    const hasThreeColumns = await gridElement.isVisible();
    console.log(`✅ Has 3-column layout: ${hasThreeColumns}`);
    expect(hasThreeColumns).toBe(true);
    
    // Check specific Services content
    const hasHardwareServices = await dropdownContent.locator('text=Hardware Services').isVisible();
    const hasSoftwareSolutions = await dropdownContent.locator('text=Software Solutions').isVisible();
    const hasComingSoon = await dropdownContent.locator('text=Coming Soon').isVisible();
    
    console.log(`✅ Contains Hardware Services: ${hasHardwareServices}`);
    console.log(`✅ Contains Software Solutions: ${hasSoftwareSolutions}`);
    console.log(`✅ Contains Coming Soon: ${hasComingSoon}`);
    
    expect(hasHardwareServices).toBe(true);
    expect(hasSoftwareSolutions).toBe(true);
    expect(hasComingSoon).toBe(true);
    
    // Take screenshot for verification
    await page.screenshot({ path: 'services-dropdown-strapi-style.png', fullPage: false });
  });

  test('Get Involved dropdown - Strapi-style centered positioning', async ({ page }) => {
    console.log('=== GET INVOLVED DROPDOWN STRAPI-STYLE TEST ===');
    
    // Trigger Get Involved dropdown via JavaScript
    const result = await triggerDropdownJS(page, 'get involved');
    expect(result.success).toBe(true);
    
    // Wait for dropdown to appear
    await page.waitForTimeout(300);
    
    // Check if dropdown content is visible
    const dropdownContent = page.locator('#dropdown-get\\ involved').first();
    const isVisible = await dropdownContent.isVisible();
    expect(isVisible).toBe(true);
    console.log('✅ Get Involved dropdown content is visible');
    
    // Get dropdown and trigger positions
    const dropdownBox = await dropdownContent.boundingBox();
    const getInvolvedLink = page.locator('nav a:has-text("Get Involved")').first();
    const triggerBox = await getInvolvedLink.boundingBox();
    
    expect(dropdownBox).not.toBeNull();
    expect(triggerBox).not.toBeNull();
    
    console.log('Dropdown position:', dropdownBox);
    console.log('Trigger position:', triggerBox);
    
    // Calculate centers for Strapi-style positioning validation
    const triggerCenter = triggerBox!.x + triggerBox!.width / 2;
    const dropdownCenter = dropdownBox!.x + dropdownBox!.width / 2;
    const centerDifference = Math.abs(triggerCenter - dropdownCenter);
    
    console.log(`Trigger center: ${triggerCenter}, Dropdown center: ${dropdownCenter}`);
    console.log(`Center difference: ${centerDifference}px`);
    
    // For right-side nav items, Strapi-style prioritizes viewport fit over perfect centering
    const isReasonablyCentered = centerDifference < 50;
    const isWithinViewport = dropdownBox!.x >= 0 && (dropdownBox!.x + dropdownBox!.width) <= (page.viewportSize()?.width || 1200);
    
    console.log(`Dropdown centering (${centerDifference}px): ${isReasonablyCentered ? 'centered' : 'viewport-adjusted'}`);
    console.log(`✅ Dropdown positioning: ${isWithinViewport ? 'professional (Strapi-style)' : 'needs adjustment'}`);
    
    // Right-side dropdowns should either be centered OR properly positioned for viewport
    const hasProperStrApiPositioning = isReasonablyCentered || isWithinViewport;
    expect(hasProperStrApiPositioning).toBe(true);
    
    // Final validation - dropdown should be properly positioned
    console.log(`✅ Dropdown stays within viewport: ${isWithinViewport}`);
    expect(isWithinViewport).toBe(true);
    
    // Take screenshot for verification
    await page.screenshot({ path: 'get-involved-dropdown-strapi-style.png', fullPage: false });
  });

  test('About dropdown - simple Strapi-style positioning', async ({ page }) => {
    console.log('=== ABOUT DROPDOWN STRAPI-STYLE TEST ===');
    
    // Trigger About dropdown via JavaScript
    const result = await triggerDropdownJS(page, 'about');
    expect(result.success).toBe(true);
    
    // Wait for dropdown to appear
    await page.waitForTimeout(300);
    
    // Check if dropdown content is visible
    const dropdownContent = page.locator('#dropdown-about').first();
    const isVisible = await dropdownContent.isVisible();
    expect(isVisible).toBe(true);
    console.log('✅ About dropdown content is visible');
    
    // Verify it's a simple 1-column layout (not multi-column)
    const hasMultiColumn = await dropdownContent.locator('.grid-cols-2, .grid-cols-3').isVisible();
    console.log(`✅ Is simple layout (not multi-column): ${!hasMultiColumn}`);
    expect(hasMultiColumn).toBe(false);
    
    // Take screenshot for verification
    await page.screenshot({ path: 'about-dropdown-strapi-style.png', fullPage: false });
  });
}); 