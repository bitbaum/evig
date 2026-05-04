'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ShieldCheck, ShieldOff, Loader2 } from 'lucide-react'
import { apiFetch } from '@/lib/api/client'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'

interface VerifyActionsProps {
  listingId: string
  isVerified: boolean
  title: string
}

export function VerifyActions({ listingId, isVerified, title }: VerifyActionsProps) {
  const [loading, setLoading] = useState(false)
  const [showNotes, setShowNotes] = useState(false)
  const [notes, setNotes] = useState('')
  const [confirmUnverify, setConfirmUnverify] = useState(false)
  const router = useRouter()

  async function handleVerify() {
    setLoading(true)
    try {
      const result = await apiFetch<unknown>(`/api/admin/listings/${listingId}/verify`, {
        method: 'POST',
        body: { verification_notes: notes || undefined },
      })
      if (result.success) {
        setShowNotes(false)
        setNotes('')
        router.refresh()
      }
    } finally {
      setLoading(false)
    }
  }

  async function doUnverify() {
    setConfirmUnverify(false)
    setLoading(true)
    try {
      const result = await apiFetch<unknown>(`/api/admin/listings/${listingId}/verify`, {
        method: 'DELETE',
      })
      if (result.success) {
        router.refresh()
      }
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2">
        <Loader2 className="w-4 h-4 animate-spin text-neutral-500" />
      </div>
    )
  }

  if (isVerified) {
    return (
      <>
        <button
          onClick={() => setConfirmUnverify(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-error-200 dark:border-error-800 text-error-700 dark:text-error-300 hover:bg-error-50 dark:hover:bg-error-900/20 transition-colors"
          title="Verifizierung entfernen"
        >
          <ShieldOff className="w-4 h-4" />
          <span className="hidden sm:inline">Entfernen</span>
        </button>
        <ConfirmDialog
          isOpen={confirmUnverify}
          title="Verifizierung entfernen"
          message="Verifizierung wirklich entfernen?"
          itemName={title}
          onConfirm={doUnverify}
          onClose={() => setConfirmUnverify(false)}
        />
      </>
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
          className="w-40 px-2 py-1.5 text-sm border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          maxLength={2000}
          onKeyDown={e => { if (e.key === 'Enter') handleVerify() }}
          autoFocus
        />
        <button
          onClick={handleVerify}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors"
        >
          <ShieldCheck className="w-4 h-4" />
          OK
        </button>
        <button
          onClick={() => { setShowNotes(false); setNotes('') }}
          className="px-2 py-1.5 text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
        >
          Abbrechen
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setShowNotes(true)}
      className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-primary-200 dark:border-primary-800 text-primary-700 dark:text-primary-300 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
      title="Als geprüft markieren"
    >
      <ShieldCheck className="w-4 h-4" />
      <span className="hidden sm:inline">Verifizieren</span>
    </button>
  )
}
