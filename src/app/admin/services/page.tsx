/**
 * Admin Services Page - Server Component
 *
 * Shows service types from the database.
 * No mock data - all values come from actual database queries.
 */

import { Metadata } from 'next'
import Link from 'next/link'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { query } from '@/lib/auth/db'
import { TABLE_NAMES } from '@/config/database'
import {
  Plus,
  Wrench,
  Users,
  Edit,
  Eye,
  Trash2,
  CheckCircle,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Dienstleistungen verwalten | RevampIT Admin',
  description: 'Dienstleistungen erstellen, bearbeiten und verwalten.',
}

interface ServiceType {
  id: string
  name: string
  description: string | null
  price_cents: number | null
  duration_minutes: number | null
  is_active: boolean
  created_at: string
}

interface ServiceStats {
  totalServices: number
  activeServices: number
  totalBookings: number
  totalTechnicians: number
}

async function getServiceStats(): Promise<ServiceStats> {
  let totalServices = 0
  let activeServices = 0
  let totalBookings = 0
  let totalTechnicians = 0

  try {
    const servicesResult = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM ${TABLE_NAMES.SERVICE_TYPES}`
    )
    totalServices = parseInt(servicesResult.rows[0]?.count || '0')

    const activeResult = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM ${TABLE_NAMES.SERVICE_TYPES} WHERE is_active = true`
    )
    activeServices = parseInt(activeResult.rows[0]?.count || '0')
  } catch {
    // Table might not exist
  }

  try {
    const bookingsResult = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM ${TABLE_NAMES.SERVICE_APPOINTMENTS}`
    )
    totalBookings = parseInt(bookingsResult.rows[0]?.count || '0')
  } catch {
    // Table might not exist
  }

  try {
    const techResult = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM technician_profiles WHERE is_active = true`
    )
    totalTechnicians = parseInt(techResult.rows[0]?.count || '0')
  } catch {
    // Table might not exist
  }

  return { totalServices, activeServices, totalBookings, totalTechnicians }
}

async function getServices(): Promise<ServiceType[]> {
  try {
    const result = await query<ServiceType>(
      `SELECT
        id,
        name,
        description,
        price_cents,
        duration_minutes,
        is_active,
        created_at
       FROM ${TABLE_NAMES.SERVICE_TYPES}
       ORDER BY is_active DESC, name ASC`
    )
    return result.rows
  } catch {
    // Table might not exist
    return []
  }
}

function formatPrice(cents: number | null): string {
  if (cents === null) return 'Auf Anfrage'
  return `CHF ${(cents / 100).toFixed(2)}`
}

function formatDuration(minutes: number | null): string {
  if (minutes === null) return '-'
  if (minutes < 60) return `${minutes} Min.`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (mins === 0) return `${hours} Std.`
  return `${hours} Std. ${mins} Min.`
}

export default async function AdminServicesPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/auth/login?callbackUrl=/admin/services')
  }

  const [stats, services] = await Promise.all([
    getServiceStats(),
    getServices(),
  ])

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Dienstleistungen verwalten
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Erstellen und verwalten Sie Ihre Service-Angebote
          </p>
        </div>
        <Link
          href="/admin/services/new"
          className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          Dienstleistung erstellen
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Wrench className="w-8 h-8 text-blue-600" />
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Gesamt Services</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalServices}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-8 h-8 text-green-600" />
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Aktiv</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.activeServices}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-purple-600" />
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Buchungen</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalBookings}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Wrench className="w-8 h-8 text-orange-600" />
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Techniker</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalTechnicians}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Services Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        {services.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Dienstleistung
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Preis
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Dauer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Aktionen
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {services.map((service) => (
                  <tr key={service.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {service.name}
                        </div>
                        {service.description && (
                          <div className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">
                            {service.description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatPrice(service.price_cents)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {formatDuration(service.duration_minutes)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        service.is_active
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
                      }`}>
                        {service.is_active ? 'Aktiv' : 'Inaktiv'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <Wrench className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Noch keine Dienstleistungen
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Erstellen Sie Ihre erste Dienstleistung, um Service-Termine anzubieten.
            </p>
            <Link
              href="/admin/services/new"
              className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5" />
              Erste Dienstleistung erstellen
            </Link>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
            <Wrench className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-medium text-blue-900 dark:text-blue-200">
              Dienstleistungs-Verwaltung
            </h3>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1 mb-3">
              Dienstleistungen sind die Kernkompetenz von RevampIT. Bieten Sie Reparaturen, Installationen,
              Beratungen und andere technische Services an. Kunden können online Termine buchen.
            </p>
            <div className="flex gap-3">
              <Link
                href="/admin/services/new"
                className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700 transition-colors"
              >
                Dienstleistung erstellen
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
