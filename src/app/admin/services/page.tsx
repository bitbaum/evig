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
import { REPAIRER_PROFILE_TIER } from '@/config/repairer-status'
import {
  Plus,
  Wrench,
  Users,
  CheckCircle,
} from 'lucide-react'
import AdminPageWrapper from '@/components/admin/AdminPageWrapper'
import { ServiceListClient } from './ServiceListClient'
import Heading from '@/components/admin/AdminHeading'

export const metadata: Metadata = {
  title: 'Dienstleistungen verwalten | RevampIT Admin',
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
      `SELECT COUNT(*) as count FROM ${TABLE_NAMES.IT_HILFE_TECHNICIAN_PROFILES} WHERE is_active = true AND profile_tier = '${REPAIRER_PROFILE_TIER.COMMUNITY}'`
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
      description="Erstelle und verwalte die Service-Angebote"
      icon={Wrench}
      iconColor="green"
      actions={
        <Link
          href="/admin/services/new"
          className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          Dienstleistung erstellen
        </Link>
      }
    >
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

      {/* Services Table with Search/Filters */}
      <ServiceListClient services={services} />

      {/* Info Box */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
            <Wrench className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <Heading level={3} className="font-medium text-blue-900 dark:text-blue-200">
              Dienstleistungs-Verwaltung
            </Heading>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
              Dienstleistungen sind die Kernkompetenz von RevampIT. Biete Reparaturen, Installationen,
              Beratungen und andere technische Services an. Kunden können online Termine buchen.
            </p>
          </div>
        </div>
      </div>
    </AdminPageWrapper>
  )
}
