import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { Campaign } from '@/types/campaign'

interface DraftContinueDialogProps {
  onContinue?: () => void
  onDiscard?: () => void
  draftData?: Campaign
  draftTimestamp?: Date
}

export default function DraftContinueDialog({
  onContinue,
  onDiscard,
  draftData,
  draftTimestamp
}: DraftContinueDialogProps) {
  const timestamp = draftTimestamp || new Date()
  const relativeTime = draftTimestamp 
    ? `${Math.floor((Date.now() - timestamp.getTime()) / 1000 / 60)} minutes ago`
    : 'just now'

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

