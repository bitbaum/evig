/**
 * Staff intake pipeline journey — create → checklist gate → publish.
 *
 * Env: AUTH_TEST_ADMIN_* (intake admin section) + AUTH_TEST_SECOND_ADMIN_*
 * (final QA must be signed off by a second person — Vier-Augen-Prinzip).
 * Optional dual-persona: AUTH_TEST_USER_* to verify non-admin blocked from /admin/intake.
 * Run: npm run test:e2e:intake:journey
 */

import { test, expect } from '@playwright/test'
import {
  ADMIN_TEST_EMAIL,
  ADMIN_TEST_PASSWORD,
  SECOND_ADMIN_TEST_EMAIL,
  SECOND_ADMIN_TEST_PASSWORD,
  USER_TEST_EMAIL,
  USER_TEST_PASSWORD,
  hasDualPersonaCredentials,
  loginWithCredentials,
} from './helpers/auth'
import { expectAdminRouteBlocked } from './helpers/route-smoke'
import {
  buildE2EIntakeProductName,
  completeRequiredIntakeChecklist,
  fetchIntakeDetail,
  publishIntakeItem,
  tryPublishIntakeItem,
  trySetIntakeChecklistVerdict,
} from './helpers/intake'
import { INTAKE_TIERS } from '@/config/intake-checklist'
import { INTAKE_STATUS } from '@/config/intake-status'

test.describe('Intake pipeline staff journey', () => {
  test.setTimeout(120000)

  test.skip(!ADMIN_TEST_PASSWORD, 'Set AUTH_TEST_ADMIN_PASSWORD')
  test.skip(!SECOND_ADMIN_TEST_PASSWORD, 'Set AUTH_TEST_SECOND_ADMIN_PASSWORD (Vier-Augen final QA)')

  test('admin creates refurbish device → completes checklist → publishes (API + UI)', async ({
    page,
    browser,
  }) => {
    const productName = buildE2EIntakeProductName()

    await loginWithCredentials(page, '/admin/intake', ADMIN_TEST_EMAIL, ADMIN_TEST_PASSWORD)
    await expect(page.getByRole('heading', { name: 'Geräte-Eingang' })).toBeVisible({
      timeout: 15000,
    })
    await page.locator('[data-intake-ready="true"]').waitFor({ timeout: 15000 })

    // One navigation home: the advanced product editor is reachable from the
    // workflow, but it no longer competes as a second sidebar destination.
    await expect(page.getByRole('link', { name: 'Geräte-Eingang', exact: true })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Produkt aufnehmen', exact: true })).toHaveCount(0)

    // Keyboard-first fast lane: manufacturer → model → Enter.
    await page.getByRole('link', { name: 'Neues Gerät', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Gerät sofort aufnehmen' })).toBeVisible()
    await page.getByLabel('Hersteller').fill('RevampIT')
    await page.getByLabel('Modell / Produkt').fill(productName)
    const createResponsePromise = page.waitForResponse(response =>
      response.url().endsWith('/api/admin/intake') && response.request().method() === 'POST',
    )
    const captureStartedAt = Date.now()
    await page.getByLabel('Modell / Produkt').press('Enter')
    const createResponse = await createResponsePromise
    expect(createResponse.ok()).toBe(true)
    expect(Date.now() - captureStartedAt).toBeLessThan(5000)
    const createBody = await createResponse.json() as {
      data: { inventory_id: string; item_uuid: string }
    }
    const created = createBody.data
    await expect(page.getByText(new RegExp(`${created.item_uuid} aufgenommen`))).toBeVisible()

    // QR label is generated locally (data URL), not fetched from a public QR service.
    const labelPage = await page.context().newPage()
    try {
      await labelPage.goto(`/admin/intake/${created.inventory_id}/label`)
      const qr = labelPage.getByAltText(`QR-Code zu ${created.item_uuid}`)
      await expect(qr).toBeVisible({ timeout: 15000 })
      await expect(qr).toHaveAttribute('src', /^data:image\/png;base64,/)
    } finally {
      await labelPage.close()
    }

    await page.getByRole('button', { name: 'Pipeline ansehen' }).click()
    // Mobile and desktop render dedicated card variants; desktop kanban is
    // later in DOM order at this viewport.
    await expect(page.getByText(productName, { exact: false }).last()).toBeVisible({ timeout: 15000 })
    await expect(page.getByText('In Prüfung', { exact: true }).last()).toBeVisible()

    let detail = await fetchIntakeDetail(page.request, created.inventory_id)
    expect(detail.checklist_complete).toBe(false)
    expect(detail.marketplace_status).not.toBe(INTAKE_STATUS.PUBLISHED)

    const blocked = await tryPublishIntakeItem(page.request, created.inventory_id)
    expect(blocked.ok).toBe(false)
    expect(blocked.status).toBe(400)

    // A fail verdict without a reason is rejected (schema gate).
    const failWithoutNote = await trySetIntakeChecklistVerdict(
      page.request,
      created.inventory_id,
      'visual_inspection',
      'fail',
    )
    expect(failWithoutNote.ok).toBe(false)
    expect(failWithoutNote.status).toBe(400)

    // Vier-Augen-Prinzip: the sole worker cannot sign off final QA without an
    // explicit documented override — neither before any work is done nor
    // after doing everything alone. (A second person, or an explicit audited
    // solo-shift override, unblocks.)
    const soloQa = await trySetIntakeChecklistVerdict(
      page.request,
      created.inventory_id,
      'final_qa',
    )
    expect(soloQa.ok).toBe(false)
    expect(soloQa.status).toBe(400)

    // Second staff account signs off the second-person items (final QA).
    const secondContext = await browser.newContext()
    try {
      const secondPage = await secondContext.newPage()
      await loginWithCredentials(
        secondPage,
        '/admin/intake',
        SECOND_ADMIN_TEST_EMAIL,
        SECOND_ADMIN_TEST_PASSWORD,
      )

      await completeRequiredIntakeChecklist(
        page.request,
        created.inventory_id,
        INTAKE_TIERS.REFURBISH,
        undefined,
        secondPage.request,
      )
    } finally {
      await secondContext.close()
    }

    detail = await fetchIntakeDetail(page.request, created.inventory_id)
    expect(detail.checklist_complete).toBe(true)

    await page.goto(`/admin/intake?detail=${created.inventory_id}`)
    await expect(page.getByRole('heading', { name: new RegExp(productName) })).toBeVisible({
      timeout: 15000,
    })
    await expect(page.getByText(/Fortschritt:/)).toBeVisible({ timeout: 15000 })
    await expect(page.getByRole('heading', { name: 'Im Shop veröffentlichen' })).toBeVisible({
      timeout: 15000,
    })

    await publishIntakeItem(page.request, created.inventory_id, {
      price_chf: 1,
      title: productName,
      description: 'E2E intake journey — safe to archive',
    })

    detail = await fetchIntakeDetail(page.request, created.inventory_id)
    expect(detail.marketplace_status).toBe(INTAKE_STATUS.PUBLISHED)

    await page.goto(`/admin/intake?detail=${created.inventory_id}`)
    await expect(page.getByText('Dieses Gerät ist im Shop veröffentlicht')).toBeVisible({
      timeout: 15000,
    })

    // Workshop-phone regression: the mobile card/capture layouts must fit a
    // 320px viewport without reintroducing the old horizontally-scrolling table.
    await page.setViewportSize({ width: 320, height: 720 })
    await page.goto('/admin/intake')
    await expect(page.getByText(productName, { exact: false }).first()).toBeVisible({ timeout: 15000 })
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true)

    await page.goto('/admin/intake/capture')
    await expect(page.getByRole('heading', { name: 'Gerät sofort aufnehmen' })).toBeVisible({ timeout: 15000 })
    await expect(page.getByLabel('Hersteller')).toBeVisible()
    await expect(page.getByLabel('Modell / Produkt')).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true)

    if (hasDualPersonaCredentials()) {
      await loginWithCredentials(page, '/dashboard', USER_TEST_EMAIL, USER_TEST_PASSWORD)
      await expectAdminRouteBlocked(page, '/admin/intake')
    }
  })
})
