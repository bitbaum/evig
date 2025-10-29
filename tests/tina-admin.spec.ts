import { test, expect } from '@playwright/test'

test.describe('Tina Admin UI', () => {
  test('loads /admin and /admin/login', async ({ page }) => {
    // Admin root
    await page.goto('/admin')
    await expect(page).toHaveTitle(/TinaCMS/i)

    // Admin login route (SPA subpath)
    await page.goto('/admin/login')
    await expect(page).toHaveTitle(/TinaCMS/i)
    // Basic sanity: root container exists
    await expect(page.locator('#root')).toBeVisible()
  })
})

