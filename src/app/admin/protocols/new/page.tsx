/**
 * Admin New Protocol Page - Server Wrapper
 *
 * Created: 2026-02-10
 */

import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, FileText } from 'lucide-react'
import { getTeamMembers } from '@/lib/services/protocols'
import { listTeams } from '@/lib/services/teams'
import Heading from '@/components/admin/AdminHeading'
import ProtocolFormClient from './ProtocolFormClient'
import { ROUTES } from '@/config/routes'
import { adminIconBox, adminIconColor } from '@/lib/admin-ui'

export const metadata: Metadata = {
  title: 'Neues Protokoll',
  description: 'Neues Sitzungsprotokoll erstellen.',
}

export default async function NewProtocolPage({
  searchParams,
}: {
  searchParams: Promise<{ team?: string }>
}) {
  const [teamMembers, teams, { team }] = await Promise.all([
    getTeamMembers(),
    listTeams(),
    searchParams,
  ])
  const teamOptions = teams.map((t) => ({ id: t.id, name: t.name }))
  // Only preselect a team that actually exists (the param is user-editable).
  const initialTeamId = teamOptions.some((t) => t.id === team) ? team : undefined

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href={ROUTES.admin.protocols}
          className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Zurück
        </Link>
        <div className="w-px h-6 bg-surface-overlay" />
        <div className="flex items-center gap-3">
          <div className={`${adminIconBox.md} ${adminIconColor.green}`}>
            <FileText className={adminIconBox.iconMd} />
          </div>
          <div>
            <Heading level={1} className="text-2xl font-bold text-text-primary">Neues Protokoll</Heading>
            <p className="text-text-secondary">Sitzungsprotokoll erstellen und verarbeiten</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <ProtocolFormClient teamMembers={teamMembers} teams={teamOptions} initialTeamId={initialTeamId} />
    </div>
  )
}
