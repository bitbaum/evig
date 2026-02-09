'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'

interface ApprovalActionsProps {
  submissionId: string
  title: string
}

export function ApprovalActions({ submissionId, title }: ApprovalActionsProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState<'approve' | 'reject' | null>(null)

  const handleAction = async (action: 'approve' | 'reject') => {
    setIsLoading(action)

    try {
      const response = await fetch(`/api/admin/approvals/${submissionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Fehler bei der Verarbeitung')
      }

      // Refresh the page to reflect the updated status
      router.refresh()
    } catch {
      // Show inline feedback on error
      setIsLoading(null)
    }
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={() => handleAction('approve')}
        disabled={isLoading !== null}
        className="px-3 py-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white text-sm rounded transition-colors flex items-center gap-1"
      >
        {isLoading === 'approve' ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : (
          <CheckCircle className="w-3 h-3" />
        )}
        Genehmigen
      </button>
      <button
        onClick={() => handleAction('reject')}
        disabled={isLoading !== null}
        className="px-3 py-1 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white text-sm rounded transition-colors flex items-center gap-1"
      >
        {isLoading === 'reject' ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : (
          <XCircle className="w-3 h-3" />
        )}
        Ablehnen
      </button>
    </div>
  )
}
