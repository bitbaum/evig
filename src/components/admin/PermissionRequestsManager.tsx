'use client'

import { useState, useEffect } from 'react'
import { Shield, Check, X, Clock, User, RefreshCw } from 'lucide-react'
import Heading from '@/components/admin/AdminHeading'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
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

  // Fetch on mount. setState happens inside fetchRequests via setItems/setError —
  // legitimate "subscribe for updates from external system" pattern.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchRequests() }, [])

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
      <div className="p-6 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-white/[0.06]">
        <div className="animate-pulse">
          <div className="h-6 bg-neutral-200 dark:bg-neutral-700 rounded w-1/3 mb-4" />
          <div className="space-y-3">
            <div className="h-16 bg-neutral-200 dark:bg-neutral-700 rounded" />
            <div className="h-16 bg-neutral-200 dark:bg-neutral-700 rounded" />
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 bg-error-50 dark:bg-error-900/20 rounded-xl border border-error-200 dark:border-error-800">
        <p className="text-error-700 dark:text-error-300">{error}</p>
        <button
          onClick={fetchRequests}
          className="mt-2 text-sm text-error-600 hover:text-error-700 flex items-center gap-1"
        >
          <RefreshCw className="w-4 h-4" />
          Erneut versuchen
        </button>
      </div>
    )
  }

  if (requests.length === 0) {
    return (
      <div className="p-6 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-white/[0.06]">
        <div className="flex items-center gap-3 text-neutral-500 dark:text-neutral-400">
          <Shield className="w-5 h-5" />
          <span>Keine ausstehenden Berechtigungsanfragen</span>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-white/[0.06]">
      <div className="p-4 border-b border-neutral-200 dark:border-white/[0.06] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-secondary-500" />
          <Heading level={3} className="font-semibold text-neutral-900 dark:text-white">
            Berechtigungsanfragen ({requests.length})
          </Heading>
        </div>
        <button
          onClick={fetchRequests}
          className="text-neutral-500 hover:text-neutral-600"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="divide-y divide-neutral-200 dark:divide-white/[0.04]">
        {requests.map(request => (
          <div key={request.id} className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <User className="w-4 h-4 text-neutral-400" />
                  <span className="font-medium text-neutral-900 dark:text-white">
                    {request.user_name || request.user_email}
                  </span>
                  <span className="text-sm text-neutral-500">
                    {request.user_email}
                  </span>
                </div>

                <div className="flex flex-wrap gap-1 mb-2">
                  {request.requested_sections.map(section => (
                    <span
                      key={section}
                      className="px-2 py-0.5 bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 text-xs rounded"
                    >
                      {getSectionLabel(section)}
                    </span>
                  ))}
                </div>

                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  {request.reason}
                </p>

                <div className="flex items-center gap-2 mt-2 text-xs text-neutral-400">
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
              <div className="mt-3 p-3 bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-lg">
                <label htmlFor={`rejection-notes-${request.id}`} className="block text-sm font-medium text-error-800 dark:text-error-300 mb-1">
                  Grund für Ablehnung (optional):
                </label>
                <Textarea
                  id={`rejection-notes-${request.id}`}
                  value={rejectionNotes}
                  onChange={(e) => setRejectionNotes(e.target.value)}
                  placeholder="Optionaler Ablehnungsgrund..."
                  rows={2}
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
