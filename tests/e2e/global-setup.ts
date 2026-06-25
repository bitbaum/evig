/**
 * Playwright global setup — persist a logged-in session for local E2E.
 *
 * Set AUTH_TEST_EMAIL + AUTH_TEST_PASSWORD (your Revamp-IT account),
 * then run: npm run test:e2e:auth
 *
 * Or rely on this running automatically before E2E when those env vars are set.
 */

import { chromium, type FullConfig } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

const AUTH_DIR = path.join(__dirname, '.auth')
const AUTH_FILE = path.join(AUTH_DIR, 'user.json')

export default async function globalSetup(config: FullConfig) {
  const email = process.env.AUTH_TEST_EMAIL
  const password = process.env.AUTH_TEST_PASSWORD

  if (!email || !password) {
    // No credentials — reuse existing saved session if present.
    if (fs.existsSync(AUTH_FILE)) return
    return
  }

  const baseURL =
    (config.projects[0]?.use?.baseURL as string | undefined) ||
    process.env.PLAYWRIGHT_BASE_URL ||
    'http://localhost:3001'

  fs.mkdirSync(AUTH_DIR, { recursive: true })

  const browser = await chromium.launch()
  const context = await browser.newContext({ baseURL })
  const page = await context.newPage()

  const csrfRes = await page.request.get('/api/auth/csrf')
  if (!csrfRes.ok()) {
    await browser.close()
    throw new Error(`CSRF fetch failed: ${csrfRes.status()}`)
  }
  const { csrfToken } = await csrfRes.json()

  const loginRes = await page.request.post('/api/auth/callback/credentials', {
    form: {
      csrfToken,
      email,
      password,
      callbackUrl: `${baseURL}/dashboard`,
      json: 'true',
    },
  })

  if (![200, 302].includes(loginRes.status())) {
    await browser.close()
    throw new Error(`Login failed: ${loginRes.status()}`)
  }

  const sessionRes = await page.request.get('/api/auth/session')
  const session = await sessionRes.json()
  if (session?.user?.email !== email) {
    await browser.close()
    throw new Error('Login succeeded but session email mismatch')
  }

  await context.storageState({ path: AUTH_FILE })
  await browser.close()
}
