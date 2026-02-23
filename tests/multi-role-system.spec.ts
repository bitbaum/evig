import { test, expect } from '@playwright/test'

// These tests require a running database with test accounts.
// Skip in local dev; run in CI with test fixtures.
test.describe('Multi-Role System', () => {
  test.skip(({ browserName }) => true, 'Requires test database and accounts')
  test.setTimeout(120000)

  test.beforeEach(async ({ page }) => {
    // Clear any existing session
    await page.context().clearCookies()
  })

  test('Admin user can access admin dashboard', async ({ page }) => {
    console.log('👑 Testing admin dashboard access...')

    await page.goto('/auth/login')

    // Login as admin
    await page.fill('input[name="email"]', 'admin@revampit.ch')
    await page.fill('input[name="password"]', 'Admin123!')
    await page.click('button[type="submit"]')

    // Should redirect to admin dashboard
    await page.waitForURL('/admin')
    await expect(page.locator('h1')).toContainText('Admin Dashboard')
    await expect(page.locator('text=Systemübersicht')).toBeVisible()

    // Check admin navigation
    await expect(page.locator('text=Produkte')).toBeVisible()
    await expect(page.locator('text=Benutzer')).toBeVisible()
    await expect(page.locator('text=Workshops')).toBeVisible()

    console.log('✅ Admin dashboard access test passed!')
  })

  test('Seller role shows correct dashboard options', async ({ page }) => {
    console.log('🏪 Testing seller role dashboard...')

    // Register as seller
    await page.goto('/auth/register')
    const testEmail = `role-seller-${Date.now()}@example.com`

    await page.fill('input[name="name"]', 'Role Test Seller')
    await page.fill('input[name="email"]', testEmail)
    await page.fill('input[name="password"]', 'TestPassword123!')
    await page.fill('input[name="confirmPassword"]', 'TestPassword123!')
    await page.click('text=Verkäufer')
    await page.check('input[id="terms"]')
    await page.click('button[type="submit"]')

    // Skip to dashboard
    await page.goto('/dashboard')

    // Check seller-specific quick actions
    await expect(page.locator('text=Seller Dashboard')).toBeVisible()
    await expect(page.locator('text=Meine Produkte')).toBeVisible()
    await expect(page.locator('text=Verkäufe')).toBeVisible()

    console.log('✅ Seller role dashboard test passed!')
  })

  test('Repairer role shows correct dashboard options', async ({ page }) => {
    console.log('🔧 Testing repairer role dashboard...')

    // Register as repairer
    await page.goto('/auth/register')
    const testEmail = `role-repairer-${Date.now()}@example.com`

    await page.fill('input[name="name"]', 'Role Test Repairer')
    await page.fill('input[name="email"]', testEmail)
    await page.fill('input[name="password"]', 'TestPassword123!')
    await page.fill('input[name="confirmPassword"]', 'TestPassword123!')
    await page.click('text=Reparateur')
    await page.check('input[id="terms"]')
    await page.click('button[type="submit"]')

    // Skip to dashboard
    await page.goto('/dashboard')

    // Check repairer-specific quick actions
    await expect(page.locator('text=Repairer Dashboard')).toBeVisible()
    await expect(page.locator('text=Buchungen verwalten')).toBeVisible()
    await expect(page.locator('text=Dienste bearbeiten')).toBeVisible()

    console.log('✅ Repairer role dashboard test passed!')
  })

  test('Regular user has limited dashboard options', async ({ page }) => {
    console.log('👤 Testing regular user dashboard...')

    // Register as regular user
    await page.goto('/auth/register')
    const testEmail = `role-user-${Date.now()}@example.com`

    await page.fill('input[name="name"]', 'Role Test User')
    await page.fill('input[name="email"]', testEmail)
    await page.fill('input[name="password"]', 'TestPassword123!')
    await page.fill('input[name="confirmPassword"]', 'TestPassword123!')
    await page.click('text=Kunde') // Regular user
    await page.check('input[id="terms"]')
    await page.click('button[type="submit"]')

    // Skip to dashboard
    await page.goto('/dashboard')

    // Check user has no admin/seller/repairer specific options
    await expect(page.locator('text=Admin-Bereich')).not.toBeVisible()
    await expect(page.locator('text=Seller Dashboard')).not.toBeVisible()
    await expect(page.locator('text=Repairer Dashboard')).not.toBeVisible()

    // Should have basic user options
    await expect(page.locator('text=Mein Profil')).toBeVisible()
    await expect(page.locator('text=Meine Workshops')).toBeVisible()

    console.log('✅ Regular user dashboard test passed!')
  })

  test('Unauthorized users cannot access admin routes', async ({ page }) => {
    console.log('🚫 Testing admin route protection...')

    // Try to access admin routes without authentication
    await page.goto('/admin')
    await expect(page).toHaveURL('/auth/login?callbackUrl=/admin')

    // Try with regular user
    await page.goto('/auth/register')
    const testEmail = `no-admin-${Date.now()}@example.com`

    await page.fill('input[name="name"]', 'No Admin User')
    await page.fill('input[name="email"]', testEmail)
    await page.fill('input[name="password"]', 'TestPassword123!')
    await page.fill('input[name="confirmPassword"]', 'TestPassword123!')
    await page.click('text=Kunde')
    await page.check('input[id="terms"]')
    await page.click('button[type="submit"]')

    // Try to access admin routes
    await page.goto('/admin')
    await expect(page).toHaveURL('/dashboard?error=access_denied')

    console.log('✅ Admin route protection test passed!')
  })

  test('Role-based navigation works correctly', async ({ page }) => {
    console.log('🧭 Testing role-based navigation...')

    // Test admin navigation
    await page.goto('/auth/login')
    await page.fill('input[name="email"]', 'admin@revampit.ch')
    await page.fill('input[name="password"]', 'Admin123!')
    await page.click('button[type="submit"]')
    await page.waitForURL('/admin')

    // Admin should see all navigation options
    await expect(page.locator('text=Dashboard')).toBeVisible()
    await expect(page.locator('text=Produkte')).toBeVisible()
    await expect(page.locator('text=Benutzer')).toBeVisible()

    // Logout
    await page.click('text=Abmelden')
    await page.waitForURL('/')

    console.log('✅ Role-based navigation test passed!')
  })

  test('Role selection validation in registration', async ({ page }) => {
    console.log('📝 Testing role selection validation...')

    await page.goto('/auth/register')

    // Try to register without selecting a role
    await page.fill('input[name="name"]', 'Test User')
    await page.fill('input[name="email"]', `no-role-${Date.now()}@example.com`)
    await page.fill('input[name="password"]', 'TestPassword123!')
    await page.fill('input[name="confirmPassword"]', 'TestPassword123!')
    // Don't select any role
    await page.check('input[id="terms"]')
    await page.click('button[type="submit"]')

    // Should still work (defaults to user role)
    await expect(page.locator('text=Bitte bestätigen Sie Ihre E-Mail-Adresse')).toBeVisible()

    console.log('✅ Role selection validation test passed!')
  })
})






