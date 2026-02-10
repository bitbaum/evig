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
import { getProtocols, getProtocolStats } from '@/lib/services/protocols'
import {
  MEETING_TYPE_LABELS,
  MEETING_TYPE_COLORS,
  MEETING_TYPE_ICONS,
  PROTOCOL_STATUS_LABELS,
  PROTOCOL_STATUS_COLORS,
} from '@/config/protocols'
import type { MeetingType } from '@/config/protocols'
import {
  Plus,
  FileText,
  Clock,
  CheckCircle2,
  Edit3,
  Users,
  FolderKanban,
  RefreshCw,
  Landmark,
  MessageSquare,
} from 'lucide-react'
import AdminPageWrapper from '@/components/admin/AdminPageWrapper'
import ProtocolListClient from './ProtocolListClient'

export const metadata: Metadata = {
  title: 'Protokolle | RevampIT Admin',
  description: 'Sitzungsprotokolle verwalten.',
}

const MEETING_TYPE_ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Users,
  FolderKanban,
  RefreshCw,
  Landmark,
  MessageSquare,
}

export default async function ProtocolsAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ meeting_type?: string; status?: string; q?: string }>
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

  const [stats, protocols] = await Promise.all([
    getProtocolStats(dbUserId, isAdmin),
    getProtocols(dbUserId, isAdmin, {
      meeting_type: params.meeting_type,
      status: params.status,
      q: params.q,
    }),
  ])

  return (
    <AdminPageWrapper
      title="Protokolle"
      description="Sitzungsprotokolle und Besprechungsnotizen"
      icon={FileText}
      iconColor="blue"
      actions={
        <Link
          href="/admin/protocols/new"
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Neues Protokoll
        </Link>
      }
    >
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Gesamt</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <Edit3 className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Entwürfe</p>
              <p className="text-2xl font-bold text-gray-900">{stats.draft}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Zur Überprüfung</p>
              <p className="text-2xl font-bold text-blue-600">{stats.review}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Abgeschlossen</p>
              <p className="text-2xl font-bold text-green-600">{stats.finalized}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Suspense fallback={<div className="bg-white rounded-lg border p-4 h-14" />}>
        <ProtocolListClient />
      </Suspense>

      {/* Protocol List */}
      <div className="bg-white rounded-lg border overflow-hidden">
        {protocols.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Keine Protokolle gefunden
            </h3>
            <p className="text-gray-600 mb-4">
              Erstellen Sie Ihr erstes Sitzungsprotokoll.
            </p>
            <Link
              href="/admin/protocols/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
                  Status
                </th>
                <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">
                  Aktionen
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {protocols.map((protocol) => {
                const iconName = MEETING_TYPE_ICONS[protocol.meeting_type as MeetingType]
                const TypeIcon = MEETING_TYPE_ICON_MAP[iconName]
                return (
                  <tr key={protocol.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/protocols/${protocol.id}`}
                        className="font-medium text-gray-900 hover:text-blue-600"
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
                        {new Date(protocol.meeting_date).toLocaleDateString('de-CH')}
                      </span>
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
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm text-gray-500">
                        {protocol.action_item_count > 0 && (
                          <span>{protocol.action_item_count} Aktionen</span>
                        )}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </AdminPageWrapper>
  )
}
