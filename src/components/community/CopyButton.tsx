'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { UI_FEEDBACK_MS } from '@/config/limits'

interface CopyButtonProps {
  value: string
  label?: string
}

export function CopyButton({ value, label = 'Kopieren' }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), UI_FEEDBACK_MS.COPY)
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleCopy}
      className="inline-flex items-center gap-1 min-h-touch bg-surface-raised hover:bg-surface-overlay text-text-secondary"
    >
      {copied ? 'Kopiert!' : label}
    </Button>
  )
}
