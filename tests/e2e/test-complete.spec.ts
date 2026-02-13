import { test, expect, chromium } from '@playwright/test';

const BASE_URL = 'https://revampit.vercel.app';

test('Complete Admin Edit System Test', async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    console.log('1. Navigating to login page...');
    await page.goto(`${BASE_URL}/auth/login`, { waitUntil: 'networkidle' });
    await page.screenshot({ path: '/tmp/01-login-page.png' });
    
    console.log('2. Filling in credentials...');
    // Try different selector strategies
    const emailInput = await page.locator('input[type="email"], input[name="email"], input[autocomplete="email"]').first();
    await emailInput.fill('georgy.butaev@revamp-it.ch');
    
    const passwordInput = await page.locator('input[type="password"], input[name="password"]').first();
    await passwordInput.fill('Asdfgh11!');
    
    await page.screenshot({ path: '/tmp/02-credentials-filled.png' });
    
    console.log('3. Clicking login button...');
    const loginButton = await page.locator('button[type="submit"], button:has-text("Anmelden"), button:has-text("Login")').first();
    await loginButton.click();
    
    console.log('4. Waiting for navigation...');
    await page.waitForTimeout(5000); // Give it time to process
    await page.screenshot({ path: '/tmp/03-after-login.png' });
    
    const currentUrl = page.url();
    console.log(`Current URL: ${currentUrl}`);
    
    // Navigate directly to admin workshops
    console.log('5. Going to admin workshops...');
    await page.goto(`${BASE_URL}/admin/workshops`, { waitUntil: 'networkidle' });
    await page.screenshot({ path: '/tmp/04-workshops-page.png', fullPage: true });
    
    console.log('6. Looking for proposals...');
    const pageText = await page.textContent('body');
    console.log(`Page contains "Vorschlag": ${pageText?.includes('Vorschlag') || false}`);
    console.log(`Page contains "Workshop": ${pageText?.includes('Workshop') || false}`);
    
    // Try to find any clickable workshop links
    const links = await page.locator('a').all();
    console.log(`Found ${links.length} total links on page`);
    
    for (const link of links.slice(0, 10)) {
      const text = await link.textContent();
      console.log(`Link: ${text?.substring(0, 50)}`);
    }
    
    console.log('7. Checking admin content submissions...');
    await page.goto(`${BASE_URL}/admin/content/submissions`, { waitUntil: 'networkidle' });
    await page.screenshot({ path: '/tmp/05-submissions-page.png', fullPage: true });
    
    const submissionsText = await page.textContent('body');
    console.log(`Submissions page contains "Einreichung": ${submissionsText?.includes('Einreichung') || false}`);
    console.log(`Submissions page contains "Bearbeiten": ${submissionsText?.includes('Bearbeiten') || false}`);
    
    console.log('\n✅ Test completed! Check screenshots in /tmp/');
    console.log('Screenshots created:');
    console.log('  - 01-login-page.png');
    console.log('  - 02-credentials-filled.png');
    console.log('  - 03-after-login.png');
    console.log('  - 04-workshops-page.png');
    console.log('  - 05-submissions-page.png');
    
  } catch (error) {
    console.error('Error during test:', error);
    await page.screenshot({ path: '/tmp/error-screenshot.png' });
    throw error;
  } finally {
    await browser.close();
  }
});
