import { test, expect } from '@playwright/test'
import { loginWithCredentials } from './helpers/auth'

test.describe('Admin timecards', () => {
  test.setTimeout(120000)

  test('renders the month-first flow and keeps controls clickable', async ({ page }) => {
    await loginWithCredentials(page, '/admin/zeiterfassung')

    await expect(page.getByRole('heading', { name: 'Zeitkarten' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Monat' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Woche' })).toBeVisible()
    const saveButton = page.getByRole('button', { name: 'Speichern' })
    await expect(saveButton).toBeEnabled({ timeout: 15000 })
    await expect(page.getByRole('button', { name: 'Zur Prüfung einreichen' })).toBeVisible()

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
