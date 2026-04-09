'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { logger } from '@/lib/logger'
import { HelpCircle, MapPin, Clock, AlertTriangle } from 'lucide-react'
import { getCategoryById, getUrgencyById } from '@/config/it-hilfe'
import { formatDateShort } from '@/lib/date-formats'
import Heading from '@/components/ui/Heading'

interface MatchingRequest {
  id: string
  title: string
  categoryId: string
  deviceBrand: string | null
  deviceModel: string | null
  urgency: string
  budgetType: string
  city: string
  canton: string
  serviceType: string
  skillsNeeded: string[] | null
  status: string
  offerCount: number
  createdAt: string
  requesterName: string | null
}

interface MatchingRequestsTabProps {
  repairerId: string
}

export function MatchingRequestsTab({ repairerId }: MatchingRequestsTabProps) {
  const [requests, setRequests] = useState<MatchingRequest[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/repairers/${repairerId}/matching-requests?limit=6`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setRequests(data.data.requests)
        }
      })
      .catch(err => logger.error('Error fetching matching requests', { error: err }))
      .finally(() => setLoading(false))
  }, [repairerId])

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="animate-pulse bg-gray-100 rounded-lg h-24" />
        ))}
      </div>
    )
  }

  if (requests.length === 0) {
    return (
      <div className="text-center py-8">
        <HelpCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-600 font-medium">Keine passenden Anfragen</p>
        <p className="text-sm text-gray-500 mt-1">
          Aktuell gibt es keine offenen IT-Hilfe-Anfragen, die zu diesem Reparateur passen.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-500 mb-4">
        Offene IT-Hilfe-Anfragen, die zu den angebotenen Services passen.
      </p>
      {requests.map(request => {
        const category = getCategoryById(request.categoryId)
        const urgency = getUrgencyById(request.urgency)
        const isUrgent = request.urgency === 'high' || request.urgency === 'urgent'

        return (
          <Link
            key={request.id}
            href={`/it-hilfe/${request.id}`}
            className="block p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 transition-colors"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <Heading level={4} className="font-medium text-gray-900 truncate">{request.title}</Heading>
                <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-gray-500">
                  {category && (
                    <span className="bg-gray-100 px-2 py-0.5 rounded text-xs">
                      {category.name}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {request.city}
                  </span>
                  {request.offerCount > 0 && (
                    <span className="text-gray-400">
                      {request.offerCount} {request.offerCount === 1 ? 'Angebot' : 'Angebote'}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                {isUrgent && (
                  <span className="flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                    <AlertTriangle className="w-3 h-3" />
                    {urgency?.name || 'Dringend'}
                  </span>
                )}
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  <Clock className="w-3 h-3" />
                  {formatDateShort(request.createdAt)}
                </span>
              </div>
            </div>
          </Link>
        )
      })}
      <Link
        href="/it-hilfe"
        className="block text-center text-sm text-blue-600 hover:text-blue-700 font-medium pt-2"
      >
        Alle IT-Hilfe-Anfragen ansehen →
      </Link>
    </div>
  )
}
