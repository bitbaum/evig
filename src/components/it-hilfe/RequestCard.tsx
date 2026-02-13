/**
 * RequestCard Component
 *
 * Reusable card component for IT-Hilfe requests.
 * Eliminates duplicated code across IT-Hilfe pages.
 */

import Link from 'next/link'
import { Wrench, MapPin, Users } from 'lucide-react'
import { getCategoryById, getUrgencyById, formatBudget, IT_HILFE } from '@/config/it-hilfe'
import { formatDateShort } from '@/lib/date-formats'

export interface RequestCardData {
  id: string
  requesterId: string
  requesterName: string
  categoryId: string
  deviceBrand: string | null
  deviceModel: string | null
  title: string
  description: string
  urgency: string
  budgetType: string
  budgetAmountCents: number | null
  postalCode: string
  city: string
  canton: string
  serviceType: string
  skillsNeeded: string[]
  imageUrls: string[]
  status: string
  offerCount: number
  expiresAt: string
  createdAt: string
}

interface RequestCardProps {
  request: RequestCardData
  className?: string
}

export function RequestCard({ request, className = '' }: RequestCardProps) {
  const categoryConfig = getCategoryById(request.categoryId)
  const urgencyConfig = getUrgencyById(request.urgency)
  const CategoryIcon = categoryConfig?.icon || Wrench

  return (
    <Link
      href={IT_HILFE.routes.detail(request.id)}
      className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow group ${className}`}
    >
      {/* Card Header */}
      <div className="p-5 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-start justify-between mb-3">
          <div className={`p-2.5 ${categoryConfig?.color || 'bg-gray-500'} rounded-lg`}>
            <CategoryIcon className="w-5 h-5 text-white" />
          </div>
          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${urgencyConfig?.badgeClass || 'bg-gray-100 text-gray-700'}`}>
            {urgencyConfig?.name || request.urgency}
          </span>
        </div>

        <h3 className="font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-emerald-600 transition-colors line-clamp-2">
          {request.title}
        </h3>

        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
          {request.description}
        </p>

        {/* Device info */}
        {(request.deviceBrand || request.deviceModel) && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
            {[request.deviceBrand, request.deviceModel].filter(Boolean).join(' ')}
          </p>
        )}

        {/* Meta info */}
        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            <span>{request.city}</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            <span>{request.offerCount} {request.offerCount === 1 ? 'Angebot' : 'Angebote'}</span>
          </div>
        </div>
      </div>

      {/* Card Footer */}
      <div className="px-5 py-3 bg-gray-50 dark:bg-gray-800 flex items-center justify-between">
        <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
          {formatBudget(request.budgetAmountCents)}
        </span>
        <span className="text-xs text-gray-400">
          {formatDateShort(request.createdAt)}
        </span>
      </div>
    </Link>
  )
}

/**
 * RequestCardGrid - Grid container for request cards
 */
interface RequestCardGridProps {
  children: React.ReactNode
  className?: string
}

export function RequestCardGrid({ children, className = '' }: RequestCardGridProps) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}>
      {children}
    </div>
  )
}
