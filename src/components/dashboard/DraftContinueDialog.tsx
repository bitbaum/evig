import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { Campaign } from '@/types/campaign'

interface DraftContinueDialogProps {
  onContinue?: () => void
  onDiscard?: () => void
  draftData?: Campaign
  draftTimestamp?: Date
}

// Calculate relative time from timestamp
function getRelativeTime(timestamp: Date | undefined): string {
  if (!timestamp) return 'just now'
  const now = Date.now()
  const minutes = Math.floor((now - timestamp.getTime()) / 1000 / 60)
  return `${minutes} minutes ago`
}

export default function DraftContinueDialog({
  onContinue,
  onDiscard,
  draftData,
  draftTimestamp
}: DraftContinueDialogProps) {
  // Use lazy initializer to capture time once on mount
  const [relativeTime] = useState(() => getRelativeTime(draftTimestamp))

  return (
    <Card className="max-w-md mx-auto">
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold mb-4">Continue Draft?</h3>
        <p className="text-sm text-gray-600 mb-4">
          You have an unsaved draft from {relativeTime}
        </p>

        <div className="flex gap-3">
          <Button onClick={onContinue} className="flex-1">
            Continue
          </Button>
          <Button onClick={onDiscard} variant="outline" className="flex-1">
            Discard
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

