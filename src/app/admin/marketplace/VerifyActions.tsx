'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ShieldCheck, ShieldOff, Loader2 } from 'lucide-react'

interface VerifyActionsProps {
  listingId: string
  isVerified: boolean
  title: string
}

export function VerifyActions({ listingId, isVerified, title }: VerifyActionsProps) {
  const [loading, setLoading] = useState(false)
  const [showNotes, setShowNotes] = useState(false)
  const [notes, setNotes] = useState('')
  const router = useRouter()

  async function handleVerify() {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/listings/${listingId}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verification_notes: notes || undefined }),
      })
      if (res.ok) {
        setShowNotes(false)
        setNotes('')
        router.refresh()
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleUnverify() {
    if (!confirm(`Verifizierung von "${title}" entfernen?`)) return
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/listings/${listingId}/verify`, {
        method: 'DELETE',
      })
      if (res.ok) {
        router.refresh()
      }
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2">
        <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
      </div>
    )
  }

  if (isVerified) {
    return (
      <button
        onClick={handleUnverify}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
        title="Verifizierung entfernen"
      >
        <ShieldOff className="w-4 h-4" />
        <span className="hidden sm:inline">Entfernen</span>
      </button>
    )
  }

  if (showNotes) {
    return (
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Notiz (optional)"
          className="w-40 px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
          maxLength={2000}
          onKeyDown={e => { if (e.key === 'Enter') handleVerify() }}
          autoFocus
        />
        <button
          onClick={handleVerify}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors"
        >
          <ShieldCheck className="w-4 h-4" />
          OK
        </button>
        <button
          onClick={() => { setShowNotes(false); setNotes('') }}
          className="px-2 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          Abbrechen
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setShowNotes(true)}
      className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
      title="Als geprüft markieren"
    >
      <ShieldCheck className="w-4 h-4" />
      <span className="hidden sm:inline">Verifizieren</span>
    </button>
  )
}
