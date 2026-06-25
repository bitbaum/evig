import { test, expect } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

const DASHBOARD_TIMECARDS = '/dashboard/timecards'
const AUTH_FILE = path.join(__dirname, '.auth/user.json')

test.describe('Dashboard timecards — submit flow', () => {
  test.setTimeout(120000)

  test.beforeEach(async ({ page }) => {
    const hasSession =
      !!process.env.AUTH_TEST_EMAIL ||
      !!process.env.PLAYWRIGHT_STORAGE_STATE ||
      fs.existsSync(AUTH_FILE)
    test.skip(!hasSession, 'Set AUTH_TEST_EMAIL + AUTH_TEST_PASSWORD, or run: npm run test:e2e:auth')
  })

  test('fills the month and submits for review', async ({ page }) => {
    await page.goto(DASHBOARD_TIMECARDS)
    test.skip(page.url().includes('/auth/login'), 'Session expired — re-run npm run test:e2e:auth')

    await expect(page.getByRole('heading', { name: 'Meine Zeiterfassung' })).toBeVisible()
    await expect(page.getByRole('heading', { name: /2026|2025/ })).toBeVisible({ timeout: 20000 })

    const submitButton = page.getByRole('button', { name: /Zur Prüfung einreichen|Erneut einreichen/ })
    await expect(submitButton).toBeVisible({ timeout: 15000 })

    if (!(await submitButton.isEnabled())) {
      await page.getByRole('button', { name: 'Monat aus Plan füllen' }).click()
      await expect(submitButton).toBeEnabled({ timeout: 15000 })
    }

    await submitButton.click()

    await expect(page.getByText(/Freigabe-Team wird benachrichtigt|Zur Prüfung gesendet/i)).toBeVisible({
      timeout: 20000,
    })
    await expect(page.getByText('Eingereicht').first()).toBeVisible()
    await expect(page.getByRole('button', { name: 'Erneut einreichen' })).toBeVisible()
  })
})
