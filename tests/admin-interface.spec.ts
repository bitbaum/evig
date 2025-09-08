import { test, expect } from '@playwright/test';

// Configure test environment
test.use({
  baseURL: 'http://localhost:3001', // Next.js app
  headless: false, // Set to true for CI
  screenshot: 'only-on-failure',
  video: 'retain-on-failure',
});

test.describe('Reboot Content Admin Interface - End-to-End Tests', () => {
  test.setTimeout(120000); // 2 minutes timeout

  test.beforeAll(async () => {
    // Ensure servers are running
    console.log('🚀 Testing Reboot Content Admin Interface');
    console.log('📋 Test Environment:');
    console.log('   - Frontend: http://localhost:3001');
    console.log('   - API: http://localhost:3001/api');
    console.log('   - Admin: http://localhost:3001/admin');
  });

  test('Complete admin workflow: Login → Create Page → Edit → Publish → Verify', async ({ page }) => {
    console.log('🔐 Step 1: Testing admin login...');

    // Navigate to admin login
    await page.goto('/admin/login');
    await expect(page).toHaveTitle(/.*Admin.*/i);

    // Fill login form
    await page.fill('input[name="email"]', 'admin@revampit.ch');
    await page.fill('input[name="password"]', 'Admin123!');

    // Click login button
    await page.click('button[type="submit"]');

    // Wait for redirect to admin dashboard
    await page.waitForURL('/admin');
    await expect(page).toHaveURL('/admin');

    console.log('✅ Login successful');

    // Navigate to pages
    console.log('📄 Step 2: Navigating to pages management...');
    await page.goto('/admin/pages');
    await expect(page.locator('h1')).toContainText('Static Pages');

    // Click "New Page" button
    console.log('📝 Step 3: Creating new test page...');
    await page.click('text=+ New Page');

    // Wait for new page form
    await page.waitForURL('/admin/pages/new');
    await expect(page.locator('h1')).toContainText('Create New Page');

    // Fill page details
    const testPageTitle = `Test Page ${Date.now()}`;
    const testPageSlug = `test-page-${Date.now()}`;

    await page.fill('input[name="title"]', testPageTitle);
    await page.fill('input[name="slug"]', testPageSlug);

    // Fill content using the WYSIWYG editor
    const contentEditor = page.locator('[contenteditable="true"]');
    await contentEditor.click();
    await contentEditor.fill('<h2>Test Content</h2><p>This is a test page created by automated testing.</p><ul><li>Point 1</li><li>Point 2</li></ul>');

    // Fill SEO fields
    await page.fill('input[name="seo_title"]', `${testPageTitle} - SEO Title`);
    await page.fill('textarea[name="seo_description"]', 'This is a test page for automated testing of the admin interface.');

    // Click "Create & Publish"
    console.log('📤 Step 4: Publishing new page...');
    await page.click('button:has-text("Create & Publish")');

    // Wait for success message
    await expect(page.locator('text=Page created and published!')).toBeVisible();

    // Navigate back to pages list
    await page.goto('/admin/pages');
    await expect(page.locator('h1')).toContainText('Static Pages');

    // Verify the new page appears in the list
    await expect(page.locator(`text=${testPageTitle}`)).toBeVisible();

    // Edit the page
    console.log('✏️ Step 5: Editing the created page...');
    await page.click(`text=${testPageTitle}`);
    await page.waitForURL(/\/admin\/pages\/[a-f0-9-]+/);

    // Modify content
    const editContent = page.locator('[contenteditable="true"]');
    await editContent.click();
    await editContent.press('End');
    await editContent.press('Enter');
    await editContent.fill('<p><strong>Updated by automated test</strong></p>');

    // Save as draft first
    await page.click('button:has-text("Save Draft")');
    await expect(page.locator('text=Draft saved successfully!')).toBeVisible();

    // Then publish
    await page.click('button:has-text("Publish")');
    await expect(page.locator('text=Page published successfully!')).toBeVisible();

    // Verify the page is live on the frontend
    console.log('🔍 Step 6: Verifying page is live...');
    const livePageURL = `/test-page-${testPageSlug.split('-').pop()}`;
    await page.goto(livePageURL);

    // Check that the content appears on the live page
    await expect(page.locator('h2:has-text("Test Content")')).toBeVisible();
    await expect(page.locator('text=Updated by automated test')).toBeVisible();

    console.log('✅ End-to-end test completed successfully!');
  });

  test('Admin interface accessibility and UX validation', async ({ page }) => {
    console.log('♿ Testing admin interface accessibility...');

    await page.goto('/admin/login');

    // Check for proper form labels
    await expect(page.locator('label[for="email"]')).toContainText('Email');
    await expect(page.locator('label[for="password"]')).toContainText('Password');

    // Check for keyboard navigation
    await page.keyboard.press('Tab');
    await expect(page.locator('input[name="email"]')).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(page.locator('input[name="password"]')).toBeFocused();

    // Login for further testing
    await page.fill('input[name="email"]', 'admin@revampit.ch');
    await page.fill('input[name="password"]', 'Admin123!');
    await page.click('button[type="submit"]');

    await page.waitForURL('/admin/pages');

    // Test search functionality
    const searchInput = page.locator('input[placeholder*="Search"]');
    await searchInput.fill('about');
    await expect(page.locator('text=About RevampIT')).toBeVisible();

    // Clear search
    await searchInput.clear();

    console.log('✅ Accessibility and UX tests passed!');
  });

  test('Error handling and validation', async ({ page }) => {
    console.log('🚨 Testing error handling...');

    await page.goto('/admin/login');

    // Test empty form submission
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Email and password are required')).toBeVisible();

    // Test invalid credentials
    await page.fill('input[name="email"]', 'invalid@email.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Invalid credentials')).toBeVisible();

    // Test valid login
    await page.fill('input[name="email"]', 'admin@revampit.ch');
    await page.fill('input[name="password"]', 'Admin123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/admin');

    console.log('✅ Error handling tests passed!');
  });

  test('WYSIWYG editor functionality', async ({ page }) => {
    console.log('📝 Testing WYSIWYG editor...');

    // Login first
    await page.goto('/admin/login');
    await page.fill('input[name="email"]', 'admin@revampit.ch');
    await page.fill('input[name="password"]', 'Admin123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/admin');

    // Go to new page
    await page.goto('/admin/pages/new');

    // Test editor toolbar buttons
    const contentEditor = page.locator('[contenteditable="true"]');
    await contentEditor.click();
    await contentEditor.fill('Test content for editor validation');

    // Test bold button
    await page.click('button:has-text("B")');
    await contentEditor.type('bold text');
    await expect(contentEditor).toContainText('<strong>bold text</strong>');

    // Test italic button
    await page.click('button:has-text("I")');
    await contentEditor.type('italic text');
    await expect(contentEditor).toContainText('<em>italic text</em>');

    // Test list buttons
    await page.click('button:has-text("• List")');
    await contentEditor.type('List item 1');
    await contentEditor.press('Enter');
    await contentEditor.type('List item 2');

    console.log('✅ WYSIWYG editor tests passed!');
  });
});
