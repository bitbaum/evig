#!/usr/bin/env node
/*
 * Medusa bootstrapper
 * - Ensures admin user exists (creates via CLI if needed)
 * - Authenticates and creates secret Admin API key
 * - Creates/fetches publishable key
 * - Writes .env.local with MEDUSA_BACKEND_URL, MEDUSA_ADMIN_API_KEY, NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
 */

import { spawn } from 'node:child_process'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const MEDUSA_URL = process.env.MEDUSA_BACKEND_URL || 'http://localhost:9000'
const ADMIN_EMAIL = process.env.MEDUSA_ADMIN_EMAIL || 'admin@revampit.ch'
const ADMIN_PASSWORD = process.env.MEDUSA_ADMIN_PASSWORD || 'Admin123!'

async function waitForMedusa(timeoutMs = 60000) {
  const start = Date.now()
  const url = `${MEDUSA_URL}/health` // v2 exposes /health
  while (Date.now() - start < timeoutMs) {
    try {
      const r = await fetch(url)
      if (r.ok) return true
    } catch {}
    await new Promise((r) => setTimeout(r, 1500))
    process.stdout.write('.')
  }
  throw new Error('Medusa backend did not become healthy in time')
}

function run(cmd, args, options = {}) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(cmd, args, { stdio: 'inherit', ...options })
    child.on('error', reject)
    child.on('exit', (code) => {
      if (code === 0) resolvePromise(undefined)
      else reject(new Error(`${cmd} ${args.join(' ')} exited with code ${code}`))
    })
  })
}

async function ensureAdminUser() {
  // Try logging in first; if it fails, create via CLI
  const token = await login().catch(() => null)
  if (token) return token
  console.log('\n👤 Admin not found or login failed, creating admin via CLI...')
  try {
    await run('npx', ['medusa', 'user', '-e', ADMIN_EMAIL, '-p', ADMIN_PASSWORD], { cwd: resolve(__dirname, '..', 'medusa-backend') })
  } catch (e) {
    const msg = String(e?.message || '')
    if (!/already exists/i.test(msg)) {
      throw e
    }
    console.log('ℹ️ Admin already exists, will attempt login...')
  }
  return await login(true)
}

async function login(isRetry = false) {
  // Try official admin auth route first
  let resp = await fetch(`${MEDUSA_URL}/admin/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  })
  if (resp.ok) {
    const data = await resp.json()
    return data.access_token || data.token
  }

  // Fallback to legacy emailpass route
  resp = await fetch(`${MEDUSA_URL}/auth/user/emailpass`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  })
  if (resp.ok) {
    const data = await resp.json()
    return data.access_token || data.token
  }

  // As a last resort, try common defaults to avoid friction
  if (!isRetry) {
    for (const candidate of ['admin123', 'Admin123!', 'adminAdmin123!']) {
      const r2 = await fetch(`${MEDUSA_URL}/admin/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: ADMIN_EMAIL, password: candidate }),
      })
      if (r2.ok) {
        const data = await r2.json()
        console.log(`⚠️ Logged in using fallback password candidate: ${candidate}`)
        return data.access_token || data.token
      }
    }
  }

  throw new Error(`Admin login failed (${resp.status}) — set MEDUSA_ADMIN_EMAIL and MEDUSA_ADMIN_PASSWORD in .env.local`)
}

async function getOrCreateSecretApiKey(authToken) {
  // List
  const list = await fetch(`${MEDUSA_URL}/admin/api-keys`, {
    headers: { Authorization: `Bearer ${authToken}` },
  })
  const listData = await list.json().catch(() => ({}))
  const existing = (listData.api_keys || []).find((k) => k.type === 'secret')
  if (existing?.token) {
    return existing.token
  }

  // Create
  const resp = await fetch(`${MEDUSA_URL}/admin/api-keys`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({ title: 'revampit-admin-ci', type: 'secret' }),
  })
  if (!resp.ok) throw new Error(`Failed creating admin api key (${resp.status})`)
  const data = await resp.json()
  return data.api_key?.token
}

async function getOrCreatePublishableKey(authToken) {
  // Medusa v2 consolidates API keys under /admin/api-keys
  const list = await fetch(`${MEDUSA_URL}/admin/api-keys`, {
    headers: { Authorization: `Bearer ${authToken}` },
  })
  if (!list.ok) {
    throw new Error(`Failed listing api keys (${list.status})`)
  }
  const listData = await list.json().catch(() => ({}))
  const existing = (listData.api_keys || []).find((k) => k.type === 'publishable')
  // Prefer id; some versions may expose token for publishable as well
  if (existing?.id) return existing.id
  if (existing?.token) return existing.token

  const resp = await fetch(`${MEDUSA_URL}/admin/api-keys`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({ title: 'revampit-web', type: 'publishable' }),
  })
  if (!resp.ok) throw new Error(`Failed creating publishable key (${resp.status})`)
  const data = await resp.json()
  // Response shape: { api_key: { id, type, ... } } in v2
  return data.api_key?.id || data.api_key?.token
}

function upsertEnvLocal(vars) {
  const envPath = resolve(__dirname, '..', '.env.local')
  let content = existsSync(envPath) ? readFileSync(envPath, 'utf8') : ''
  const lines = content.split(/\r?\n/)
  const map = Object.fromEntries(lines.filter(Boolean).map((l) => {
    const i = l.indexOf('=')
    return i > -1 ? [l.slice(0, i), l.slice(i + 1)] : [l, '']
  }))
  for (const [k, v] of Object.entries(vars)) {
    map[k] = String(v)
  }
  const newContent = Object.entries(map)
    .filter(([k]) => k.trim().length)
    .map(([k, v]) => `${k}=${v}`)
    .join('\n') + '\n'
  writeFileSync(envPath, newContent, 'utf8')
}

async function main() {
  console.log(`🔎 Waiting for Medusa at ${MEDUSA_URL} ...`)
  await waitForMedusa()
  console.log('\n✅ Medusa is up')

  console.log('🔐 Ensuring admin user and session...')
  const token = await ensureAdminUser()
  console.log('✅ Admin session ready')

  console.log('🔑 Ensuring Admin API key...')
  const adminKey = await getOrCreateSecretApiKey(token)
  if (!adminKey) throw new Error('No admin API key obtained')
  console.log('✅ Admin API key ready')

  console.log('🪪 Ensuring Publishable key...')
  const publishableKey = await getOrCreatePublishableKey(token)
  if (!publishableKey) throw new Error('No publishable key obtained')
  console.log('✅ Publishable key ready:', publishableKey)

  console.log('📝 Writing .env.local ...')
  upsertEnvLocal({
    MEDUSA_BACKEND_URL: MEDUSA_URL,
    MEDUSA_ADMIN_API_KEY: adminKey,
    NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY: publishableKey,
  })
  console.log('✅ .env.local updated')

  console.log('\n🎉 Bootstrap complete. You can now use the seller listing flow.')
}

main().catch((e) => {
  console.error('\n❌ Bootstrap failed:', e.message)
  process.exit(1)
})
