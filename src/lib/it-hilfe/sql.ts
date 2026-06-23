/**
 * IT-Hilfe SQL fragments for Drizzle queries.
 *
 * Drizzle expands JS arrays into separate bind params, which breaks
 * PostgreSQL `ANY($1::text[])` casts. Use IN (…) via these helpers instead.
 */

import { sql } from 'drizzle-orm'
import { repairerProfiles, userSkills } from '@/db/schema'

/** True when the repairer profile's user has at least one of the given skills. */
export function technicianHasSkillMatch(skills: string[]) {
  if (skills.length === 0) return sql`false`
  return sql`EXISTS (
    SELECT 1 FROM ${userSkills} us2
    WHERE us2.user_id = ${repairerProfiles.userId}
    AND us2.skill_id IN (${sql.join(skills.map(skill => sql`${skill}`), sql`, `)})
  )`
}
