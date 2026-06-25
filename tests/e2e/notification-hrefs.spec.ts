import { test, expect } from '@playwright/test'
import { RELATED_TYPE_HREFS, RELATED_TYPES } from '../../src/config/notifications'

/** Dummy UUID appended to every notification deep-link base */
const DUMMY_ID = '00000000-0000-0000-0000-000000000001'

function buildNotificationHref(base: string): string {
  return `${base}${DUMMY_ID}`
}

/** Routes that exist but require auth — redirect or 401 is OK; bare 404 is not. */
const ACCEPTABLE_STATUSES = new Set([200, 301, 302, 307, 308, 401, 403])

test.describe('Notification bell deep links (RELATED_TYPE_HREFS)', () => {
  for (const [type, base] of Object.entries(RELATED_TYPE_HREFS)) {
    test(`${type} → ${base} resolves without HTTP 404`, async ({ request }) => {
      const href = buildNotificationHref(base)
      const response = await request.get(href, { maxRedirects: 0 })
      const status = response.status()

      expect(
        status,
        `${href} returned ${status} — notification deep link is broken`,
      ).not.toBe(404)
      expect(
        ACCEPTABLE_STATUSES.has(status),
        `${href} returned unexpected ${status}`,
      ).toBe(true)
    })
  }

  test('appointment href uses SSOT service-appointments route', () => {
    expect(RELATED_TYPE_HREFS[RELATED_TYPES.APPOINTMENT]).toBe('/dashboard/appointments/')
  })
})
