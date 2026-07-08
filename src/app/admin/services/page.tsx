/**
 * Admin Services Page - Server Component
 *
 * Shows service types from the database with full CRUD functionality.
 */

import { Metadata } from 'next'
import { adminInteractive } from '@/lib/admin-ui'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
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
import { AdminStatsGrid, type StatCardItem } from '@/components/admin/AdminStatsGrid'
import { AdminTable, type AdminTableColumn } from '@/components/admin/AdminTable'
import { AdminButton } from '@/components/admin/AdminButton'
import { ADMIN_CONTENT } from '@/config/admin-content'
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

  const createAction = (
    <AdminButton href={ROUTES.admin.serviceNew} variant="primary" className="gap-2">
      <Plus className="w-4 h-4" />
      Dienstleistung erstellen
    </AdminButton>
  )

  // No services at all → single empty state, no dead stats grid.
  if (services.length === 0) {
    return (
      <AdminPageWrapper title={t('pageTitle')} description={t('pageDescription')} icon={Wrench} iconColor="green">
        <div className="rounded-lg border border-default bg-surface-base p-12 text-center">
          <Wrench className="w-12 h-12 text-text-muted mx-auto mb-4" />
          <p className="font-medium text-text-primary">{ADMIN_CONTENT.services.emptyTitle}</p>
          <p className="text-text-secondary mt-1 mb-6">{ADMIN_CONTENT.services.emptyDescription}</p>
          {createAction}
        </div>
      </AdminPageWrapper>
    )
  }

  const statCards: StatCardItem[] = [
    { icon: Wrench, color: 'gray', label: 'Gesamt Services', value: stats.totalServices },
    { icon: CheckCircle, color: 'green', label: 'Aktiv', value: stats.activeServices },
    { icon: Users, color: 'gray', label: 'Buchungen', value: stats.totalBookings },
    { icon: Wrench, color: 'gray', label: 'Techniker', value: stats.totalTechnicians },
  ]

  const columns: AdminTableColumn<ServiceType>[] = [
    {
      header: 'Dienstleistung',
      cell: (s) => (
        <div>
          <div className="text-sm font-medium text-text-primary">{s.name}</div>
          <div className="text-xs text-text-tertiary font-mono">/{s.slug}</div>
        </div>
      ),
    },
    {
      header: 'Kategorie',
      className: 'whitespace-nowrap',
      cell: (s) => (
        <span className="text-text-secondary">
          {s.category ? SERVICE_CATEGORY_LABELS[s.category as keyof typeof SERVICE_CATEGORY_LABELS] || s.category : '-'}
        </span>
      ),
    },
    {
      header: 'Preis',
      className: 'whitespace-nowrap',
      cell: (s) => (
        <div>
          <div className="text-sm font-medium text-text-primary">{formatPrice(s.price_cents)}</div>
          <div className="text-xs text-text-tertiary">{formatDuration(s.duration_minutes)}</div>
        </div>
      ),
    },
    {
      header: 'Flags',
      cell: (s) => (
        <div className="flex items-center gap-1.5">
          <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${
            s.is_active ? 'bg-action-muted text-action' : 'bg-surface-raised text-text-primary'
          }`}>
            {s.is_active ? 'Aktiv' : 'Inaktiv'}
          </span>
          {s.is_featured && (
            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 text-xs font-semibold rounded-full bg-warning-100 text-warning-800 dark:bg-warning-900/30 dark:text-warning-300">
              <Star className="w-3 h-3" />
            </span>
          )}
          {s.is_bookable && (
            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 text-xs font-semibold rounded-full bg-action-muted text-action">
              <Calendar className="w-3 h-3" />
            </span>
          )}
        </div>
      ),
    },
    {
      header: 'Aktionen',
      className: 'whitespace-nowrap',
      cell: (s) => (
        <div className="flex items-center gap-2">
          {s.is_featured && (
            <Link
              href={`/services/${s.slug}`}
              target="_blank"
              className={`p-2.5 text-text-secondary hover:text-text-primary ${adminInteractive.rowHover} rounded-sm`}
              title="Auf Website ansehen"
            >
              <Eye className="w-4 h-4" />
            </Link>
          )}
          <Link
            href={`/admin/services/${s.id}/edit`}
            className="p-2.5 text-action hover:text-action hover:bg-action-muted rounded-sm"
            title="Bearbeiten"
          >
            <Edit className="w-4 h-4" />
          </Link>
        </div>
      ),
    },
  ]

  return (
    <AdminPageWrapper
      title={t('pageTitle')}
      description={t('pageDescription')}
      icon={Wrench}
      iconColor="green"
      actions={createAction}
    >
      <AdminStatsGrid items={statCards} />
      <AdminTable columns={columns} rows={services} rowKey={(s) => s.id} />
    </AdminPageWrapper>
  )
}
