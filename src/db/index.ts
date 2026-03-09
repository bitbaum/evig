/**
 * Drizzle ORM Client
 *
 * Wraps the existing pg Pool for type-safe queries.
 * Coexists with the raw query() function during migration.
 *
 * Usage:
 *   import { db } from '@/db'
 *   import { users } from '@/db/schema'
 *   const result = await db.select().from(users).where(eq(users.email, email))
 */

import { drizzle } from 'drizzle-orm/node-postgres'
import { getPool } from '@/lib/auth/db-connection'
import * as schema from './schema'

export const db = drizzle(getPool(), { schema })
