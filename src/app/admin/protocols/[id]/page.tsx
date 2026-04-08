/**
 * Admin Protocol Detail Page - Server Component
 *
 * Shows protocol details, structured notes, and action items.
 * Uses service layer with visibility filtering.
 * Created: 2026-02-10
 */

import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { auth } from '@/auth'
import { query } from '@/lib/auth/db'
import { TABLE_NAMES } from '@/config/database'
import { isSuperAdmin } from '@/lib/permissions'
import { getProtocolById, getActionLinks, getTeamMembers, getDecisionData } from '@/lib/services/protocols'
import {
  MEETING_TYPE_LABELS,
  MEETING_TYPE_COLORS,
  MEETING_TYPE_ICON_COMPONENTS,
  PROTOCOL_STATUS_LABELS,
  PROTOCOL_STATUS_COLORS,
  PROTOCOL_VISIBILITY_LABELS,
  INPUT_METHOD_LABELS,
  INPUT_METHOD_ICON_COMPONENTS,
} from '@/config/protocols'
import type { MeetingType, InputMethod } from '@/config/protocols'
import Heading from '@/components/ui/Heading'
import {
  ArrowLeft,
  FileText,
  Calendar,
  User,
  Eye,
  Users,
} from 'lucide-react'
import ProtocolDetailClient from './ProtocolDetailClient'
import { formatDateWithWeekday } from '@/lib/date-formats'

export const metadata: Metadata = {
  title: 'Protokoll Details | RevampIT Admin',
  description: 'Sitzungsprotokoll anzeigen und bearbeiten.',
}

export default async function ProtocolDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ processing?: string; error?: string; retryable?: string }>
}) {
  const { id } = await params
  const qp = await searchParams

  const session = await auth()
  if (!session?.user?.email) {
    notFound()
  }

  const isAdmin = isSuperAdmin(session.user.email, session.user.isSuperAdmin)

  // Resolve dbUserId from email
  const userResult = await query<{ id: string }>(
    `SELECT id FROM ${TABLE_NAMES.USERS} WHERE email = $1`,
    [session.user.email]
  )
  const dbUserId = userResult.rows[0]?.id
  if (!dbUserId) {
    notFound()
  }

  const protocol = await getProtocolById(id, dbUserId, isAdmin)

  if (!protocol) {
    notFound()
  }

  const [actionLinks, teamMembers, decisionData] = await Promise.all([
    getActionLinks(id),
    getTeamMembers(),
    getDecisionData(id),
  ])

  // Resolve attendee UUIDs to names
  const attendeeNames: Record<string, string> = {}
  if (protocol.attendees && protocol.attendees.length > 0) {
    for (const member of teamMembers) {
      if (protocol.attendees.includes(member.id)) {
        attendeeNames[member.id] = member.name
      }
    }
  }

  const MeetingIcon = MEETING_TYPE_ICON_COMPONENTS[protocol.meeting_type as MeetingType] || FileText

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/protocols"
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Zurück
          </Link>
          <div className="w-px h-6 bg-gray-300" />
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <MeetingIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <Heading level={1} className="text-2xl font-bold text-gray-900">{protocol.title}</Heading>
              <p className="text-gray-600">
                {MEETING_TYPE_LABELS[protocol.meeting_type]}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Status + Type Badges */}
      <div className="flex items-center gap-3">
        <span
          className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${
            PROTOCOL_STATUS_COLORS[protocol.status] || 'bg-gray-100 text-gray-800'
          }`}
        >
          {PROTOCOL_STATUS_LABELS[protocol.status]}
        </span>
        <span
          className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${
            MEETING_TYPE_COLORS[protocol.meeting_type] || 'bg-gray-100 text-gray-800'
          }`}
        >
          {MEETING_TYPE_LABELS[protocol.meeting_type]}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <ProtocolDetailClient
            protocol={protocol}
            actionLinks={actionLinks}
            teamMembers={teamMembers}
            decisionVotes={decisionData.votes}
            decisionOutcomes={decisionData.outcomes}
            currentUserId={dbUserId}
            isProtocolCreator={protocol.created_by === dbUserId}
            isSuperAdmin={isAdmin}
            initialProcessingError={qp.processing === 'failed' ? {
              message: qp.error || 'Die KI-Verarbeitung ist fehlgeschlagen.',
              retryable: qp.retryable !== 'false',
            } : null}
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Protocol Info */}
          <div className="bg-white rounded-lg border p-6">
            <Heading level={2} className="text-lg font-semibold text-gray-900 mb-4">Details</Heading>
            <dl className="space-y-4">
              <div>
                <dt className="text-sm text-gray-500">Datum</dt>
                <dd className="flex items-center gap-2 mt-1">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-900">
                    {formatDateWithWeekday(protocol.meeting_date)}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Erstellt von</dt>
                <dd className="flex items-center gap-2 mt-1">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-900">
                    {protocol.created_by_name || protocol.created_by_email || 'Unbekannt'}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Sichtbarkeit</dt>
                <dd className="flex items-center gap-2 mt-1">
                  <Eye className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-900">
                    {PROTOCOL_VISIBILITY_LABELS[protocol.visibility]}
                  </span>
                </dd>
              </div>
              {protocol.input_method && (
                <div>
                  <dt className="text-sm text-gray-500">Eingabemethode</dt>
                  <dd className="flex items-center gap-2 mt-1">
                    {(() => {
                      const InputIcon = INPUT_METHOD_ICON_COMPONENTS[protocol.input_method as InputMethod]
                      return InputIcon ? <InputIcon className="w-4 h-4 text-gray-400" /> : null
                    })()}
                    <span className="text-gray-900">
                      {INPUT_METHOD_LABELS[protocol.input_method as InputMethod] || protocol.input_method}
                    </span>
                  </dd>
                </div>
              )}
              {protocol.attendees && protocol.attendees.length > 0 && (
                <div>
                  <dt className="text-sm text-gray-500">Teilnehmer</dt>
                  <dd className="mt-1">
                    <div className="flex flex-wrap gap-1">
                      {protocol.attendees.map((uid) => (
                        <span
                          key={uid}
                          className="inline-flex px-1.5 py-0.5 text-xs font-medium rounded bg-gray-100 text-gray-700"
                        >
                          {attendeeNames[uid] || 'Unbekannt'}
                        </span>
                      ))}
                    </div>
                  </dd>
                </div>
              )}
              {protocol.processing_model && (
                <div>
                  <dt className="text-sm text-gray-500">KI-Modell</dt>
                  <dd className="mt-1">
                    <span className="text-sm text-gray-600 font-mono">
                      {protocol.processing_model}
                    </span>
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {/* Raw Transcript (collapsible) */}
          {protocol.raw_transcript && (
            <details className="bg-white rounded-lg border">
              <summary className="p-4 cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                Rohtranskript anzeigen ({protocol.raw_transcript.length.toLocaleString()} Zeichen)
              </summary>
              <div className="px-4 pb-4">
                <pre className="text-xs text-gray-600 whitespace-pre-wrap max-h-96 overflow-y-auto bg-gray-50 rounded p-3">
                  {protocol.raw_transcript}
                </pre>
              </div>
            </details>
          )}
        </div>
      </div>
    </div>
  )
}
