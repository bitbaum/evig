'use client'

/**
 * Task Actions Client Component
 *
 * Handles task actions: complete, flag for attention, request help.
 * Created: 2026-02-05
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  CheckCircle2,
  AlertTriangle,
  Send,
  Loader2,
  Archive,
} from 'lucide-react'
import { apiFetch } from '@/lib/api/client'
import { getErrorMessage } from '@/lib/utils/error'

interface TaskActionsClientProps {
  taskId: string
  taskTitle: string
  isArchived?: boolean
}

export default function TaskActionsClient({
  taskId,
  taskTitle,
  isArchived = false,
}: TaskActionsClientProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [showCompleteForm, setShowCompleteForm] = useState(false)
  const [showAttentionForm, setShowAttentionForm] = useState(false)
  const [showRequestForm, setShowRequestForm] = useState(false)
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false)
  const [notes, setNotes] = useState('')
  const [duration, setDuration] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [staffMembers, setStaffMembers] = useState<{ id: string; name: string | null; email: string }[]>([])
  const [selectedUserId, setSelectedUserId] = useState<string>('')

  useEffect(() => {
    apiFetch<{ profiles: { user_id: string; name: string | null; email: string }[] }>('/api/admin/team/profiles')
      .then(res => {
        if (res.success && res.data?.profiles) {
          setStaffMembers(res.data.profiles.map(p => ({ id: p.user_id, name: p.name, email: p.email })))
        }
      })
  }, [])

  const handleComplete = async () => {
    setLoading('complete')
    setError(null)

    try {
      const result = await apiFetch<void>(`/api/tasks/${taskId}/complete`, {
        method: 'POST',
        body: {
          notes: notes || null,
          duration_minutes: duration ? parseInt(duration, 10) : null,
        },
      })

      if (!result.success) {
        throw new Error(result.error || 'Fehler beim Erledigen')
      }

      setShowCompleteForm(false)
      setNotes('')
      setDuration('')
      router.refresh()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(null)
    }
  }

  const handleFlagAttention = async () => {
    setLoading('attention')
    setError(null)

    try {
      const result = await apiFetch<void>(`/api/tasks/${taskId}/attention`, {
        method: 'POST',
        body: {
          message: message || null,
        },
      })

      if (!result.success) {
        throw new Error(result.error || 'Fehler beim Markieren')
      }

      setShowAttentionForm(false)
      setMessage('')
      router.refresh()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(null)
    }
  }

  const handleRequest = async () => {
    setLoading('request')
    setError(null)

    try {
      const result = await apiFetch<void>(`/api/tasks/${taskId}/request`, {
        method: 'POST',
        body: {
          requested_user_id: selectedUserId || null,
          message: message || null,
        },
      })

      if (!result.success) {
        throw new Error(result.error || 'Fehler beim Anfragen')
      }

      setShowRequestForm(false)
      setMessage('')
      router.refresh()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(null)
    }
  }

  const handleArchive = async () => {
    setLoading('archive')
    setError(null)

    try {
      const result = await apiFetch<void>(`/api/tasks/${taskId}`, {
        method: 'DELETE',
      })

      if (!result.success) {
        throw new Error(result.error || 'Fehler beim Archivieren')
      }

      router.push('/admin/tasks')
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="bg-white rounded-lg border p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Aktionen</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        {/* Complete Button */}
        <button
          onClick={() => setShowCompleteForm(!showCompleteForm)}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <CheckCircle2 className="w-4 h-4" />
          Als erledigt markieren
        </button>

        {/* Flag for Attention Button */}
        <button
          onClick={() => setShowAttentionForm(!showAttentionForm)}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          <AlertTriangle className="w-4 h-4" />
          Aufmerksamkeit nötig
        </button>

        {/* Request Help Button */}
        <button
          onClick={() => setShowRequestForm(!showRequestForm)}
          className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
        >
          <Send className="w-4 h-4" />
          Um Hilfe bitten
        </button>
      </div>

      {/* Complete Form */}
      {showCompleteForm && (
        <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
          <h3 className="font-medium text-green-800 mb-3">
            Aufgabe als erledigt markieren
          </h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dauer (Minuten)
              </label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="z.B. 30"
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notizen (optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Anmerkungen zur Erledigung..."
                rows={3}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleComplete}
                disabled={loading === 'complete'}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {loading === 'complete' && (
                  <Loader2 className="w-4 h-4 animate-spin" />
                )}
                Bestätigen
              </button>
              <button
                onClick={() => setShowCompleteForm(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-900"
              >
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Attention Form */}
      {showAttentionForm && (
        <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-200">
          <h3 className="font-medium text-red-800 mb-3">
            Aufgabe braucht Aufmerksamkeit
          </h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nachricht (optional)
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Was ist das Problem?"
                rows={3}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleFlagAttention}
                disabled={loading === 'attention'}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {loading === 'attention' && (
                  <Loader2 className="w-4 h-4 animate-spin" />
                )}
                Markieren
              </button>
              <button
                onClick={() => setShowAttentionForm(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-900"
              >
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Request Form */}
      {showRequestForm && (
        <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <h3 className="font-medium text-yellow-800 mb-3">Um Hilfe bitten</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                An wen?
              </label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
              >
                <option value="">Alle Teammitglieder</option>
                {staffMembers.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name || member.email}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nachricht (optional)
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Was wird benötigt?"
                rows={3}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleRequest}
                disabled={loading === 'request'}
                className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50"
              >
                {loading === 'request' && (
                  <Loader2 className="w-4 h-4 animate-spin" />
                )}
                {selectedUserId ? 'Anfrage senden' : 'An alle senden'}
              </button>
              <button
                onClick={() => setShowRequestForm(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-900"
              >
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Archive Section */}
      {!isArchived && (
        <div className="mt-6 pt-4 border-t">
          {!showArchiveConfirm ? (
            <button
              onClick={() => setShowArchiveConfirm(true)}
              className="flex items-center gap-2 px-4 py-2 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
            >
              <Archive className="w-4 h-4" />
              Aufgabe archivieren
            </button>
          ) : (
            <div className="p-4 bg-red-50 rounded-lg border border-red-200">
              <p className="text-sm text-red-700 mb-3">
                Aufgabe &ldquo;{taskTitle}&rdquo; wirklich archivieren? Sie wird aus der Liste entfernt.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleArchive}
                  disabled={loading === 'archive'}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {loading === 'archive' && (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  )}
                  Archivieren
                </button>
                <button
                  onClick={() => setShowArchiveConfirm(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-900"
                >
                  Abbrechen
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
