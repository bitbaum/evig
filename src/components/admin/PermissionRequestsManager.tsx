'use client'

import { useState, useEffect } from 'react'
import { Shield, Check, X, Clock, User, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { apiFetch } from '@/lib/api/client'
import { getSection } from '@/config/sections'
import { formatDateTimeNumeric } from '@/lib/date-formats'

interface PermissionRequest {
  id: string
  user_id: string
  user_name: string | null
  user_email: string
  requested_sections: string[]
  reason: string
  status: string
  created_at: string
}

function getSectionLabel(id: string): string {
  return getSection(id)?.ui.label ?? id
}

export function PermissionRequestsManager() {
  const [requests, setRequests] = useState<PermissionRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [rejectionNotes, setRejectionNotes] = useState('')

  const fetchRequests = async () => {
    try {
      setLoading(true)
      const result = await apiFetch<{ requests: PermissionRequest[] }>('/api/admin/permissions/requests?status=pending')

      if (!result.success) {
        throw new Error(result.error || 'Fehler beim Laden')
      }

      setRequests(result.data?.requests || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRequests()
  }, [])

  const handleApprove = async (requestId: string) => {
    setProcessingId(requestId)
    try {
      const result = await apiFetch<{ message: string }>(`/api/admin/permissions/requests/${requestId}`, {
        method: 'POST',
        body: { action: 'approve', notes: null },
      })
      if (!result.success) {
        throw new Error(result.error || 'Fehler bei der Verarbeitung')
      }
      setRequests(prev => prev.filter(r => r.id !== requestId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler')
    } finally {
      setProcessingId(null)
    }
  }

  const handleReject = async (requestId: string) => {
    setProcessingId(requestId)
    try {
      const result = await apiFetch<{ message: string }>(`/api/admin/permissions/requests/${requestId}`, {
        method: 'POST',
        body: { action: 'reject', notes: rejectionNotes || null },
      })
      if (!result.success) {
        throw new Error(result.error || 'Fehler bei der Verarbeitung')
      }
      setRejectingId(null)
      setRejectionNotes('')
      setRequests(prev => prev.filter(r => r.id !== requestId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler')
    } finally {
      setProcessingId(null)
    }
  }

  if (loading) {
    return (
      <div className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4" />
          <div className="space-y-3">
            <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded" />
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
        <p className="text-red-700 dark:text-red-300">{error}</p>
        <button
          onClick={fetchRequests}
          className="mt-2 text-sm text-red-600 hover:text-red-700 flex items-center gap-1"
        >
          <RefreshCw className="w-4 h-4" />
          Erneut versuchen
        </button>
      </div>
    )
  }

  if (requests.length === 0) {
    return (
      <div className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
          <Shield className="w-5 h-5" />
          <span>Keine ausstehenden Berechtigungsanfragen</span>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-orange-500" />
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Berechtigungsanfragen ({requests.length})
          </h3>
        </div>
        <button
          onClick={fetchRequests}
          className="text-gray-500 hover:text-gray-600"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {requests.map(request => (
          <div key={request.id} className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="font-medium text-gray-900 dark:text-white">
                    {request.user_name || request.user_email}
                  </span>
                  <span className="text-sm text-gray-500">
                    {request.user_email}
                  </span>
                </div>

                <div className="flex flex-wrap gap-1 mb-2">
                  {request.requested_sections.map(section => (
                    <span
                      key={section}
                      className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded"
                    >
                      {getSectionLabel(section)}
                    </span>
                  ))}
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {request.reason}
                </p>

                <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                  <Clock className="w-3 h-3" />
                  {formatDateTimeNumeric(request.created_at)}
                </div>
              </div>

              <div className="flex gap-2 ml-4">
                <Button
                  onClick={() => handleApprove(request.id)}
                  disabled={processingId === request.id}
                  size="sm"
                  className="gap-1"
                >
                  <Check className="w-4 h-4" />
                  Genehmigen
                </Button>
                <Button
                  onClick={() => { setRejectingId(request.id); setRejectionNotes('') }}
                  disabled={processingId === request.id}
                  variant="destructive"
                  size="sm"
                  className="gap-1"
                >
                  <X className="w-4 h-4" />
                  Ablehnen
                </Button>
              </div>
            </div>

            {rejectingId === request.id && (
              <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <label htmlFor={`rejection-notes-${request.id}`} className="block text-sm font-medium text-red-800 dark:text-red-300 mb-1">
                  Grund für Ablehnung (optional):
                </label>
                <textarea
                  id={`rejection-notes-${request.id}`}
                  value={rejectionNotes}
                  onChange={(e) => setRejectionNotes(e.target.value)}
                  placeholder="Optionaler Ablehnungsgrund..."
                  rows={2}
                  className="w-full px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 text-sm"
                  autoFocus
                />
                <div className="flex gap-2 mt-2">
                  <Button
                    onClick={() => handleReject(request.id)}
                    disabled={processingId === request.id}
                    variant="destructive"
                    size="sm"
                  >
                    Ablehnung bestätigen
                  </Button>
                  <Button
                    onClick={() => { setRejectingId(null); setRejectionNotes('') }}
                    variant="outline"
                    size="sm"
                  >
                    Abbrechen
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
