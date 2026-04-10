'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, XCircle } from 'lucide-react'

interface MembershipActionsProps {
  applicationId: string
  applicantName: string
}

export function MembershipActions({ applicationId, applicantName }: MembershipActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<'approve' | 'reject' | null>(null)
  const [rejectNotes, setRejectNotes] = useState('')
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleApprove() {
    if (!confirm(`Mitgliedschaftsantrag von "${applicantName}" genehmigen?`)) return
    setLoading('approve')
    setError(null)
    try {
      const res = await fetch(`/api/admin/membership/${applicationId}/approve`, {
        method: 'POST',
      })
      const json = await res.json()
      if (!json.success) {
        setError(json.error || 'Fehler beim Genehmigen')
      } else {
        router.refresh()
      }
    } catch {
      setError('Netzwerkfehler')
    } finally {
      setLoading(null)
    }
  }

  async function handleReject() {
    setLoading('reject')
    setError(null)
    try {
      const res = await fetch(`/api/admin/membership/${applicationId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admin_notes: rejectNotes }),
      })
      const json = await res.json()
      if (!json.success) {
        setError(json.error || 'Fehler beim Ablehnen')
      } else {
        setShowRejectForm(false)
        router.refresh()
      }
    } catch {
      setError('Netzwerkfehler')
    } finally {
      setLoading(null)
    }
  }

  if (showRejectForm) {
    return (
      <div className="space-y-2 w-64">
        <textarea
          value={rejectNotes}
          onChange={e => setRejectNotes(e.target.value)}
          placeholder="Ablehnungsgrund (optional)..."
          rows={3}
          className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-red-500"
        />
        {error && <p className="text-xs text-red-600">{error}</p>}
        <div className="flex gap-2">
          <button
            onClick={handleReject}
            disabled={loading === 'reject'}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            <XCircle className="w-4 h-4" />
            {loading === 'reject' ? 'Wird abgelehnt...' : 'Ablehnen'}
          </button>
          <button
            onClick={() => { setShowRejectForm(false); setError(null) }}
            className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            Abbrechen
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {error && <p className="text-xs text-red-600">{error}</p>}
      <button
        onClick={handleApprove}
        disabled={!!loading}
        className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
      >
        <CheckCircle className="w-4 h-4" />
        {loading === 'approve' ? 'Wird genehmigt...' : 'Annehmen'}
      </button>
      <button
        onClick={() => setShowRejectForm(true)}
        disabled={!!loading}
        className="flex items-center gap-1.5 px-4 py-2 bg-white dark:bg-gray-700 text-red-600 dark:text-red-400 border border-red-300 dark:border-red-700 text-sm font-medium rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 transition-colors"
      >
        <XCircle className="w-4 h-4" />
        Ablehnen
      </button>
    </div>
  )
}
