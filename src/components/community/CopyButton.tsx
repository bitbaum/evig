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
      className="inline-flex items-center gap-1 rounded px-3 py-2 min-h-[44px] text-xs font-medium bg-neutral-100 hover:bg-neutral-200 text-neutral-700 transition-colors"
    >
      {copied ? 'Kopiert!' : label}
    </button>
  )
}
