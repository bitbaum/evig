import { test, expect } from '@playwright/test'

test.describe('Repairer Functionality', () => {
  test.setTimeout(120000)

  test.beforeEach(async ({ page }) => {
    // Clear any existing session
    await page.context().clearCookies()
  })

  test('Repairer can register and access repairer dashboard', async ({ page }) => {
    console.log('🔧 Testing repairer registration and dashboard access...')

    await page.goto('/auth/register')

    const testEmail = `repairer-${Date.now()}@example.com`

    // Fill registration form
    await page.fill('input[name="name"]', 'Test Repairer')
    await page.fill('input[name="email"]', testEmail)
    await page.fill('input[name="password"]', 'TestPassword123!')
    await page.fill('input[name="confirmPassword"]', 'TestPassword123!')

    // Select repairer role
    await page.click('text=Reparateur')
    await expect(page.locator('text=Ausgezeichnet! Ihre Reparaturkenntnisse werden der Community helfen')).toBeVisible()

    // Accept terms
    await page.check('input[id="terms"]')

    // Submit form
    await page.click('button[type="submit"]')

    // Wait for success message
    await expect(page.locator('text=Bitte bestätigen Sie Ihre E-Mail-Adresse')).toBeVisible()

    // Skip email verification - go to login
    await page.goto('/auth/login')
    await page.fill('input[name="email"]', testEmail)
    await page.fill('input[name="password"]', 'TestPassword123!')
    await page.click('button[type="submit"]')

    // Check repairer dashboard access
    await page.waitForURL('/dashboard')
    await expect(page.locator('text=Repairer Dashboard')).toBeVisible()
    await expect(page.locator('text=Buchungen verwalten')).toBeVisible()
    await expect(page.locator('text=Dienste bearbeiten')).toBeVisible()

    console.log('✅ Repairer registration and dashboard test passed!')
  })

  test('Repairer can manage services', async ({ page }) => {
    console.log('🛠️ Testing repairer service management...')

    // Quick setup: Register and login as repairer
    await page.goto('/auth/register')
    const testEmail = `service-repairer-${Date.now()}@example.com`

    await page.fill('input[name="name"]', 'Service Repairer')
    await page.fill('input[name="email"]', testEmail)
    await page.fill('input[name="password"]', 'TestPassword123!')
    await page.fill('input[name="confirmPassword"]', 'TestPassword123!')
    await page.click('text=Reparateur')
    await page.check('input[id="terms"]')
    await page.click('button[type="submit"]')

    // Go to repairer services page
    await page.goto('/dashboard/repairer/services')

    // Check services page
    await expect(page.locator('h1')).toContainText('Meine Dienstleistungen')
    await expect(page.locator('text=Neue Dienstleistung')).toBeVisible()

    // Check existing services (mock data)
    await expect(page.locator('text=Laptop Reparaturen')).toBeVisible()
    await expect(page.locator('text=Smartphone Reparaturen')).toBeVisible()

    console.log('✅ Repairer service management test passed!')
  })

  test('Repairer can manage bookings', async ({ page }) => {
    console.log('📅 Testing repairer booking management...')

    // Quick setup: Register and login as repairer
    await page.goto('/auth/register')
    const testEmail = `booking-repairer-${Date.now()}@example.com`

    await page.fill('input[name="name"]', 'Booking Repairer')
    await page.fill('input[name="email"]', testEmail)
    await page.fill('input[name="password"]', 'TestPassword123!')
    await page.fill('input[name="confirmPassword"]', 'TestPassword123!')
    await page.click('text=Reparateur')
    await page.check('input[id="terms"]')
    await page.click('button[type="submit"]')

    // Go to repairer bookings page
    await page.goto('/dashboard/repairer/bookings')

    // Check bookings page
    await expect(page.locator('h1')).toContainText('Reparatur-Buchungen')
    await expect(page.locator('text=Ausstehende')).toBeVisible()
    await expect(page.locator('text=Bestätigte')).toBeVisible()
    await expect(page.locator('text=In Bearbeitung')).toBeVisible()

    // Check mock booking data
    await expect(page.locator('text=Laptop Bildschirm reparieren')).toBeVisible()
    await expect(page.locator('text=Smartphone Akku ersetzen')).toBeVisible()

    // Check booking status indicators
    await expect(page.locator('text=Ausstehend')).toBeVisible()
    await expect(page.locator('text=Bestätigt')).toBeVisible()
    await expect(page.locator('text=Abgeschlossen')).toBeVisible()

    console.log('✅ Repairer booking management test passed!')
  })

  test('Repairer profile and availability management', async ({ page }) => {
    console.log('👤 Testing repairer profile management...')

    // Quick setup: Register and login as repairer
    await page.goto('/auth/register')
    const testEmail = `profile-repairer-${Date.now()}@example.com`

    await page.fill('input[name="name"]', 'Profile Repairer')
    await page.fill('input[name="email"]', testEmail)
    await page.fill('input[name="password"]', 'TestPassword123!')
    await page.fill('input[name="confirmPassword"]', 'TestPassword123!')
    await page.click('text=Reparateur')
    await page.check('input[id="terms"]')
    await page.click('button[type="submit"]')

    // Go to repairer dashboard
    await page.goto('/dashboard/repairer')

    // Check profile management link
    await expect(page.locator('text=Profil bearbeiten')).toBeVisible()

    // Check service statistics
    await expect(page.locator('text=Gesamt Buchungen')).toBeVisible()
    await expect(page.locator('text=Durchschnittliche Bewertung')).toBeVisible()
    await expect(page.locator('text=Monatlicher Umsatz')).toBeVisible()

    console.log('✅ Repairer profile management test passed!')
  })
})






