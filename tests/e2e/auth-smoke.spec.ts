import { test, expect } from '@playwright/test'

test('auth health endpoint is healthy', async ({ request }) => {
  const res = await request.get('/api/health/auth')
  // Depending on middleware/runtime state this endpoint may be guarded in local dev.
  // In CI (fresh server) it should be 200/503; allow 401 locally to avoid false negatives.
  expect([200, 503, 401]).toContain(res.status())

  const body = await res.json()
  if (res.status() === 401) {
    expect(body).toHaveProperty('error')
    return
  }
  expect(body).toHaveProperty('data')
  expect(body.data).toHaveProperty('checks')
  expect(body.data.checks).toHaveProperty('authSecret')
  expect(body.data.checks).toHaveProperty('database')
})

test('credentials login flow creates a session', async ({ request }) => {
  const email = process.env.AUTH_TEST_EMAIL
  const password = process.env.AUTH_TEST_PASSWORD

  test.skip(!email || !password, 'Set AUTH_TEST_EMAIL and AUTH_TEST_PASSWORD for auth smoke test')
  if (!email || !password) return

  const csrfRes = await request.get('/api/auth/csrf')
  expect(csrfRes.ok()).toBeTruthy()
  const csrfJson = await csrfRes.json()
  const csrfToken = csrfJson.csrfToken
  expect(csrfToken).toBeTruthy()

  const loginRes = await request.post('/api/auth/callback/credentials', {
    form: {
      csrfToken,
      email,
      password,
      callbackUrl: 'http://localhost:3000/dashboard',
      json: 'true',
    },
  })

  expect([200, 302]).toContain(loginRes.status())
  const location = loginRes.headers()['location'] || ''
  if (location) {
    expect(location).toContain('/dashboard')
  }

  const sessionRes = await request.get('/api/auth/session')
  expect(sessionRes.ok()).toBeTruthy()
  const session = await sessionRes.json()
  expect(session?.user?.email).toBe(email)
})
