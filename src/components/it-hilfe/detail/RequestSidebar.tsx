import Link from 'next/link'
import {
  MapPin,
  Clock,
  Calendar,
  User,
  MessageSquare,
  XCircle,
  Wrench,
  Users,
  Pencil,
} from 'lucide-react'
import { formatDate } from '@/lib/date-formats'
import { formatBudget, getServiceTypeById, REQUEST_STATUS } from '@/config/it-hilfe'
import type { ITHilfeRequest } from './types'

function formatTimeRemaining(expiresAt: string): string | null {
  const now = Date.now()
  const expires = new Date(expiresAt).getTime()
  const msLeft = expires - now
  if (msLeft <= 0) return 'Abgelaufen'
  const days = Math.floor(msLeft / (1000 * 60 * 60 * 24))
  const hours = Math.floor((msLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  if (days > 7) return null // don't show for far-off dates
  if (days > 0) return `Noch ${days} ${days === 1 ? 'Tag' : 'Tage'}`
  if (hours > 0) return `Noch ${hours} ${hours === 1 ? 'Stunde' : 'Stunden'}`
  return 'Weniger als 1 Stunde'
}

interface RequestSidebarProps {
  request: ITHilfeRequest
  conversationId: string | null
  hasSession: boolean
  onShowMessages: () => void
  onStatusChange: (status: string) => void
}

export function RequestSidebar({
  request,
  conversationId,
  hasSession,
  onShowMessages,
  onStatusChange,
}: RequestSidebarProps) {
  const serviceConfig = getServiceTypeById(request.serviceType)
  const timeRemaining = formatTimeRemaining(request.expiresAt)

  return (
    <div className="space-y-6">
      {/* Request Info */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">
          Details
        </h3>

        <div className="space-y-4">
          {/* Location */}
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-gray-400 mt-0.5" aria-hidden="true" />
            <div>
              <p className="text-sm text-gray-500">Standort</p>
              <p className="font-medium text-gray-900">
                {request.postalCode} {request.city}
              </p>
              <p className="text-sm text-gray-600">{request.canton}</p>
            </div>
          </div>

          {/* Budget */}
          <div className="flex items-start gap-3">
            <Wrench className="w-5 h-5 text-gray-400 mt-0.5" aria-hidden="true" />
            <div>
              <p className="text-sm text-gray-500">Budget</p>
              <p className="font-medium text-emerald-600">
                {formatBudget(request.budgetAmountCents)}
              </p>
            </div>
          </div>

          {/* Service Type */}
          <div className="flex items-start gap-3">
            <User className="w-5 h-5 text-gray-400 mt-0.5" aria-hidden="true" />
            <div>
              <p className="text-sm text-gray-500">Service-Typ</p>
              <p className="font-medium text-gray-900">
                {serviceConfig?.name || request.serviceType}
              </p>
            </div>
          </div>

          {/* Offers */}
          <div className="flex items-start gap-3">
            <Users className="w-5 h-5 text-gray-400 mt-0.5" aria-hidden="true" />
            <div>
              <p className="text-sm text-gray-500">Angebote</p>
              <p className="font-medium text-gray-900">
                {request.offerCount} {request.offerCount === 1 ? 'Angebot' : 'Angebote'}
              </p>
            </div>
          </div>

          {/* Created */}
          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-gray-400 mt-0.5" aria-hidden="true" />
            <div>
              <p className="text-sm text-gray-500">Erstellt am</p>
              <p className="font-medium text-gray-900">
                {formatDate(request.createdAt)}
              </p>
            </div>
          </div>

          {/* Expires */}
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-gray-400 mt-0.5" aria-hidden="true" />
            <div>
              <p className="text-sm text-gray-500">Läuft ab</p>
              <p className="font-medium text-gray-900">
                {formatDate(request.expiresAt)}
              </p>
              {timeRemaining && (
                <p className={`text-xs mt-0.5 ${timeRemaining === 'Abgelaufen' ? 'text-red-600 font-medium' : 'text-amber-600'}`}>
                  {timeRemaining}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Requester Info */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">
          Anfragender
        </h3>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
            <User className="w-6 h-6 text-gray-500" aria-hidden="true" />
          </div>
          <div>
            <p className="font-medium text-gray-900">{request.requesterName}</p>
            {request.isOwner && request.requesterEmail && (
              <p className="text-sm text-gray-500">{request.requesterEmail}</p>
            )}
          </div>
        </div>
      </div>

      {/* Message Button */}
      {conversationId && hasSession && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <button
            onClick={onShowMessages}
            className="w-full py-3 px-4 min-h-[44px] bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <MessageSquare className="w-4 h-4" aria-hidden="true" />
            Nachricht senden
          </button>
        </div>
      )}

      {/* Owner Actions */}
      {request.isOwner && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">
            Aktionen
          </h3>
          <div className="space-y-2">
            {(request.status === REQUEST_STATUS.OPEN || request.status === REQUEST_STATUS.IN_DISCUSSION) && (
              <Link
                href={`/it-hilfe/${request.id}/edit`}
                className="block w-full py-3 px-4 min-h-[44px] bg-blue-600 text-white rounded-lg text-center font-medium hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <Pencil className="w-4 h-4 inline-block mr-2" />
                Anfrage bearbeiten
              </Link>
            )}
            {(request.status === REQUEST_STATUS.OPEN || request.status === REQUEST_STATUS.IN_DISCUSSION || request.status === REQUEST_STATUS.MATCHED) && (
              <button
                onClick={() => onStatusChange(REQUEST_STATUS.CANCELLED)}
                className="block w-full py-3 px-4 min-h-[44px] bg-red-50 text-red-700 rounded-lg text-center font-medium hover:bg-red-100 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                <XCircle className="w-4 h-4 inline-block mr-2" />
                Anfrage abbrechen
              </button>
            )}
            <Link
              href="/it-hilfe/my"
              className="block w-full py-3 px-4 min-h-[44px] bg-gray-100 text-gray-700 rounded-lg text-center font-medium hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
            >
              Alle meine Anfragen
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
