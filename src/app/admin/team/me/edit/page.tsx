/**
 * /admin/team/me/edit — self-service team profile editor.
 *
 * Any staff member edits their OWN profile here (the onboarding "complete your
 * profile" step links here). Distinct from /admin/team/[id]/edit, which is
 * gated on the `team` section and used by HR/admins to edit ANYONE.
 *
 * Own-only by construction: loads `WHERE user_id = session.user.id` and submits
 * to PUT /api/admin/team/profiles/me (which upserts the caller's own row).
 * Sensitive fields (compensation / AHV) are intentionally NOT shown or writable
 * here — those stay on the admin route — so `isSuperAdmin` is forced false.
 */

import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { db } from '@/db'
import { teamProfiles } from '@/db/schema'
import { eq } from 'drizzle-orm'
import Heading from '@/components/admin/AdminHeading'
import { TeamProfileForm } from '@/components/admin/team'
import type { TeamProfile } from '@/lib/schemas/team'

export const metadata: Metadata = {
  title: 'Mein Profil bearbeiten',
  description: 'Ergänze dein Team-Profil (Fähigkeiten, Ziele, Erreichbarkeit).',
}

export default async function MyTeamProfileEditPage() {
  const session = await auth()
  if (!session?.user?.id || !session.user.isStaff) {
    redirect('/auth/login?callbackUrl=/admin/team/me/edit')
  }

  const userId = session.user.id

  // Own profile only — non-sensitive columns (comp/AHV are managed on the admin
  // route, never surfaced in self-service). Returns undefined for new staff who
  // have no row yet; the form then starts empty and PUT /me creates it.
  const [row] = await db
    .select({
      user_id: teamProfiles.userId,
      position: teamProfiles.position,
      department: teamProfiles.department,
      employment_type: teamProfiles.employmentType,
      start_date: teamProfiles.startDate,
      contract_hours: teamProfiles.contractHours,
      skills: teamProfiles.skills,
      interests: teamProfiles.interests,
      goals: teamProfiles.goals,
      strengths: teamProfiles.strengths,
      development_areas: teamProfiles.developmentAreas,
      availability: teamProfiles.availability,
      working_hours: teamProfiles.workingHours,
      preferred_contact: teamProfiles.preferredContact,
      phone: teamProfiles.phone,
      emergency_contact_name: teamProfiles.emergencyContactName,
      emergency_contact_phone: teamProfiles.emergencyContactPhone,
      emergency_contact_relation: teamProfiles.emergencyContactRelation,
      show_on_about: teamProfiles.showOnAbout,
    })
    .from(teamProfiles)
    .where(eq(teamProfiles.userId, userId))

  // The form consumes snake_case keys at runtime; the prop's camelCase
  // Partial<TeamProfile> type is loose (same pattern as the admin [id] page).
  const initialData = (row ?? { user_id: userId }) as Partial<TeamProfile & { user_id?: string }>

  return (
    <div className="mx-auto max-w-4xl">
      <header className="mb-8 border-b border-subtle pb-6">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-text-tertiary">
          {session.user.name || session.user.email}
        </p>
        <Heading level={1} className="mt-2 text-3xl font-semibold text-text-primary sm:text-4xl">
          Mein Profil bearbeiten
        </Heading>
      </header>

      <TeamProfileForm
        initialData={initialData}
        isEdit
        profileId="me"
        isSuperAdmin={false}
      />
    </div>
  )
}
