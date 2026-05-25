'use client'

import { useTransition } from 'react'
import { Check, Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import {
  approveBlogSubmissionAction,
  verifyListingAction,
  approveRepairerApplicationAction,
} from '@/lib/admin/actions'

interface InlineActionButtonProps {
  itemId: string
  actionType: 'approve_blog' | 'verify_listing' | 'approve_repairer'
}

const ACTION_FNS = {
  approve_blog: approveBlogSubmissionAction,
  verify_listing: verifyListingAction,
  approve_repairer: approveRepairerApplicationAction,
} as const

export function InlineActionButton({ itemId, actionType }: InlineActionButtonProps) {
  const [isPending, startTransition] = useTransition()
  const t = useTranslations('admin.approvals')

  const labels = {
    approve_blog: t('approve'),
    verify_listing: t('release'),
    approve_repairer: t('accept'),
  }

  const label = labels[actionType]
  const fn = ACTION_FNS[actionType]

  return (
    <button
      onClick={(e) => {
        e.preventDefault() // don't follow the parent link
        startTransition(() => fn(itemId))
      }}
      disabled={isPending}
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white transition-colors min-h-[28px] flex-shrink-0"
      aria-label={`${label} (erstes Element in dieser Kategorie)`}
    >
      {isPending ? (
        <Loader2 className="w-3 h-3 animate-spin" aria-hidden="true" />
      ) : (
        <Check className="w-3 h-3" aria-hidden="true" />
      )}
      {label}
    </button>
  )
}
