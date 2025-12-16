import { test, expect } from '@playwright/test'

test.describe('Marketplace Functionality', () => {
  test.setTimeout(120000)

  test.beforeEach(async ({ page }) => {
    // Clear any existing session
    await page.context().clearCookies()
  })

  test('User can browse marketplace without authentication', async ({ page }) => {
    console.log('🛒 Testing marketplace browsing...')

    await page.goto('/marketplace')

    // Check marketplace header
    await expect(page.locator('h1')).toContainText('RevampIT Marketplace')

    // Check hero section
    await expect(page.locator('text=Entdecken Sie hochwertige refurbished Produkte')).toBeVisible()

    // Check search functionality
    await expect(page.locator('input[placeholder*="Suche nach Produkten"]')).toBeVisible()

    // Check filter options
    await expect(page.locator('text=Alle Kategorien')).toBeVisible()
    await expect(page.locator('text=Alle Zustände')).toBeVisible()
    await expect(page.locator('text=Alle Verkäufer')).toBeVisible()

    // Check statistics cards
    await expect(page.locator('text=Gesamt Produkte')).toBeVisible()
    await expect(page.locator('text=RevampIT Produkte')).toBeVisible()
    await expect(page.locator('text=Community Produkte')).toBeVisible()

    // Check sample products are displayed
    await expect(page.locator('text=Refurbished MacBook Pro 14" M2')).toBeVisible()
    await expect(page.locator('text=MacBook Air M1 - Perfekt Zustand')).toBeVisible()

    // Check official product badges
    await expect(page.locator('text=RevampIT')).toBeVisible()

    // Check condition badges
    await expect(page.locator('text=Wie neu')).toBeVisible()
    await expect(page.locator('text=Gut')).toBeVisible()

    // Check call-to-action for non-authenticated users
    await expect(page.locator('text=Melden Sie sich an, um Produkte zu kaufen')).toBeVisible()
    await expect(page.locator('text=Anmelden')).toBeVisible()
    await expect(page.locator('text=Registrieren')).toBeVisible()

    console.log('✅ Marketplace browsing test passed!')
  })

  test('User registration with role selection works', async ({ page }) => {
    console.log('👤 Testing user registration with role selection...')

    await page.goto('/auth/register')

    // Check registration form
    await expect(page.locator('h1')).toContainText('Konto erstellen')

    // Fill basic information
    await page.fill('input[name="name"]', 'Test Seller')
    await page.fill('input[name="email"]', `test-seller-${Date.now()}@example.com`)
    await page.fill('input[name="password"]', 'TestPassword123!')
    await page.fill('input[name="confirmPassword"]', 'TestPassword123!')

    // Select seller role
    await page.click('text=Verkäufer')
    await expect(page.locator('text=Großartig! Sie können sofort mit dem Verkauf')).toBeVisible()

    // Accept terms
    await page.check('input[id="terms"]')

    // Submit form
    await page.click('button[type="submit"]')

    // Wait for success message or redirect
    await expect(page.locator('text=Bitte bestätigen Sie Ihre E-Mail-Adresse')).toBeVisible()

    console.log('✅ User registration with role selection test passed!')
  })

  test('Seller can access seller dashboard after registration', async ({ page }) => {
    console.log('🏪 Testing seller dashboard access...')

    // First register as seller
    await page.goto('/auth/register')

    const testEmail = `seller-${Date.now()}@example.com`

    await page.fill('input[name="name"]', 'Test Seller')
    await page.fill('input[name="email"]', testEmail)
    await page.fill('input[name="password"]', 'TestPassword123!')
    await page.fill('input[name="confirmPassword"]', 'TestPassword123!')
    await page.click('text=Verkäufer')
    await page.check('input[id="terms"]')
    await page.click('button[type="submit"]')

    // Skip email verification for this test - go directly to login
    await page.goto('/auth/login')

    // Login (assuming email verification is bypassed for test)
    await page.fill('input[name="email"]', testEmail)
    await page.fill('input[name="password"]', 'TestPassword123!')
    await page.click('button[type="submit"]')

    // Check if redirected to dashboard
    await page.waitForURL('/dashboard')

    // Check seller dashboard access
    await expect(page.locator('text=Seller Dashboard')).toBeVisible()
    await expect(page.locator('text=Meine Produkte')).toBeVisible()
    await expect(page.locator('text=Verkäufe')).toBeVisible()

    console.log('✅ Seller dashboard access test passed!')
  })

  test('Marketplace shows become seller CTA for authenticated users', async ({ page }) => {
    console.log('👨‍💼 Testing marketplace CTA for authenticated users...')

    // Register and login first (simplified)
    await page.goto('/auth/register')
    const testEmail = `marketplace-user-${Date.now()}@example.com`

    await page.fill('input[name="name"]', 'Marketplace User')
    await page.fill('input[name="email"]', testEmail)
    await page.fill('input[name="password"]', 'TestPassword123!')
    await page.fill('input[name="confirmPassword"]', 'TestPassword123!')
    await page.click('text=Kunde') // Regular user
    await page.check('input[id="terms"]')
    await page.click('button[type="submit"]')

    // Go to marketplace
    await page.goto('/marketplace')

    // Check CTA for authenticated users
    await expect(page.locator('text=Werden Sie Verkäufer')).toBeVisible()
    await expect(page.locator('text=Jetzt starten')).toBeVisible()

    console.log('✅ Marketplace CTA test passed!')
  })

  test('Product filtering works correctly', async ({ page }) => {
    console.log('🔍 Testing product filtering...')

    await page.goto('/marketplace')

    // Test category filter
    const categorySelect = page.locator('select').first()
    await categorySelect.selectOption('Laptops')
    await expect(page.locator('text=Refurbished MacBook Pro 14" M2')).toBeVisible()

    // Test condition filter
    const conditionSelect = page.locator('select').nth(1)
    await conditionSelect.selectOption('Wie neu')
    await expect(page.locator('text=Wie neu')).toBeVisible()

    console.log('✅ Product filtering test passed!')
  })

  test('Product search functionality works', async ({ page }) => {
    console.log('🔎 Testing product search...')

    await page.goto('/marketplace')

    // Test search input
    const searchInput = page.locator('input[placeholder*="Suche nach Produkten"]')
    await searchInput.fill('MacBook')
    await expect(page.locator('text=Refurbished MacBook Pro 14" M2')).toBeVisible()
    await expect(page.locator('text=MacBook Air M1 - Perfekt Zustand')).toBeVisible()

    // Clear search
    await searchInput.clear()
    await expect(page.locator('text=Gaming Desktop PC i7-12700K')).toBeVisible()

    console.log('✅ Product search test passed!')
  })
})






