/**
 * Admin Protocols Page - Server Component
 *
 * Shows protocol list with filters and stats.
 * Uses service layer with visibility filtering.
 * Created: 2026-02-10
 */

import { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { auth } from '@/auth'
import { query } from '@/lib/auth/db'
import { TABLE_NAMES } from '@/config/database'
import { isSuperAdmin } from '@/lib/permissions'
import { logger } from '@/lib/logger'
import { getProtocols, getProtocolStats } from '@/lib/services/protocols'
import type { ProtocolListItem } from '@/lib/schemas/protocols'
import {
  MEETING_TYPE_LABELS,
  MEETING_TYPE_COLORS,
  MEETING_TYPE_ICON_COMPONENTS,
  PROTOCOL_STATUS_LABELS,
  PROTOCOL_STATUS_COLORS,
} from '@/config/protocols'
import type { MeetingType } from '@/config/protocols'
import {
  PROTOCOL_WORKFLOW_STEPS,
  getProtocolWorkflowStep,
} from '@/lib/protocols/workflow'
import {
  Plus,
  FileText,
  Clock,
  CheckCircle2,
  Edit3,
  AlertTriangle,
} from 'lucide-react'
import AdminPageWrapper from '@/components/admin/AdminPageWrapper'
import { AdminStatsGrid } from '@/components/admin/AdminStatsGrid'
import type { StatCardItem } from '@/components/admin/AdminStatsGrid'
import Heading from '@/components/ui/Heading'
import { formatDateShort } from '@/lib/date-formats'
import ProtocolListClient from './ProtocolListClient'
import { Pagination } from '@/components/ui/Pagination'
import { getTeamMembers } from '@/lib/services/protocols'
import { ADMIN_CONTENT } from '@/config/admin-content'

export const metadata: Metadata = {
  title: 'Protokolle | RevampIT Admin',
  description: 'Sitzungsprotokolle verwalten.',
}

const PROTOCOLS_PAGE_SIZE = 20

export default async function ProtocolsAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ meeting_type?: string; status?: string; step?: string; q?: string; attendee?: string; page?: string }>
}) {
  const params = await searchParams

  const session = await auth()
  if (!session?.user?.email) {
    return null
  }

  const isAdmin = isSuperAdmin(session.user.email, session.user.isSuperAdmin)

  const userResult = await query<{ id: string }>(
    `SELECT id FROM ${TABLE_NAMES.USERS} WHERE email = $1`,
    [session.user.email]
  )
  const dbUserId = userResult.rows[0]?.id
  if (!dbUserId) {
    return null
  }

  const stepFilter = params.step
  const validStepFilter = PROTOCOL_WORKFLOW_STEPS.some((step) => step.id === stepFilter)
    ? stepFilter
    : undefined

  const currentPage = Math.max(1, parseInt(params.page ?? '1', 10) || 1)
  const pageLimit = PROTOCOLS_PAGE_SIZE

  let stats = { total: 0, draft: 0, review: 0, finalized: 0 }
  let protocols: ProtocolListItem[] = []
  let totalProtocols = 0
  let teamMembers: Array<{ id: string; name: string }> = []
  let listError = false
  try {
    const [fetchedStats, fetchedProtocols, fetchedTeamMembers] = await Promise.all([
      getProtocolStats(dbUserId, isAdmin),
      getProtocols(dbUserId, isAdmin, {
        meeting_type: params.meeting_type,
        status: params.status,
        q: params.q,
        attendee: params.attendee,
        page: currentPage,
        limit: pageLimit,
      }),
      getTeamMembers(),
    ])
    stats = fetchedStats
    protocols = fetchedProtocols.protocols
    totalProtocols = fetchedProtocols.total
    teamMembers = fetchedTeamMembers
  } catch (error) {
    logger.error('Error fetching protocols', { error })
    listError = true
  }

  const filteredProtocols = validStepFilter
    ? protocols.filter((protocol) => getProtocolWorkflowStep({
      status: protocol.status,
      hasStructuredNotes: protocol.has_structured_notes,
      unlinkedTaskCount: protocol.unlinked_action_item_count,
    }) === validStepFilter)
    : protocols

  const totalPages = Math.ceil(totalProtocols / PROTOCOLS_PAGE_SIZE)

  const protocolsHrefBase = (() => {
    const p = new URLSearchParams()
    if (params.meeting_type) p.set('meeting_type', params.meeting_type)
    if (params.status) p.set('status', params.status)
    if (params.q) p.set('q', params.q)
    if (params.attendee) p.set('attendee', params.attendee)
    const qs = p.toString()
    return `/admin/protocols${qs ? `?${qs}` : ''}`
  })()

  return (
    <AdminPageWrapper
      title="Protokolle"
      description="Sitzungsprotokolle und Besprechungsnotizen"
      icon={FileText}
      iconColor="blue"
      actions={
        <Link
          href="/admin/protocols/new"
          className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Neues Protokoll
        </Link>
      }
    >
      {/* Stats Cards */}
      <AdminStatsGrid items={[
        {
          icon: FileText,
          iconBgColor: 'bg-gray-100',
          iconColor: 'text-gray-600',
          label: 'Gesamt',
          value: stats.total,
        },
        {
          icon: Edit3,
          iconBgColor: 'bg-gray-100',
          iconColor: 'text-gray-600',
          label: 'Entwürfe',
          value: stats.draft,
        },
        {
          icon: Clock,
          iconBgColor: 'bg-blue-100',
          iconColor: 'text-blue-600',
          label: 'Zur Überprüfung',
          value: stats.review,
          valueColor: 'text-blue-600',
        },
        {
          icon: CheckCircle2,
          iconBgColor: 'bg-green-100',
          iconColor: 'text-green-600',
          label: 'Abgeschlossen',
          value: stats.finalized,
          valueColor: 'text-green-600',
        },
      ] satisfies StatCardItem[]} />

      {/* Filters */}
      <Suspense fallback={<div className="bg-white rounded-lg border p-4 h-14" />}>
        <ProtocolListClient teamMembers={teamMembers} />
      </Suspense>

      {/* Protocol List */}
      <div className="bg-white rounded-lg border overflow-hidden overflow-x-auto">
        {listError ? (
          <div className="p-12 text-center">
            <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <Heading level={3} className="text-lg font-medium text-gray-900 mb-2">
              {ADMIN_CONTENT.protocols.errorMessage}
            </Heading>
            <p className="text-gray-600 mb-4">
              Es gab ein Problem beim Laden der Protokolle. Bitte versuche es erneut.
            </p>
            <a
              href=""
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Seite neu laden
            </a>
          </div>
        ) : filteredProtocols.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <Heading level={3} className="text-lg font-medium text-gray-900 mb-2">
              {ADMIN_CONTENT.protocols.emptyTitle}
            </Heading>
            <p className="text-gray-600 mb-4">
              {ADMIN_CONTENT.protocols.emptyDescription}
            </p>
            <Link
              href="/admin/protocols/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Neues Protokoll
            </Link>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">
                  Titel
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">
                  Typ
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">
                  Datum
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">
                  Teilnehmer
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">
                  Status
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">
                  Workflow
                </th>
                <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">
                  Aktionen
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredProtocols.map((protocol) => {
                const TypeIcon = MEETING_TYPE_ICON_COMPONENTS[protocol.meeting_type as MeetingType]
                return (
                  <tr key={protocol.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/protocols/${protocol.id}`}
                        className="font-medium text-gray-900 hover:text-blue-600 underline-offset-2 hover:underline"
                      >
                        {protocol.title}
                      </Link>
                      {protocol.created_by_name && (
                        <p className="text-sm text-gray-500">
                          von {protocol.created_by_name}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded-full ${
                          MEETING_TYPE_COLORS[protocol.meeting_type] || 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {TypeIcon && <TypeIcon className="w-3 h-3" />}
                        {MEETING_TYPE_LABELS[protocol.meeting_type]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-600">
                        {formatDateShort(protocol.meeting_date)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {protocol.attendee_names && protocol.attendee_names.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {protocol.attendee_names.slice(0, 3).map((name, i) => (
                            <span
                              key={i}
                              className="inline-flex px-1.5 py-0.5 text-xs font-medium rounded bg-gray-100 text-gray-700"
                            >
                              {name.split(' ')[0]}
                            </span>
                          ))}
                          {protocol.attendee_names.length > 3 && (
                            <span className="inline-flex px-1.5 py-0.5 text-xs text-gray-500">
                              +{protocol.attendee_names.length - 3} weitere
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          PROTOCOL_STATUS_COLORS[protocol.status] || 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {PROTOCOL_STATUS_LABELS[protocol.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {(() => {
                        const workflowStep = getProtocolWorkflowStep({
                          status: protocol.status,
                          hasStructuredNotes: protocol.has_structured_notes,
                          unlinkedTaskCount: protocol.unlinked_action_item_count,
                        })
                        const workflowIndex = PROTOCOL_WORKFLOW_STEPS.findIndex((step) => step.id === workflowStep) + 1
                        const workflowLabel = PROTOCOL_WORKFLOW_STEPS.find((step) => step.id === workflowStep)?.label || 'Workflow'
                        return (
                          <span className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded-full bg-slate-100 text-slate-700">
                            <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-slate-200 text-[10px] font-semibold">
                              {workflowIndex}
                            </span>
                            {workflowLabel}
                          </span>
                        )
                      })()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-3">
                        {protocol.action_item_count > 0 && (
                          <span className="text-sm text-gray-500">{protocol.action_item_count} Aktionen</span>
                        )}
                        <Link
                          href={`/admin/protocols/${protocol.id}`}
                          className="text-sm text-blue-600 hover:text-blue-800 underline"
                        >
                          Öffnen
                        </Link>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalProtocols}
          pageSize={PROTOCOLS_PAGE_SIZE}
          hrefBase={protocolsHrefBase}
        />
      </div>
    </AdminPageWrapper>
  )
}
