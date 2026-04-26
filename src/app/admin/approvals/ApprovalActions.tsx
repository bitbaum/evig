'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { apiFetch } from '@/lib/api/client'

interface ApprovalActionsProps {
  submissionId: string
  title: string
}

export function ApprovalActions({ submissionId, title }: ApprovalActionsProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState<'approve' | 'reject' | null>(null)

  const handleAction = async (action: 'approve' | 'reject') => {
    setIsLoading(action)

    const result = await apiFetch<unknown>(`/api/admin/approvals/${submissionId}`, {
      method: 'PATCH',
      body: { action },
    })

    if (!result.success) {
      // Show inline feedback on error
      setIsLoading(null)
      return
    }

    // Refresh the page to reflect the updated status
    router.refresh()
  }

  return (
    <div className="flex gap-2">
      <Button
        onClick={() => handleAction('approve')}
        disabled={isLoading !== null}
        size="sm"
        className="flex items-center gap-1"
      >
        {isLoading === 'approve' ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : (
          <CheckCircle className="w-3 h-3" />
        )}
        Genehmigen
      </Button>
      <Button
        onClick={() => handleAction('reject')}
        disabled={isLoading !== null}
        variant="destructive"
        size="sm"
        className="flex items-center gap-1"
      >
        {isLoading === 'reject' ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : (
          <XCircle className="w-3 h-3" />
        )}
        Ablehnen
      </Button>
    </div>
  )
}
