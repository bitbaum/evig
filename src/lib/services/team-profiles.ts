/**
 * Team profiles — shared create/update for HR hire flow and admin CRUD.
 */

import { db } from '@/db'
import { teamProfiles, users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import type { CreateTeamProfileInput } from '@/lib/schemas/team'

export type { CreateTeamProfileInput }

export interface HireTeamProfileInput {
  userId: string
  position: string
  department?: string | null
  employmentType: string
  startDate?: string | null
  contractHours?: number | null
  skills: string[]
  goals?: string | null
  developmentAreas?: string | null
  phone?: string | null
}

export async function findTeamProfileIdByUserId(userId: string): Promise<string | null> {
  const [row] = await db
    .select({ id: teamProfiles.id })
    .from(teamProfiles)
    .where(eq(teamProfiles.userId, userId))
    .limit(1)
  return row?.id ?? null
}

export async function promoteUserToStaff(userId: string): Promise<void> {
  await db
    .update(users)
    .set({ isStaff: true, updatedAt: new Date().toISOString() })
    .where(eq(users.id, userId))
}

export async function createTeamProfileForHire(input: HireTeamProfileInput): Promise<{ id: string }> {
  const [profile] = await db
    .insert(teamProfiles)
    .values({
      userId: input.userId,
      position: input.position,
      department: input.department ?? null,
      employmentType: input.employmentType,
      startDate: input.startDate ?? null,
      contractHours: input.contractHours ?? null,
      skills: input.skills,
      goals: input.goals ?? null,
      developmentAreas: input.developmentAreas ?? null,
      phone: input.phone ?? null,
      isActive: true,
      workState: 'active',
    })
    .returning({ id: teamProfiles.id })

  return { id: profile.id }
}

/** Map validated admin form payload → Drizzle insert row. */
export function buildManualTeamProfileValues(
  data: CreateTeamProfileInput,
  options?: { stripSensitive?: boolean },
): typeof teamProfiles.$inferInsert {
  const payload = { ...data } as Record<string, unknown>
  if (options?.stripSensitive) {
    delete payload.hr_notes
    delete payload.hourly_rate_cents
    delete payload.salary_chf
    delete payload.salary_effective_date
    delete payload.ahv_number
    delete payload.canton_tax_code
  }

  const d = payload as CreateTeamProfileInput

  return {
    userId: d.user_id,
    position: d.position || null,
    department: d.department || null,
    employmentType: d.employment_type || null,
    startDate: d.start_date || null,
    contractHours: d.contract_hours || null,
    skills: d.skills || [],
    interests: d.interests || [],
    goals: d.goals || null,
    strengths: d.strengths || null,
    developmentAreas: d.development_areas || null,
    availability: d.availability || null,
    workingHours: d.working_hours || null,
    preferredContact: d.preferred_contact || 'email',
    phone: d.phone || null,
    emergencyContactName: d.emergency_contact_name || null,
    emergencyContactPhone: d.emergency_contact_phone || null,
    emergencyContactRelation: d.emergency_contact_relation || null,
    hrNotes: d.hr_notes || null,
    isActive: d.is_active ?? true,
    showOnAbout: d.show_on_about ?? false,
    endDate: d.end_date || null,
    exitReason: d.exit_reason || null,
    workState: d.work_state || 'active',
    hourlyRateCents: d.hourly_rate_cents ?? null,
    salaryChf: d.salary_chf != null ? String(d.salary_chf) : null,
    salaryEffectiveDate: d.salary_effective_date || null,
    ahvNumber: d.ahv_number || null,
    cantonTaxCode: d.canton_tax_code || null,
  }
}

export async function createTeamProfileManual(
  data: CreateTeamProfileInput,
  options?: { stripSensitive?: boolean },
): Promise<{ id: string }> {
  const values = buildManualTeamProfileValues(data, options)
  const [created] = await db.insert(teamProfiles).values(values).returning({ id: teamProfiles.id })
  return { id: created.id }
}
