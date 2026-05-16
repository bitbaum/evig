/**
 * Admin New Protocol Page - Server Wrapper
 *
 * Created: 2026-02-10
 */

import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, FileText } from 'lucide-react'
import { getTeamMembers } from '@/lib/services/protocols'
import Heading from '@/components/admin/AdminHeading'
import ProtocolFormClient from './ProtocolFormClient'

export const metadata: Metadata = {
  title: 'Neues Protokoll',
  description: 'Neues Sitzungsprotokoll erstellen.',
}

export default async function NewProtocolPage() {
  const teamMembers = await getTeamMembers()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/protocols"
          className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Zurück
        </Link>
        <div className="w-px h-6 bg-neutral-300" />
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
            <FileText className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <Heading level={1} className="text-2xl font-bold text-neutral-900">Neues Protokoll</Heading>
            <p className="text-neutral-600">Sitzungsprotokoll erstellen und verarbeiten</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <ProtocolFormClient teamMembers={teamMembers} />
    </div>
  )
}
