/**
 * Admin Services Page - Server Component
 *
 * Shows service types from the database with full CRUD functionality.
 */

import { Metadata } from 'next'
import Link from 'next/link'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { query } from '@/lib/auth/db'
import { TABLE_NAMES } from '@/config/database'
import { CATEGORY_LABELS } from '@/config/service-categories'
import { formatPriceCents } from '@/config/marketplace'
import {
  Plus,
  Wrench,
  Users,
  Edit,
  Eye,
  CheckCircle,
  Star,
  Calendar,
} from 'lucide-react'
import AdminPageWrapper from '@/components/admin/AdminPageWrapper'

export const metadata: Metadata = {
  title: 'Dienstleistungen verwalten',
  description: 'Dienstleistungen erstellen, bearbeiten und verwalten.',
}

interface ServiceType {
  id: string
  slug: string
  name: string
  description: string | null
  category: string | null
  price_cents: number | null
  duration_minutes: number | null
  is_active: boolean
  is_bookable: boolean
  is_featured: boolean
  display_order: number
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
      `SELECT COUNT(*) as count FROM ${TABLE_NAMES.IT_HILFE_TECHNICIAN_PROFILES} WHERE is_active = true`
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
        id, slug, name, description, category,
        price_cents, duration_minutes,
        is_active, is_bookable, is_featured, display_order,
        created_at
       FROM ${TABLE_NAMES.SERVICE_TYPES}
       ORDER BY is_active DESC, display_order, name ASC`
    )
    return result.rows
  } catch {
    // Table might not exist
    return []
  }
}

const formatPrice = formatPriceCents

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
    <AdminPageWrapper
      title="Dienstleistungen verwalten"
      description="Erstellen und verwalten Sie Ihre Service-Angebote"
      icon={Wrench}
      iconColor="green"
      actions={
        <Link
          href="/admin/services/new"
          className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          Dienstleistung erstellen
        </Link>
      }
    >
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-sm border border-neutral-100 dark:border-neutral-700">
          <div className="flex items-center gap-3">
            <Wrench className="w-8 h-8 text-info-600" />
            <div>
              <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Gesamt Services</p>
              <p className="text-2xl font-bold text-neutral-900 dark:text-white">{stats.totalServices}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-sm border border-neutral-100 dark:border-neutral-700">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-8 h-8 text-primary-600" />
            <div>
              <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Aktiv</p>
              <p className="text-2xl font-bold text-neutral-900 dark:text-white">{stats.activeServices}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-sm border border-neutral-100 dark:border-neutral-700">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-purple-600" />
            <div>
              <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Buchungen</p>
              <p className="text-2xl font-bold text-neutral-900 dark:text-white">{stats.totalBookings}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-sm border border-neutral-100 dark:border-neutral-700">
          <div className="flex items-center gap-3">
            <Wrench className="w-8 h-8 text-orange-600" />
            <div>
              <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Techniker</p>
              <p className="text-2xl font-bold text-neutral-900 dark:text-white">{stats.totalTechnicians}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Services Table */}
      <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-100 dark:border-neutral-700 overflow-hidden">
        {services.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50 dark:bg-neutral-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-300 uppercase tracking-wider">
                    Dienstleistung
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-300 uppercase tracking-wider">
                    Kategorie
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-300 uppercase tracking-wider">
                    Preis
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-300 uppercase tracking-wider">
                    Flags
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-300 uppercase tracking-wider">
                    Aktionen
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-neutral-800 divide-y divide-neutral-200 dark:divide-neutral-700">
                {services.map((service) => (
                  <tr key={service.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-700">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-neutral-900 dark:text-white">
                          {service.name}
                        </div>
                        <div className="text-xs text-neutral-500 dark:text-neutral-400 font-mono">
                          /{service.slug}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-neutral-700 dark:text-neutral-300">
                        {service.category ? CATEGORY_LABELS[service.category as keyof typeof CATEGORY_LABELS] || service.category : '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-neutral-900 dark:text-white">
                        {formatPrice(service.price_cents)}
                      </div>
                      <div className="text-xs text-neutral-500 dark:text-neutral-400">
                        {formatDuration(service.duration_minutes)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${
                          service.is_active
                            ? 'bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300'
                            : 'bg-neutral-100 text-neutral-800 dark:bg-neutral-900/30 dark:text-neutral-300'
                        }`}>
                          {service.is_active ? 'Aktiv' : 'Inaktiv'}
                        </span>
                        {service.is_featured && (
                          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 text-xs font-semibold rounded-full bg-warning-100 text-warning-800 dark:bg-warning-900/30 dark:text-warning-300">
                            <Star className="w-3 h-3" />
                          </span>
                        )}
                        {service.is_bookable && (
                          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 text-xs font-semibold rounded-full bg-info-100 text-info-800 dark:bg-info-900/30 dark:text-info-300">
                            <Calendar className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        {service.is_featured && (
                          <Link
                            href={`/services/${service.slug}`}
                            target="_blank"
                            className="p-2.5 text-info-600 hover:text-info-900 dark:text-info-400 dark:hover:text-info-300 hover:bg-info-50 dark:hover:bg-info-900/20 rounded"
                            title="Auf Website ansehen"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                        )}
                        <Link
                          href={`/admin/services/${service.id}/edit`}
                          className="p-2.5 text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded"
                          title="Bearbeiten"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <Wrench className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-neutral-900 dark:text-white mb-2">
              Noch keine Dienstleistungen
            </h3>
            <p className="text-neutral-600 dark:text-neutral-400 mb-6">
              Erstellen Sie Ihre erste Dienstleistung, um Service-Termine anzubieten.
            </p>
            <Link
              href="/admin/services/new"
              className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5" />
              Erste Dienstleistung erstellen
            </Link>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-info-50 dark:bg-info-900/20 border border-info-200 dark:border-info-800 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-info-100 dark:bg-info-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
            <Wrench className="w-5 h-5 text-info-600" />
          </div>
          <div>
            <h3 className="font-medium text-info-900 dark:text-info-200">
              Dienstleistungs-Verwaltung
            </h3>
            <p className="text-sm text-info-700 dark:text-info-300 mt-1 mb-3">
              Dienstleistungen sind die Kernkompetenz von RevampIT. Bieten Sie Reparaturen, Installationen,
              Beratungen und andere technische Services an. Kunden können online Termine buchen.
            </p>
            <div className="flex gap-3">
              <Link
                href="/admin/services/new"
                className="text-sm bg-info-600 text-white px-3 py-1.5 rounded hover:bg-info-700 transition-colors"
              >
                Dienstleistung erstellen
              </Link>
            </div>
          </div>
        </div>
      </div>
    </AdminPageWrapper>
  )
}
