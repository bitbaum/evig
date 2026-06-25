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

const LOGIN_SUBMIT = /sign in|anmelden|se connecter|accedi|iniciar sesión/i

function stripLocalePrefix(pathname: string): string {
  return pathname.replace(/^\/[a-z]{2}(?=\/|$)/, '') || '/'
}

function pathMatchesCallback(pathname: string, callbackUrl: string): boolean {
  const target = callbackUrl.startsWith('http')
    ? new URL(callbackUrl).pathname
    : callbackUrl
  if (pathname === target || pathname.endsWith(target)) return true
  return stripLocalePrefix(pathname) === stripLocalePrefix(target)
}

/** Log in via the credentials form (same flow as auth-smoke / timecards e2e). */
export async function loginWithCredentials(
  page: Page,
  callbackUrl: string,
  email = DEFAULT_EMAIL,
  password = DEFAULT_PASSWORD,
) {
  await page.context().clearCookies()
  const localePrefix = callbackUrl.match(/^\/([a-z]{2})\//)?.[1] || 'de'
  await page.goto(
    `/${localePrefix}/auth/login?callbackUrl=${encodeURIComponent(callbackUrl)}`,
  )
  await page.waitForLoadState('domcontentloaded')
  await page.locator('#email').fill(email)
  await page.locator('#password').fill(password)
  await page.getByRole('button', { name: LOGIN_SUBMIT }).click()
  await page.waitForURL(
    url => pathMatchesCallback(url.pathname, callbackUrl),
    { timeout: 60_000 },
  )
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
  await page.waitForLoadState('domcontentloaded')
  if (page.url().includes('/auth/login')) {
    await page.locator('#email').fill(email)
    await page.locator('#password').fill(password)
    await page.getByRole('button', { name: LOGIN_SUBMIT }).click()
    await page.waitForURL(
      url => pathMatchesCallback(url.pathname, callbackUrl),
      { timeout: 60_000 },
    )
  }
}
