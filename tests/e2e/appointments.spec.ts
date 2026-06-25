import { test, expect } from '@playwright/test'
import { loginWithCredentials } from './helpers/auth'

test.describe('Service appointments dashboard', () => {
  test.setTimeout(120000)

  test('lists appointments for authenticated users', async ({ page }) => {
    await loginWithCredentials(page, '/dashboard/appointments')

    await expect(page.getByRole('heading', { name: 'Meine Termine' })).toBeVisible()
    await expect(
      page.getByText(/Service-Termin|Noch keine Termine|Terminanfrage/i).first(),
    ).toBeVisible({ timeout: 15000 })
  })

  test('legacy bookings URL redirects to appointments', async ({ page }) => {
    await loginWithCredentials(page, '/dashboard/appointments')
    await page.goto('/dashboard/bookings')
    await expect(page).toHaveURL(/\/dashboard\/appointments/)
  })
})

test.describe('Admin service appointments', () => {
  test.setTimeout(120000)

  test('admin appointments list loads', async ({ page }) => {
    await loginWithCredentials(page, '/admin/appointments')
    await expect(page.getByRole('heading', { name: /Termine|Service-Termine/i })).toBeVisible()
  })
})
