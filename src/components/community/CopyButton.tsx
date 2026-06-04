'use client'

import { useState } from 'react'
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
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1 rounded-sm px-3 py-2 min-h-touch text-xs font-medium bg-surface-raised hover:bg-neutral-200 text-text-secondary transition-colors"
    >
      {copied ? 'Kopiert!' : label}
    </button>
  )
}
