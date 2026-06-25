import { test, expect } from '@playwright/test'
import { loginWithCredentials } from './helpers/auth'

test.describe('Payment return banners', () => {
  test.setTimeout(120000)

  test('shows success banner on appointments list and strips query param', async ({ page }) => {
    await loginWithCredentials(page, '/dashboard/appointments')
    await page.goto('/dashboard/appointments?payment=success')

    await expect(page.getByText(/Zahlung erfolgreich/i)).toBeVisible({ timeout: 15000 })
    await expect(page).toHaveURL(/\/dashboard\/appointments(?!\?)/)
  })

  test('shows cancelled banner on marketplace cart', async ({ page }) => {
    await page.goto('/marketplace/cart?error=payment_cancelled')
    await expect(page.getByText(/Zahlung abgebrochen|abgebrochen/i)).toBeVisible({ timeout: 15000 })
  })
})
