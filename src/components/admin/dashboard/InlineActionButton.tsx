'use client'

import { useTransition } from 'react'
import { Check, Loader2 } from 'lucide-react'
import {
  approveBlogSubmissionAction,
  verifyListingAction,
  approveRepairerApplicationAction,
} from '@/app/admin/actions'

interface InlineActionButtonProps {
  itemId: string
  actionType: 'approve_blog' | 'verify_listing' | 'approve_repairer'
}

const ACTION_CONFIG = {
  approve_blog: {
    fn: approveBlogSubmissionAction,
    label: 'Genehmigen',
  },
  verify_listing: {
    fn: verifyListingAction,
    label: 'Freigeben',
  },
  approve_repairer: {
    fn: approveRepairerApplicationAction,
    label: 'Annehmen',
  },
} as const

export function InlineActionButton({ itemId, actionType }: InlineActionButtonProps) {
  const [isPending, startTransition] = useTransition()
  const config = ACTION_CONFIG[actionType]

  return (
    <button
      onClick={(e) => {
        e.preventDefault() // don't follow the parent link
        startTransition(() => config.fn(itemId))
      }}
      disabled={isPending}
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white transition-colors min-h-[28px] flex-shrink-0"
      aria-label={`${config.label} (erstes Element in dieser Kategorie)`}
    >
      {isPending ? (
        <Loader2 className="w-3 h-3 animate-spin" aria-hidden="true" />
      ) : (
        <Check className="w-3 h-3" aria-hidden="true" />
      )}
      {config.label}
    </button>
  )
}
