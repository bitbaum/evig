/**
 * Admin Protocol Detail Page - Server Component
 *
 * Shows protocol details, structured notes, and action items.
 * Uses service layer with visibility filtering.
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
  PROTOCOL_STATUSES,
  PROTOCOL_VISIBILITY_LABELS,
  INPUT_METHOD_LABELS,
  INPUT_METHOD_ICON_COMPONENTS,
} from '@/config/protocols'
import type { MeetingType, InputMethod } from '@/config/protocols'
import Heading from '@/components/admin/AdminHeading'
import {
  ArrowLeft,
  FileText,
  Calendar,
  User,
  Eye,
} from 'lucide-react'
import ProtocolDetailClient from './ProtocolDetailClient'
import { ProtocolAttendeesCard } from '@/components/admin/protocols'
import { formatDateWithWeekday } from '@/lib/date-formats'
import { ROUTES } from '@/config/routes'

export const metadata: Metadata = {
  title: 'Protokoll Details',
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

  // Resolve attendee UUIDs to display names
  const attendeeNames: Record<string, string> = {}
  if (protocol.attendees && protocol.attendees.length > 0) {
    for (const member of teamMembers) {
      if (protocol.attendees.includes(member.id)) {
        attendeeNames[member.id] = member.name
      }
    }
  }

  const MeetingIcon = MEETING_TYPE_ICON_COMPONENTS[protocol.meeting_type as MeetingType] || FileText
  const isReview = protocol.status === PROTOCOL_STATUSES.REVIEW

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <Link
            href={ROUTES.admin.protocols}
            className="flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors flex-shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            Zurück
          </Link>
          <div className="w-px h-5 bg-neutral-200 dark:bg-white/[0.08] flex-shrink-0" />
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 bg-primary-100 dark:bg-primary-500/[0.12] rounded-lg flex items-center justify-center flex-shrink-0">
              <MeetingIcon className="w-4 h-4 text-primary-600 dark:text-primary-400" />
            </div>
            <div className="min-w-0">
              <Heading level={1} className="text-xl font-bold text-neutral-900 dark:text-white truncate">
                {protocol.title}
              </Heading>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                {MEETING_TYPE_LABELS[protocol.meeting_type]} · {formatDateWithWeekday(protocol.meeting_date)}
              </p>
            </div>
          </div>
        </div>

        {/* Status badge */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span
            className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${
              PROTOCOL_STATUS_COLORS[protocol.status] || 'bg-neutral-100 text-neutral-800'
            }`}
          >
            {PROTOCOL_STATUS_LABELS[protocol.status]}
          </span>
          <span
            className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${
              MEETING_TYPE_COLORS[protocol.meeting_type] || 'bg-neutral-100 text-neutral-800'
            }`}
          >
            {MEETING_TYPE_LABELS[protocol.meeting_type]}
          </span>
        </div>
      </div>

      {/* Main layout: 2/3 content + 1/3 sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
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
        <div className="space-y-4">
          {/* Protocol Details */}
          <div className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-white/[0.08] p-4">
            <Heading level={2} className="text-sm font-semibold text-neutral-900 dark:text-white mb-3">Details</Heading>
            <dl className="space-y-3">
              <div>
                <dt className="text-xs text-neutral-400 dark:text-neutral-500 mb-0.5">Datum</dt>
                <dd className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                  <span className="text-sm text-neutral-900 dark:text-neutral-200">
                    {formatDateWithWeekday(protocol.meeting_date)}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-xs text-neutral-400 dark:text-neutral-500 mb-0.5">Erstellt von</dt>
                <dd className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-neutral-400" />
                  <span className="text-sm text-neutral-900 dark:text-neutral-200">
                    {protocol.created_by_name || protocol.created_by_email || 'Unbekannt'}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-xs text-neutral-400 dark:text-neutral-500 mb-0.5">Sichtbarkeit</dt>
                <dd className="flex items-center gap-2">
                  <Eye className="w-3.5 h-3.5 text-neutral-400" />
                  <span className="text-sm text-neutral-900 dark:text-neutral-200">
                    {PROTOCOL_VISIBILITY_LABELS[protocol.visibility]}
                  </span>
                </dd>
              </div>
              {protocol.input_method && (
                <div>
                  <dt className="text-xs text-neutral-400 dark:text-neutral-500 mb-0.5">Eingabemethode</dt>
                  <dd className="flex items-center gap-2">
                    {(() => {
                      const InputIcon = INPUT_METHOD_ICON_COMPONENTS[protocol.input_method as InputMethod]
                      return InputIcon ? <InputIcon className="w-3.5 h-3.5 text-neutral-400" /> : null
                    })()}
                    <span className="text-sm text-neutral-900 dark:text-neutral-200">
                      {INPUT_METHOD_LABELS[protocol.input_method as InputMethod] || protocol.input_method}
                    </span>
                  </dd>
                </div>
              )}
              {protocol.processing_model && (
                <div>
                  <dt className="text-xs text-neutral-400 dark:text-neutral-500 mb-0.5">KI-Modell</dt>
                  <dd>
                    <span className="text-xs text-neutral-500 dark:text-neutral-400 font-mono">
                      {protocol.processing_model}
                    </span>
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {/* Attendees — editable client component */}
          <ProtocolAttendeesCard
            protocolId={protocol.id}
            attendees={protocol.attendees || []}
            attendeeNames={attendeeNames}
            teamMembers={teamMembers}
            isReview={isReview}
          />

          {/* Raw Transcript (collapsed) */}
          {protocol.raw_transcript && (
            <details className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-white/[0.08]">
              <summary className="p-4 cursor-pointer text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white select-none">
                Rohtranskript ({protocol.raw_transcript.length.toLocaleString()} Zeichen)
              </summary>
              <div className="px-4 pb-4">
                <pre className="text-xs text-neutral-600 dark:text-neutral-400 whitespace-pre-wrap max-h-80 overflow-y-auto bg-neutral-50 dark:bg-neutral-800/50 rounded-lg p-3 leading-relaxed">
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
