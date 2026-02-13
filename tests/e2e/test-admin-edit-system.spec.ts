import { test, expect } from '@playwright/test';

const BASE_URL = 'https://revampit.vercel.app';
const ADMIN_EMAIL = 'georgy.butaev@revamp-it.ch';
const ADMIN_PASSWORD = 'Asdfgh11!';

test.describe('Admin Edit-Before-Approve System', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto(`${BASE_URL}/auth/login`);
    await page.fill('input[type="email"]', ADMIN_EMAIL);
    await page.fill('input[type="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/admin|\/dashboard/);
  });

  test('Workshop Proposal Edit Flow', async ({ page }) => {
    console.log('Testing workshop proposal edit flow...');
    
    // Navigate to workshops admin
    await page.goto(`${BASE_URL}/admin/workshops`);
    await page.waitForLoadState('networkidle');
    
    // Take screenshot of workshop list
    await page.screenshot({ path: '/tmp/workshop-list.png', fullPage: true });
    console.log('Screenshot saved: workshop-list.png');
    
    // Check if there are any pending proposals
    const proposalCards = await page.locator('[class*="proposal"]').count();
    console.log(`Found ${proposalCards} proposal elements`);
    
    // Try to find and click on a proposal detail link
    const detailLinks = page.locator('a:has-text("Details")');
    const detailCount = await detailLinks.count();
    
    if (detailCount > 0) {
      console.log(`Found ${detailCount} detail links, clicking first one...`);
      await detailLinks.first().click();
      await page.waitForLoadState('networkidle');
      
      // Take screenshot of detail page
      await page.screenshot({ path: '/tmp/workshop-detail.png', fullPage: true });
      console.log('Screenshot saved: workshop-detail.png');
      
      // Check for edit button
      const editButton = page.locator('button:has-text("Bearbeiten")');
      const editExists = await editButton.count() > 0;
      console.log(`Edit button exists: ${editExists}`);
      
      if (editExists) {
        // Click edit button
        await editButton.click();
        await page.waitForTimeout(1000);
        
        // Take screenshot of edit modal
        await page.screenshot({ path: '/tmp/workshop-edit-modal.png', fullPage: true });
        console.log('Screenshot saved: workshop-edit-modal.png');
        
        // Check for modal title
        const modalTitle = page.locator('h2:has-text("Vorschlag bearbeiten")');
        expect(await modalTitle.count()).toBeGreaterThan(0);
        console.log('✅ Edit modal opened successfully');
        
        // Modify a field
        const titleInput = page.locator('input[value*=""]').first();
        await titleInput.fill('Test Edit - Automated');
        
        // Click save
        await page.click('button:has-text("Speichern")');
        await page.waitForTimeout(2000);
        
        // Take screenshot after save
        await page.screenshot({ path: '/tmp/workshop-after-edit.png', fullPage: true });
        console.log('Screenshot saved: workshop-after-edit.png');
        
        console.log('✅ Workshop proposal edit test completed');
      } else {
        console.log('⚠️ No edit button found (proposal may not be pending)');
      }
    } else {
      console.log('⚠️ No proposals found to test');
    }
  });

  test('Blog Submission Edit Flow', async ({ page }) => {
    console.log('Testing blog submission edit flow...');
    
    // Navigate to blog submissions
    await page.goto(`${BASE_URL}/admin/content/submissions`);
    await page.waitForLoadState('networkidle');
    
    // Take screenshot
    await page.screenshot({ path: '/tmp/blog-submissions.png', fullPage: true });
    console.log('Screenshot saved: blog-submissions.png');
    
    // Try to find a submission
    const submissions = page.locator('[class*="submission"]');
    const submissionCount = await submissions.count();
    console.log(`Found ${submissionCount} submission elements`);
    
    if (submissionCount > 0) {
      // Click first submission
      await submissions.first().click();
      await page.waitForTimeout(1000);
      
      // Take screenshot of detail panel
      await page.screenshot({ path: '/tmp/blog-detail.png', fullPage: true });
      console.log('Screenshot saved: blog-detail.png');
      
      // Check for edit button
      const editButton = page.locator('button:has-text("Bearbeiten")');
      const editExists = await editButton.count() > 0;
      console.log(`Edit button exists: ${editExists}`);
      
      if (editExists) {
        await editButton.click();
        await page.waitForTimeout(1000);
        
        // Take screenshot of edit modal
        await page.screenshot({ path: '/tmp/blog-edit-modal.png', fullPage: true });
        console.log('Screenshot saved: blog-edit-modal.png');
        console.log('✅ Blog submission edit test completed');
      } else {
        console.log('⚠️ No edit button found (submission may not be pending)');
      }
    } else {
      console.log('⚠️ No submissions found to test');
    }
  });

  test('Visual Indicators Test', async ({ page }) => {
    console.log('Testing visual indicators...');
    
    // Check workshop list for badges
    await page.goto(`${BASE_URL}/admin/workshops`);
    await page.waitForLoadState('networkidle');
    
    const editBadges = page.locator('text="Von Admin bearbeitet"');
    const badgeCount = await editBadges.count();
    console.log(`Found ${badgeCount} "Von Admin bearbeitet" badges`);
    
    await page.screenshot({ path: '/tmp/visual-indicators.png', fullPage: true });
    console.log('Screenshot saved: visual-indicators.png');
    console.log('✅ Visual indicators test completed');
  });
});
