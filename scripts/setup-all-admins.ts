import fs from 'fs'
import path from 'path'
import { Client } from 'pg'
import bcrypt from 'bcryptjs'

function loadEnvFile(filePath: string) {
  if (!fs.existsSync(filePath)) return
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/)
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/)
    if (!match) continue
    const [, key, rawValue] = match
    if (process.env[key] !== undefined) continue
    process.env[key] = rawValue.replace(/^['"]|['"]$/g, '')
  }
}

loadEnvFile(path.join(process.cwd(), '.env.local'))
loadEnvFile(path.join(process.cwd(), '.env'))

function getDbConfig(): { connectionString?: string; host?: string; port?: number; database?: string; user?: string; password?: string; ssl?: false | { rejectUnauthorized: boolean } } {
  if (process.env.DATABASE_URL) {
    return { connectionString: process.env.DATABASE_URL }
  }
  return {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 5433),
    database: process.env.DB_NAME || 'revampit_cms',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  }
}

function getAdminPassword() {
  const password = process.env.ADMIN_PASSWORD || process.env.SETUP_ADMIN_PASSWORD
  if (password) return password
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Set ADMIN_PASSWORD or SETUP_ADMIN_PASSWORD when bootstrapping production admins.')
  }
  return 'Admin123!'
}

async function setupAllAdmins() {
  const client = new Client(getDbConfig())
  const email = process.env.ADMIN_EMAIL || 'admin@revampit.ch'
  const password = getAdminPassword()
  const passwordHash = await bcrypt.hash(password, 12)

  await client.connect()

  try {
    await client.query('BEGIN')
    const result = await client.query<{ id: string }>(`
      INSERT INTO users (
        email,
        name,
        password_hash,
        role,
        "emailVerified",
        is_staff,
        staff_permissions,
        is_super_admin,
        dashboard_mode,
        "createdAt",
        "updatedAt"
      )
      VALUES (
        $1,
        $2,
        $3,
        'revampit_admin',
        NOW(),
        true,
        ARRAY['*']::text[],
        true,
        'lead',
        NOW(),
        NOW()
      )
      ON CONFLICT (email) DO UPDATE SET
        name = COALESCE(users.name, EXCLUDED.name),
        password_hash = EXCLUDED.password_hash,
        role = EXCLUDED.role,
        "emailVerified" = COALESCE(users."emailVerified", NOW()),
        is_staff = true,
        staff_permissions = ARRAY['*']::text[],
        is_super_admin = true,
        dashboard_mode = COALESCE(users.dashboard_mode, 'lead'),
        "updatedAt" = NOW()
      RETURNING id
    `, [email, 'Admin RevampIT', passwordHash])

    await client.query(`
      INSERT INTO user_profiles (user_id, display_name, preferred_language, created_at, updated_at)
      VALUES ($1, 'Admin RevampIT', 'de', NOW(), NOW())
      ON CONFLICT (user_id) DO NOTHING
    `, [result.rows[0].id])

    await client.query('COMMIT')

    console.log('Admin user ready.')
    console.log(`Email: ${email}`)
    console.log(process.env.ADMIN_PASSWORD || process.env.SETUP_ADMIN_PASSWORD
      ? 'Password: from ADMIN_PASSWORD/SETUP_ADMIN_PASSWORD'
      : 'Password: Admin123! (development default)')
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    await client.end()
  }
}

setupAllAdmins().catch((error) => {
  console.error('Failed to setup admin user:', error)
  process.exit(1)
})
