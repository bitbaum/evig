import type { Page } from '@playwright/test'

const DEFAULT_EMAIL = process.env.AUTH_TEST_EMAIL || 'admin@revampit.ch'
const DEFAULT_PASSWORD = process.env.AUTH_TEST_PASSWORD || 'Admin123!'

/** Second account for IT-Hilfe offer/complete steps (must differ from requester). */
export const TECHNICIAN_TEST_EMAIL = process.env.AUTH_TEST_TECHNICIAN_EMAIL || ''
export const TECHNICIAN_TEST_PASSWORD = process.env.AUTH_TEST_TECHNICIAN_PASSWORD || ''

export function hasTechnicianTestCredentials(): boolean {
  return Boolean(
    TECHNICIAN_TEST_EMAIL &&
    TECHNICIAN_TEST_PASSWORD &&
    TECHNICIAN_TEST_EMAIL.toLowerCase() !== DEFAULT_EMAIL.toLowerCase(),
  )
}

/** Session file from `npx playwright codegen --save-storage=tests/e2e/.auth/user.json` */
export const SAVED_SESSION_PATH = 'tests/e2e/.auth/user.json'

/** Log in via the credentials form (same flow as auth-smoke / timecards e2e). */
export async function loginWithCredentials(
  page: Page,
  callbackUrl: string,
  email = DEFAULT_EMAIL,
  password = DEFAULT_PASSWORD,
) {
  await page.context().clearCookies()
  await page.goto(`/auth/login?callbackUrl=${encodeURIComponent(callbackUrl)}`)
  await page.waitForLoadState('networkidle')
  await page.locator('#email').fill(email)
  await page.locator('#password').fill(password)
  await page.getByRole('button', { name: 'Anmelden' }).click()
  await page.waitForURL(url => {
    const path = url.pathname
    return path === callbackUrl || path.startsWith(callbackUrl)
  })
}

/**
 * Open a protected route; log in only when redirected to /auth/login.
 * Skips cookie clear so a saved storageState or prior context login is reused.
 */
export async function ensureAuthenticated(
  page: Page,
  callbackUrl: string,
  email = DEFAULT_EMAIL,
  password = DEFAULT_PASSWORD,
) {
  await page.goto(callbackUrl)
  await page.waitForLoadState('networkidle')
  if (page.url().includes('/auth/login')) {
    await page.locator('#email').fill(email)
    await page.locator('#password').fill(password)
    await page.getByRole('button', { name: 'Anmelden' }).click()
    await page.waitForURL(url => {
      const path = url.pathname
      return path === callbackUrl || path.startsWith(callbackUrl)
    })
  }
}
