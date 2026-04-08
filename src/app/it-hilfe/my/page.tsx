'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { logger } from '@/lib/logger'
import { formatDateShort } from '@/lib/date-formats'
import {
  Plus,
  MapPin,
  Clock,
  Users,
  ArrowRight,
  Wrench,
  Heart,
  FileText,
} from 'lucide-react'
import {
  getCategoryById,
  getUrgencyById,
  formatBudget,
  getRequestStatusById,
  REQUEST_STATUSES,
} from '@/config/it-hilfe'
import type { ITHilfeRequest } from '@/components/it-hilfe/detail/types'
import Heading from '@/components/ui/Heading'

export default function MyRequestsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [requests, setRequests] = useState<ITHilfeRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [statusFilter, setStatusFilter] = useState('')

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login?callbackUrl=/it-hilfe/my')
    }
  }, [status, router])

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (statusFilter) params.set('status', statusFilter)

      const response = await fetch(`/api/it-hilfe/my-requests?${params}`)
      const data = await response.json()

      if (data.success) {
        setRequests(data.data.requests)
        setTotal(data.data.total)
      }
    } catch (error) {
      logger.error('Error fetching my requests', { error })
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => {
    if (session?.user) {
      fetchRequests()
    }
  }, [session?.user, fetchRequests])

  if (status === 'loading' || (status === 'authenticated' && loading)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <Heading level={1} className="text-2xl text-gray-900">Meine Reparaturanfragen</Heading>
            <p className="text-gray-600 mt-1">
              Verwalte deine Anfragen und sieh eingegangene Angebote
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/it-hilfe/my/offers"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              <Heart className="w-4 h-4" />
              Meine Angebote
            </Link>
            <Link
              href="/it-hilfe/create"
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Neue Anfrage
            </Link>
          </div>
        </div>

        {/* Status Filter */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setStatusFilter('')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === ''
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Alle ({total})
            </button>
            {REQUEST_STATUSES.map((s) => (
              <button
                key={s.id}
                onClick={() => setStatusFilter(s.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  statusFilter === s.id
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>

        {/* Requests List */}
        {requests.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <Heading level={3} className="text-xl text-gray-900 mb-2">
              {statusFilter ? 'Keine Anfragen mit diesem Status' : 'Noch keine Anfragen'}
            </Heading>
            <p className="text-gray-600 mb-6">
              {statusFilter
                ? 'Versuche einen anderen Filter.'
                : 'Erstelle deine erste Reparaturanfrage und erhalte Hilfe von der Community.'}
            </p>
            {!statusFilter && (
              <Link
                href="/it-hilfe/create"
                className="inline-flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-emerald-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Anfrage erstellen
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((req) => {
              const categoryConfig = getCategoryById(req.categoryId)
              const urgencyConfig = getUrgencyById(req.urgency)
              const statusConfig = getRequestStatusById(req.status)
              const CategoryIcon = categoryConfig?.icon || Wrench

              return (
                <Link
                  key={req.id}
                  href={`/it-hilfe/${req.id}`}
                  className="block bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow group"
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-3 ${categoryConfig?.color || 'bg-gray-500'} rounded-xl`}>
                      <CategoryIcon className="w-6 h-6 text-white" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig?.badgeClass || 'bg-gray-100 text-gray-700'}`}>
                          {statusConfig?.name || req.status}
                        </span>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${urgencyConfig?.badgeClass || 'bg-gray-100 text-gray-700'}`}>
                          {urgencyConfig?.name || req.urgency}
                        </span>
                      </div>

                      <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-emerald-600 transition-colors">
                        {req.title}
                      </h3>

                      <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                        {req.description}
                      </p>

                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          <span>{req.city}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <span className={req.offerCount > 0 ? 'text-emerald-600 font-medium' : ''}>
                            {req.offerCount} {req.offerCount === 1 ? 'Angebot' : 'Angebote'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{formatDateShort(req.createdAt)}</span>
                        </div>
                        <span className="text-emerald-600 font-medium">
                          {formatBudget(req.budgetAmountCents)}
                        </span>
                      </div>
                    </div>

                    <ArrowRight className="w-5 h-5 text-gray-500 group-hover:text-emerald-600 transition-colors" />
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
