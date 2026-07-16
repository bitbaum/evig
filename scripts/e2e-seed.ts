import { Client } from 'pg'
import bcrypt from 'bcryptjs'

type DbConfig =
  | { connectionString: string }
  | { host: string; port: number; database: string; user: string; password: string; ssl: false | { rejectUnauthorized: boolean } }

const ADMIN_EMAIL = process.env.AUTH_TEST_ADMIN_EMAIL || 'e2e-admin@revampit.test'
const ADMIN_PASSWORD = process.env.AUTH_TEST_ADMIN_PASSWORD || 'E2EAdmin123!'
const USER_EMAIL = process.env.AUTH_TEST_USER_EMAIL || 'e2e-user@revampit.test'
const USER_PASSWORD = process.env.AUTH_TEST_USER_PASSWORD || 'E2EUser123!'

function getDbConfig(): DbConfig {
  if (process.env.DATABASE_URL) {
    return { connectionString: process.env.DATABASE_URL }
  }
  return {
    host: process.env.DB_HOST || process.env.PGHOST || 'localhost',
    port: Number(process.env.DB_PORT || process.env.PGPORT || 5433),
    database: process.env.DB_NAME || process.env.PGDATABASE || 'revampit_cms',
    user: process.env.DB_USER || process.env.PGUSER || 'postgres',
    password: process.env.DB_PASSWORD || process.env.PGPASSWORD || 'postgres',
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  }
}

async function upsertUser(
  client: Client,
  input: { email: string; password: string; name: string; isStaff: boolean; isSuperAdmin: boolean; permissions: string[] },
): Promise<string> {
  const passwordHash = await bcrypt.hash(input.password, 12)
  const result = await client.query<{ id: string }>(
    `
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
      VALUES ($1, $2, $3, $4, NOW(), $5, $6::text[], $7, $8, NOW(), NOW())
      ON CONFLICT (email) DO UPDATE SET
        name = EXCLUDED.name,
        password_hash = EXCLUDED.password_hash,
        role = EXCLUDED.role,
        "emailVerified" = COALESCE(users."emailVerified", NOW()),
        is_staff = EXCLUDED.is_staff,
        staff_permissions = EXCLUDED.staff_permissions,
        is_super_admin = EXCLUDED.is_super_admin,
        dashboard_mode = EXCLUDED.dashboard_mode,
        "updatedAt" = NOW()
      RETURNING id
    `,
    [
      input.email,
      input.name,
      passwordHash,
      input.isStaff ? 'revampit_admin' : 'user',
      input.isStaff,
      input.permissions,
      input.isSuperAdmin,
      input.isStaff ? 'lead' : 'volunteer',
    ],
  )

  const userId = result.rows[0].id
  await client.query(
    `
      INSERT INTO user_profiles (user_id, display_name, preferred_language, created_at, updated_at)
      VALUES ($1, $2, 'de', NOW(), NOW())
      ON CONFLICT (user_id) DO UPDATE SET
        display_name = EXCLUDED.display_name,
        preferred_language = COALESCE(user_profiles.preferred_language, 'de'),
        updated_at = NOW()
    `,
    [userId, input.name],
  )

  return userId
}

async function seed() {
  const client = new Client(getDbConfig())
  await client.connect()

  try {
    await client.query('BEGIN')

    const adminId = await upsertUser(client, {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      name: 'E2E Admin',
      isStaff: true,
      isSuperAdmin: true,
      permissions: ['*'],
    })

    const userId = await upsertUser(client, {
      email: USER_EMAIL,
      password: USER_PASSWORD,
      name: 'E2E User',
      isStaff: false,
      isSuperAdmin: false,
      permissions: [],
    })

    await client.query(`DELETE FROM locations WHERE name = 'E2E Workshop Room'`)
    await client.query(
      `
        INSERT INTO technician_profiles (
          user_id,
          business_name,
          business_type,
          description,
          phone,
          address,
          city,
          postal_code,
          canton,
          services_offered,
          specializations,
          is_active,
          status,
          accepts_gratis,
          accepts_kulturlegi,
          max_travel_km,
          service_delivery_types,
          profile_tier,
          updated_at
        )
        VALUES (
          $1,
          'E2E Technik',
          'individual',
          'Deterministic Playwright technician profile.',
          '+41440000000',
          'Birmensdorferstrasse 379',
          'Zurich',
          '8055',
          'ZH',
          ARRAY['hardware_diagnosis', 'computer_repair']::text[],
          ARRAY['laptop']::text[],
          true,
          'active',
          true,
          true,
          25,
          ARRAY['remote', 'onsite', 'flexible']::text[],
          'community',
          NOW()
        )
        ON CONFLICT (user_id) DO UPDATE SET
          description = EXCLUDED.description,
          services_offered = EXCLUDED.services_offered,
          specializations = EXCLUDED.specializations,
          is_active = true,
          status = 'active',
          accepts_gratis = true,
          accepts_kulturlegi = true,
          service_delivery_types = EXCLUDED.service_delivery_types,
          profile_tier = 'community',
          updated_at = NOW()
      `,
      [userId],
    )

    // Verification lives on user_profiles (identity SSOT since migration 121/122).
    await client.query(
      `
        UPDATE user_profiles
        SET is_verified = true,
            verification_date = COALESCE(verification_date, NOW()),
            updated_at = NOW()
        WHERE user_id = $1
      `,
      [userId],
    )

    await client.query(`DELETE FROM user_skills WHERE user_id = $1`, [userId])
    await client.query(
      `
        INSERT INTO user_skills (user_id, skill_id, category_id, verified, verified_at, verified_by, updated_at)
        VALUES
          ($1, 'hardware_diagnosis', 'laptop', true, NOW(), $2, NOW()),
          ($1, 'linux_support', 'software', true, NOW(), $2, NOW())
      `,
      [userId, adminId],
    )

    await client.query(
      `DELETE FROM listings WHERE seller_id = $1 AND title = 'E2E Seed Listing'`,
      [userId],
    )
    await client.query(
      `
        INSERT INTO service_types (
          slug,
          name,
          description,
          duration_minutes,
          price_cents,
          requires_approval,
          is_active,
          category,
          is_bookable,
          is_featured,
          display_order,
          updated_at
        )
        VALUES (
          'computer-repair-upgrades',
          'Computer repair and upgrades',
          'Seeded E2E service type.',
          60,
          0,
          false,
          true,
          'repair',
          true,
          true,
          1,
          NOW()
        )
        ON CONFLICT (slug) DO UPDATE SET
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          is_active = true,
          is_bookable = true,
          updated_at = NOW()
      `,
    )

    await client.query(
      `
        INSERT INTO locations (
          name,
          type,
          description,
          address_line1,
          postal_code,
          city,
          canton,
          country,
          max_capacity,
          facilities,
          is_active,
          is_approved,
          approval_status,
          created_by,
          approved_by,
          approved_at,
          updated_at
        )
        VALUES (
          'E2E Workshop Room',
          'venue',
          'Seeded Playwright venue.',
          'Birmensdorferstrasse 379',
          '8055',
          'Zurich',
          'ZH',
          'Switzerland',
          20,
          ARRAY['projector', 'wifi']::text[],
          true,
          true,
          'approved',
          $1,
          $1,
          NOW(),
          NOW()
        )
        ON CONFLICT DO NOTHING
      `,
      [adminId],
    )

    const workshop = await client.query<{ id: string }>(
      `
        INSERT INTO workshops (
          slug,
          title,
          description,
          short_description,
          category,
          duration,
          duration_minutes,
          level,
          min_participants,
          max_participants,
          price_cents,
          is_active,
          created_by,
          updated_by,
          updated_at
        )
        VALUES (
          'e2e-free-workshop',
          'E2E Free Workshop',
          'Deterministic workshop for Playwright registration journeys.',
          'E2E registration fixture',
          'Hardware',
          '2 hours',
          120,
          'beginner',
          1,
          12,
          0,
          true,
          $1,
          $1,
          NOW()
        )
        ON CONFLICT (slug) DO UPDATE SET
          title = EXCLUDED.title,
          description = EXCLUDED.description,
          is_active = true,
          price_cents = 0,
          max_participants = 12,
          updated_by = EXCLUDED.updated_by,
          updated_at = NOW()
        RETURNING id
      `,
      [adminId],
    )

    await client.query(
      `DELETE FROM workshop_instances WHERE workshop_id = $1 AND notes = 'Seeded Playwright workshop instance.'`,
      [workshop.rows[0].id],
    )
    await client.query(
      `
        INSERT INTO workshop_instances (
          workshop_id,
          start_date,
          end_date,
          location,
          instructor,
          max_participants,
          notes,
          status,
          instructor_id,
          updated_at
        )
        VALUES (
          $1,
          NOW() + INTERVAL '14 days',
          NOW() + INTERVAL '14 days 2 hours',
          'E2E Workshop Room',
          'E2E Admin',
          12,
          'Seeded Playwright workshop instance.',
          'scheduled',
          $2,
          NOW()
        )
        ON CONFLICT DO NOTHING
      `,
      [workshop.rows[0].id, adminId],
    )

    await client.query(
      `
        INSERT INTO listings (
          seller_id,
          title,
          description,
          price_chf,
          category,
          condition,
          delivery_options,
          pickup_location,
          payment_mode,
          status,
          is_revampit,
          updated_at
        )
        VALUES (
          $1,
          'E2E Seed Listing',
          'Deterministic listing for local Playwright smoke coverage.',
          1,
          '99',
          'good',
          'pickup',
          'Zurich',
          'secure',
          'active',
          false,
          NOW()
        )
        ON CONFLICT DO NOTHING
      `,
      [userId],
    )

    await client.query('COMMIT')

    console.log('E2E seed ready.')
    console.log(`Admin: ${ADMIN_EMAIL}`)
    console.log(`User: ${USER_EMAIL}`)
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    await client.end()
  }
}

seed().catch((error) => {
  console.error('Failed to seed E2E data:', error)
  process.exit(1)
})
