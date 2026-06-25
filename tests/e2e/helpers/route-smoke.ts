import { expect, type Page } from '@playwright/test'

const NOT_FOUND =
  /\b404\b.*(?:not found|nicht gefunden|could not be found)|(?:Seite nicht gefunden|Page not found|This page could not be found)/i

async function gotoWithAbortRetry(page: Page, path: string) {
  try {
    return await page.goto(path, { waitUntil: 'domcontentloaded' })
  } catch (error) {
    if (!String(error).includes('ERR_ABORTED')) throw error
    await page.waitForLoadState('domcontentloaded')
    return page.goto(path, { waitUntil: 'domcontentloaded' })
  }
}

export async function smokeAuthenticatedRoute(
  page: Page,
  path: string,
  urlPattern?: RegExp,
): Promise<void> {
  let response = await gotoWithAbortRetry(page, path)
  let status = response?.status() ?? 0
  // Some dashboard routes redirect once (locale, role); retry once on abort/0 status.
  if (status === 0 || status >= 500) {
    response = await gotoWithAbortRetry(page, path)
    status = response?.status() ?? 0
  }
  expect(status, `#${path} HTTP ${status}`).toBeLessThan(500)
  expect(status, `#${path} HTTP ${status}`).not.toBe(404)
  await expect(page, `#${path} redirected to login`).not.toHaveURL(/\/auth\/login/)
  const bodyText = await page.locator('body').innerText()
  expect(bodyText, `#${path} looks like 404`).not.toMatch(NOT_FOUND)
  if (urlPattern) {
    expect(page.url(), `#${path} URL`).toMatch(urlPattern)
  }
}

export async function smokePublicRoute(page: Page, path: string): Promise<void> {
  const response = await gotoWithAbortRetry(page, path)
  const status = response?.status() ?? 0
  expect(status, `#${path} HTTP ${status}`).toBeLessThan(500)
  expect(status, `#${path} HTTP ${status}`).not.toBe(404)
  const bodyText = await page.locator('body').innerText()
  expect(bodyText, `#${path} looks like 404`).not.toMatch(NOT_FOUND)
}

/** Non-staff must not remain on /admin/* (redirect to dashboard, login, or error). */
export async function expectAdminRouteBlocked(page: Page, path: string): Promise<void> {
  await page.goto(path, { waitUntil: 'domcontentloaded' })
  const url = page.url()
  const stayedOnAdmin =
    /\/admin(\/|$)/.test(new URL(url).pathname) &&
    !url.includes('/admin?') &&
    !url.includes('error=')
  expect(stayedOnAdmin, `#${path} should block non-admin`).toBeFalsy()
}

export interface DynamicSmokeIds {
  listingId?: string
  itHilfeRequestId?: string
  technicianProfileId?: string
  workshopSlug?: string
  appointmentId?: string
  adminAppointmentId?: string
  blogSlug?: string
  adminUserId?: string
  adminProductId?: string
  adminProtocolId?: string
  adminDecisionId?: string
  adminTaskId?: string
}

function firstApiRow(json: unknown, keys: string[]): Record<string, unknown> | undefined {
  const data = (json as { data?: unknown })?.data
  if (Array.isArray(data) && data.length > 0) {
    return data[0] as Record<string, unknown>
  }
  if (data && typeof data === 'object') {
    for (const key of keys) {
      const nested = (data as Record<string, unknown>)[key]
      if (Array.isArray(nested) && nested.length > 0) {
        return nested[0] as Record<string, unknown>
      }
    }
  }
  return undefined
}

export async function discoverDynamicIds(page: Page): Promise<DynamicSmokeIds> {
  const ids: DynamicSmokeIds = {}

  try {
    const listings = await page.request.get('/api/listings?limit=1&status=active')
    if (listings.ok()) {
      const row = firstApiRow(await listings.json(), ['items', 'listings'])
      if (row?.id) ids.listingId = String(row.id)
    }
  } catch {
    /* optional */
  }

  try {
    const requests = await page.request.get('/api/it-hilfe/requests?limit=1')
    if (requests.ok()) {
      const row = firstApiRow(await requests.json(), ['requests'])
      if (row?.id) ids.itHilfeRequestId = String(row.id)
    }
  } catch {
    /* optional */
  }

  try {
    const tech = await page.request.get('/api/technicians?limit=1')
    if (tech.ok()) {
      const row = firstApiRow(await tech.json(), ['technicians'])
      const id = row?.id ?? row?.profileId
      if (id) ids.technicianProfileId = String(id)
    }
  } catch {
    /* optional */
  }

  try {
    const workshops = await page.request.get('/api/workshops?limit=1&active=true')
    if (workshops.ok()) {
      const row = firstApiRow(await workshops.json(), ['workshops'])
      if (row?.slug) ids.workshopSlug = String(row.slug)
    }
  } catch {
    /* optional */
  }

  try {
    const appts = await page.request.get('/api/appointments?limit=1')
    if (appts.ok()) {
      const row = firstApiRow(await appts.json(), ['appointments'])
      if (row?.id) ids.appointmentId = String(row.id)
    }
  } catch {
    /* optional */
  }

  try {
    const adminAppts = await page.request.get('/api/admin/appointments?limit=1')
    if (adminAppts.ok()) {
      const row = firstApiRow(await adminAppts.json(), ['appointments'])
      if (row?.id) {
        ids.adminAppointmentId = String(row.id)
        ids.appointmentId ??= String(row.id)
      }
    }
  } catch {
    /* optional */
  }

  try {
    const blog = await page.request.get('/api/blog/posts?limit=1')
    if (blog.ok()) {
      const row = firstApiRow(await blog.json(), ['posts'])
      if (row?.slug) ids.blogSlug = String(row.slug)
    }
  } catch {
    /* optional */
  }

  return ids
}
