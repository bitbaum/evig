/**
 * Admin Services Page - Server Component
 *
 * Shows service types from the database with full CRUD functionality.
 */

import { Metadata } from 'next'
import { adminInteractive, adminTable } from '@/lib/admin-ui'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { buttonClass } from '@/components/ui/button-class'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { query } from '@/lib/auth/db'
import { TABLE_NAMES } from '@/config/database'
import { SERVICE_CATEGORY_LABELS } from '@/config/service-categories'
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
import { ROUTES } from '@/config/routes'

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
  const t = await getTranslations('admin.services')
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
      title={t('pageTitle')}
      description={t('pageDescription')}
      icon={Wrench}
      iconColor="green"
      actions={
        <Link href={ROUTES.admin.serviceNew} className={buttonClass({ variant: 'primary' })}>
          <Plus className="w-5 h-5" />
          Dienstleistung erstellen
        </Link>
      }
    >
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-surface-base rounded-xl p-6 shadow-xs border border-subtle">
          <div className="flex items-center gap-3">
            <Wrench className="w-8 h-8 text-action" />
            <div>
              <p className="text-sm font-medium text-text-secondary">Gesamt Services</p>
              <p className="text-2xl font-bold text-text-primary">{stats.totalServices}</p>
            </div>
          </div>
        </div>

        <div className="bg-surface-base rounded-xl p-6 shadow-xs border border-subtle">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-8 h-8 text-action" />
            <div>
              <p className="text-sm font-medium text-text-secondary">Aktiv</p>
              <p className="text-2xl font-bold text-text-primary">{stats.activeServices}</p>
            </div>
          </div>
        </div>

        <div className="bg-surface-base rounded-xl p-6 shadow-xs border border-subtle">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-action" />
            <div>
              <p className="text-sm font-medium text-text-secondary">Buchungen</p>
              <p className="text-2xl font-bold text-text-primary">{stats.totalBookings}</p>
            </div>
          </div>
        </div>

        <div className="bg-surface-base rounded-xl p-6 shadow-xs border border-subtle">
          <div className="flex items-center gap-3">
            <Wrench className="w-8 h-8 text-secondary-600" />
            <div>
              <p className="text-sm font-medium text-text-secondary">Techniker</p>
              <p className="text-2xl font-bold text-text-primary">{stats.totalTechnicians}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Services Table */}
      <div className="bg-surface-base rounded-xl shadow-xs border border-subtle overflow-hidden">
        {services.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface-raised">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">
                    Dienstleistung
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">
                    Kategorie
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">
                    Preis
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">
                    Flags
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">
                    Aktionen
                  </th>
                </tr>
              </thead>
              <tbody className="bg-surface-base divide-y divide-neutral-200 dark:divide-white/4">
                {services.map((service) => (
                  <tr key={service.id} className={adminTable.tr}>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-text-primary">
                          {service.name}
                        </div>
                        <div className="text-xs text-text-tertiary font-mono">
                          /{service.slug}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-text-secondary">
                        {service.category ? SERVICE_CATEGORY_LABELS[service.category as keyof typeof SERVICE_CATEGORY_LABELS] || service.category : '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-text-primary">
                        {formatPrice(service.price_cents)}
                      </div>
                      <div className="text-xs text-text-tertiary">
                        {formatDuration(service.duration_minutes)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${
                          service.is_active
                            ? 'bg-action-muted text-action-muted'
                            : 'bg-surface-raised text-text-primary'
                        }`}>
                          {service.is_active ? 'Aktiv' : 'Inaktiv'}
                        </span>
                        {service.is_featured && (
                          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 text-xs font-semibold rounded-full bg-warning-100 text-warning-800 dark:bg-warning-900/30 dark:text-warning-300">
                            <Star className="w-3 h-3" />
                          </span>
                        )}
                        {service.is_bookable && (
                          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 text-xs font-semibold rounded-full bg-action-muted text-action-muted">
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
                            className={`p-2.5 text-text-secondary hover:text-text-primary ${adminInteractive.rowHover} rounded-sm`}
                            title="Auf Website ansehen"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                        )}
                        <Link
                          href={`/admin/services/${service.id}/edit`}
                          className="p-2.5 text-action hover:text-action hover:bg-action-muted rounded-sm"
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
            <Wrench className="w-12 h-12 text-text-muted mx-auto mb-4" />
            <h3 className="text-lg font-medium text-text-primary mb-2">
              Noch keine Dienstleistungen
            </h3>
            <p className="text-text-secondary mb-6">
              Erstellen Sie Ihre erste Dienstleistung, um Service-Termine anzubieten.
            </p>
            <Link href={ROUTES.admin.serviceNew} className={buttonClass({ variant: 'primary' })}>
              <Plus className="w-5 h-5" />
              Erste Dienstleistung erstellen
            </Link>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-surface-raised border border rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-surface-raised rounded-lg flex items-center justify-center shrink-0">
            <Wrench className="w-5 h-5 text-text-secondary" />
          </div>
          <div>
            <h3 className="font-medium text-text-primary">
              Dienstleistungs-Verwaltung
            </h3>
            <p className="text-sm text-text-secondary mt-1 mb-3">
              Dienstleistungen sind die Kernkompetenz von RevampIT. Bieten Sie Reparaturen, Installationen,
              Beratungen und andere technische Services an. Kunden können online Termine buchen.
            </p>
            <div className="flex gap-3">
              <Link href={ROUTES.admin.serviceNew} className={buttonClass({ variant: 'primary', size: 'sm' })}>
                Dienstleistung erstellen
              </Link>
            </div>
          </div>
        </div>
      </div>
    </AdminPageWrapper>
  )
}
