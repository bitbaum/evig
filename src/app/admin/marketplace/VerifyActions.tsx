'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { ShieldCheck, ShieldOff, Loader2 } from 'lucide-react'
import { apiFetch } from '@/lib/api/client'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface VerifyActionsProps {
  listingId: string
  isVerified: boolean
  title: string
}

export function VerifyActions({ listingId, isVerified, title }: VerifyActionsProps) {
  const t = useTranslations('admin.marketplace.listings')
  const tForms = useTranslations('admin.forms')
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
        <Loader2 className="w-4 h-4 animate-spin text-text-tertiary" />
      </div>
    )
  }

  if (isVerified) {
    return (
      <>
        <Button
          variant="destructive-outline"
          size="sm"
          onClick={() => setConfirmUnverify(true)}
          title={t('actions.removeVerification')}
          className="gap-1.5"
        >
          <ShieldOff className="w-4 h-4" />
          <span className="hidden sm:inline">{t('actions.remove')}</span>
        </Button>
        <ConfirmDialog
          isOpen={confirmUnverify}
          title={t('unverifyConfirm.title')}
          message={t('unverifyConfirm.message')}
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
        <Input
          variant="elevated"
          type="text"
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder={t('actions.notePlaceholder')}
          // Inline-row context: compact width + tighter padding override
          // the primitive's `w-full px-3 py-2` defaults. twMerge resolves.
          className="w-40 px-2 py-1.5"
          maxLength={2000}
          onKeyDown={e => { if (e.key === 'Enter') handleVerify() }}
          autoFocus
        />
        <Button onClick={handleVerify} variant="primary" size="sm">
          <ShieldCheck className="w-4 h-4" />
          {t('actions.ok')}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => { setShowNotes(false); setNotes('') }}
          className="px-2 py-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors"
        >
          {tForms('cancel')}
        </Button>
      </div>
    )
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => setShowNotes(true)}
      className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-strong text-action hover:bg-action-muted transition-colors"
      title={t('actions.markVerified')}
    >
      <ShieldCheck className="w-4 h-4" />
      <span className="hidden sm:inline">{t('actions.verify')}</span>
    </Button>
  )
}
