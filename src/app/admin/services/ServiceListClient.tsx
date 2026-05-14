'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  Search,
  Eye,
  Edit,
  Star,
  Calendar,
  Wrench,
} from 'lucide-react'
import { SERVICE_CATEGORY_LABELS } from '@/config/service-categories'
import { formatPriceCents } from '@/config/marketplace'
import Heading from '@/components/admin/AdminHeading'

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

interface ServiceListClientProps {
  services: ServiceType[]
}

function formatDuration(minutes: number | null): string {
  if (minutes === null) return '-'
  if (minutes < 60) return `${minutes} Min.`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (mins === 0) return `${hours} Std.`
  return `${hours} Std. ${mins} Min.`
}

const categoryOptions = Object.entries(SERVICE_CATEGORY_LABELS) as [string, string][]

export function ServiceListClient({ services }: ServiceListClientProps) {
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState<'' | 'active' | 'inactive'>('')

  const filtered = useMemo(() => {
    return services.filter(s => {
      if (search.trim() && !s.name.toLowerCase().includes(search.toLowerCase())) return false
      if (categoryFilter && s.category !== categoryFilter) return false
      if (statusFilter === 'active' && !s.is_active) return false
      if (statusFilter === 'inactive' && s.is_active) return false
      return true
    })
  }, [services, search, categoryFilter, statusFilter])

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-100 dark:border-neutral-700 overflow-hidden">
      {/* Filters */}
      <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-700">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <input
              type="text"
              placeholder="Dienstleistung suchen..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border rounded-lg dark:bg-neutral-800 dark:border-neutral-600 focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="px-3 py-2 text-sm border rounded-lg dark:bg-neutral-800 dark:border-neutral-600"
          >
            <option value="">Alle Kategorien</option>
            {categoryOptions.map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as '' | 'active' | 'inactive')}
            className="px-3 py-2 text-sm border rounded-lg dark:bg-neutral-800 dark:border-neutral-600"
          >
            <option value="">Alle Status</option>
            <option value="active">Aktiv</option>
            <option value="inactive">Inaktiv</option>
          </select>
        </div>
      </div>

      {filtered.length > 0 ? (
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
              {filtered.map((service) => (
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
                      {service.category ? SERVICE_CATEGORY_LABELS[service.category as keyof typeof SERVICE_CATEGORY_LABELS] || service.category : '-'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-neutral-900 dark:text-white">
                      {formatPriceCents(service.price_cents)}
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
          <Heading level={3} className="text-lg font-medium text-neutral-900 dark:text-white mb-2">
            {search.trim() || categoryFilter || statusFilter
              ? 'Keine Ergebnisse'
              : 'Noch keine Dienstleistungen'}
          </Heading>
          <p className="text-neutral-600 dark:text-neutral-400">
            {search.trim() || categoryFilter || statusFilter
              ? 'Versuche andere Suchkriterien.'
              : 'Erstelle Ihre erste Dienstleistung, um Service-Termine anzubieten.'}
          </p>
        </div>
      )}
    </div>
  )
}
