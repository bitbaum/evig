import { test, expect } from '@playwright/test'
import {
  loginWithCredentials,
  hasTechnicianTestCredentials,
  TECHNICIAN_TEST_EMAIL,
  TECHNICIAN_TEST_PASSWORD,
} from './helpers/auth'
import {
  acceptItHilfeOffer,
  completeItHilfeRequest,
  confirmItHilfeReview,
  createItHilfeRequest,
  fetchItHilfeRequest,
  submitItHilfeOffer,
} from './helpers/it-hilfe'

test.describe('IT-Hilfe hub (/it-hilfe)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/it-hilfe')
  })

  test('shows hub with three journey paths', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/Computer reparieren|IT-Probleme/)
    await expect(page.getByRole('link', { name: /Anfrage starten/i })).toHaveAttribute('href', /\/it-hilfe\/create/)
    await expect(page.getByRole('link', { name: /Techniker finden/i })).toHaveAttribute('href', /\/it-hilfe\/techniker/)
    await expect(page.getByRole('link', { name: /Anfragen ansehen/i })).toHaveAttribute('href', /\/it-hilfe\/anfragen/)
  })

  test('legacy /techniker redirects to /it-hilfe/techniker', async ({ page }) => {
    await page.goto('/techniker')
    await expect(page).toHaveURL(/\/it-hilfe\/techniker/)
  })
})

test.describe('IT-Hilfe browse (/it-hilfe/anfragen)', () => {
  test.setTimeout(120000)

  test.beforeEach(async ({ page }) => {
    await page.goto('/it-hilfe/anfragen')
  })

  test('shows browse header and request count', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Offene Anfragen' })).toBeVisible()
    await expect(page.getByText(/\d+ Anfragen?/).first()).toBeVisible({ timeout: 15000 })
  })

  test('has search and sort controls', async ({ page }) => {
    await expect(page.getByPlaceholder(/Laptop kaputt|WLAN Problem/i)).toBeVisible()
    await expect(page.getByLabel('Sortierung')).toBeVisible()
  })

  test('should show and hide filters', async ({ page }) => {
    const filterButton = page.getByRole('button', { name: 'Filter' })
    await filterButton.click()
    await expect(page.locator('#filter-category')).toBeVisible()
    await filterButton.click()
    await expect(page.locator('#filter-category')).not.toBeVisible()
  })

  test('should filter by category', async ({ page }) => {
    await page.getByRole('button', { name: 'Filter' }).click()
    await page.locator('#filter-category').selectOption('laptop')
    await page.waitForLoadState('networkidle')
  })

  test('should sort requests', async ({ page }) => {
    const sortSelect = page.getByLabel('Sortierung')
    await sortSelect.selectOption('urgent')
    await page.waitForLoadState('networkidle')
    await sortSelect.selectOption('budget_high')
    await page.waitForLoadState('networkidle')
  })

  test('should clear filters when active', async ({ page }) => {
    await page.getByRole('button', { name: 'Filter' }).click()
    await page.locator('#filter-category').selectOption('laptop')
    await page.waitForLoadState('networkidle')

    const clearButton = page.getByRole('button', { name: 'Filter zurücksetzen' })
    if (await clearButton.isVisible()) {
      await clearButton.click()
      await expect(page.locator('#filter-category')).toHaveValue('')
    }
  })

  test('should show loading skeletons', async ({ page }) => {
    await page.route('**/api/it-hilfe/requests*', async route => {
      await new Promise(r => setTimeout(r, 1500))
      await route.continue()
    })
    await page.reload()
    await expect(page.locator('.animate-pulse').first()).toBeVisible({ timeout: 5000 })
  })

  test('should show error state on network failure', async ({ page }) => {
    await page.route('**/api/it-hilfe/requests*', route => route.abort('failed'))
    await page.reload()
    await expect(page.getByRole('heading', { name: /Fehler/i })).toBeVisible({ timeout: 10000 })
    await expect(page.getByRole('button', { name: 'Erneut versuchen' })).toBeVisible()
  })
})

test.describe('IT-Hilfe create page', () => {
  test('loads create form for guests', async ({ page }) => {
    await page.goto('/it-hilfe/create')
    await expect(page.getByRole('heading', { name: 'Reparaturanfrage erstellen' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Anfrage erstellen' })).toBeVisible()
    await expect(page.getByLabel('E-Mail-Adresse')).toBeVisible()
  })

  test('prefers technician query param on create URL', async ({ page }) => {
    await page.goto('/it-hilfe/create?technician=00000000-0000-0000-0000-000000000001')
    await expect(page).toHaveURL(/technician=/)
    // Invalid UUID profile — banner may be absent; page must not 404
    await expect(page.getByRole('button', { name: 'Anfrage erstellen' })).toBeVisible()
  })
})

test.describe('IT-Hilfe technician directory', () => {
  test('techniker list loads', async ({ page }) => {
    await page.goto('/it-hilfe/techniker')
    await expect(page.getByRole('heading').first()).toBeVisible()
    await page.waitForLoadState('networkidle')
  })
})

test.describe('IT-Hilfe full journey (API + UI)', () => {
  test.setTimeout(180000)

  test.skip(
    !hasTechnicianTestCredentials(),
    'Set AUTH_TEST_TECHNICIAN_EMAIL + AUTH_TEST_TECHNICIAN_PASSWORD (different from requester)',
  )

  test('create → offer → accept → complete → review', async ({ page }) => {
    // 1. Requester creates request
    await loginWithCredentials(page, '/dashboard')
    const { requestId } = await createItHilfeRequest(page.request)

    // 2. Technician submits offer
    await loginWithCredentials(
      page,
      `/it-hilfe/${requestId}`,
      TECHNICIAN_TEST_EMAIL,
      TECHNICIAN_TEST_PASSWORD,
    )
    const { offerId } = await submitItHilfeOffer(page.request, requestId)

    // Technician sees offer form entry on detail (authenticated non-owner)
    await page.goto(`/it-hilfe/${requestId}`)
    await expect(page.getByRole('button', { name: 'Angebot abgeben' }).or(
      page.getByText(/Angebot abgegeben|bereits ein Angebot/i),
    )).toBeVisible({ timeout: 15000 })

    // 3. Requester accepts offer
    await loginWithCredentials(page, `/it-hilfe/${requestId}`)
    await acceptItHilfeOffer(page.request, requestId, offerId)
    let status = (await fetchItHilfeRequest(page.request, requestId)).status
    expect(status).toBe('matched')
    await page.reload()
    await expect(page.getByText(/vergeben|matched|Techniker/i).first()).toBeVisible({ timeout: 15000 })

    // 4. Technician marks complete
    await loginWithCredentials(
      page,
      `/it-hilfe/${requestId}`,
      TECHNICIAN_TEST_EMAIL,
      TECHNICIAN_TEST_PASSWORD,
    )
    await completeItHilfeRequest(page.request, requestId)
    status = (await fetchItHilfeRequest(page.request, requestId)).status
    expect(status).toBe('completed')

    // 5. Requester confirms review
    await loginWithCredentials(page, `/it-hilfe/${requestId}`)
    await confirmItHilfeReview(page.request, requestId)
    const final = await fetchItHilfeRequest(page.request, requestId)
    expect(final.status).toBe('completed')
    expect(final.reviewedAt).toBeTruthy()
    await page.reload()
    await expect(page.getByText(/bewertet|reviewed|Danke/i).first()).toBeVisible({ timeout: 15000 })
  })
})
