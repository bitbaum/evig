import { test, expect } from '@playwright/test'

test.describe('Admin timecards', () => {
  test.setTimeout(120000)

  test('renders the month-first flow and keeps controls clickable', async ({ page }) => {
    await page.context().clearCookies()

    const email = process.env.AUTH_TEST_EMAIL || 'admin@revampit.ch'
    const password = process.env.AUTH_TEST_PASSWORD || 'Admin123!'

    await page.goto('/auth/login?callbackUrl=/admin/timecards')
    await expect(page.getByRole('button', { name: 'Anmelden' })).toBeEnabled()
    await page.waitForLoadState('networkidle')
    await page.locator('#email').fill(email)
    await page.locator('#password').fill(password)
    await expect(page.locator('#email')).toHaveValue(email)
    await expect(page.locator('#password')).toHaveValue(password)
    await page.getByRole('button', { name: 'Anmelden' }).click()

    await page.waitForURL(url => url.pathname === '/admin/timecards')

    await expect(page.getByRole('heading', { name: 'Zeitkarten' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Monat' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Woche' })).toBeVisible()
    const saveButton = page.getByRole('button', { name: 'Entwurf speichern' })
    await expect(saveButton).toBeEnabled({ timeout: 15000 })
    await expect(page.getByRole('button', { name: 'Bestätigen und einreichen' })).toBeVisible()

    await page.getByRole('button', { name: 'Woche' }).click()
    await expect(page.getByRole('heading', { name: 'Diese Woche ist vorbereitet' })).toBeVisible()
    await expect(saveButton).toBeEnabled({ timeout: 15000 })

    await page.getByRole('button', { name: 'Monat' }).click()
    await expect(page.getByRole('heading', { name: /ist vorbereitet/ })).toBeVisible()

    await expect(page.getByText('Schedule', { exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Vorlage zurücksetzen' })).toBeVisible()

    const missingScheduleCopy = page.getByText('Dein offizieller Schedule fehlt noch.')
    if (await missingScheduleCopy.isVisible()) {
      await expect(page.getByRole('link', { name: 'Team-Profil öffnen' })).toBeVisible()
    }
  })
})
