'use client'

import { useTransition } from 'react'
import { Check, Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import {
  approveBlogSubmissionAction,
  verifyListingAction,
} from '@/lib/admin/actions'

interface InlineActionButtonProps {
  itemId: string
  actionType: 'approve_blog' | 'verify_listing'
}

const ACTION_FNS = {
  approve_blog: approveBlogSubmissionAction,
  verify_listing: verifyListingAction,
} as const

export function InlineActionButton({ itemId, actionType }: InlineActionButtonProps) {
  const [isPending, startTransition] = useTransition()
  const t = useTranslations('admin.approvals')

  const labels = {
    approve_blog: t('approve'),
    verify_listing: t('release'),
  }

  const label = labels[actionType]
  const fn = ACTION_FNS[actionType]

  return (
    <Button
      variant="primary"
      size="sm"
      onClick={(e) => {
        e.preventDefault() // don't follow the parent link
        startTransition(() => fn(itemId))
      }}
      disabled={isPending}
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold min-h-[28px] h-auto shrink-0"
      aria-label={`${label} (erstes Element in dieser Kategorie)`}
    >
      {isPending ? (
        <Loader2 className="w-3 h-3 animate-spin" aria-hidden="true" />
      ) : (
        <Check className="w-3 h-3" aria-hidden="true" />
      )}
      {label}
    </Button>
  )
}
