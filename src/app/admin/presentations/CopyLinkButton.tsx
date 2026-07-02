'use client'

import { useEffect, useRef, useState } from 'react'
import { Check, Link as LinkIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { presentationUrl } from '@/config/presentations'

/**
 * Copies the absolute, shareable deck URL to the clipboard and shows
 * a short "Kopiert!" confirmation (same pattern as the marketplace
 * share button in ListingActionButtons).
 */
export function CopyLinkButton({ slug }: { slug: string }) {
  const [feedback, setFeedback] = useState<'idle' | 'copied' | 'error'>('idle')
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
  }, [])

  const showFeedback = (state: 'copied' | 'error') => {
    setFeedback(state)
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => setFeedback('idle'), 2000)
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(
        presentationUrl(slug, window.location.origin)
      )
      showFeedback('copied')
    } catch {
      // Clipboard unavailable (permissions / insecure context) — surface it.
      showFeedback('error')
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleCopy}
    >
      {feedback === 'copied' ? (
        <Check className="w-4 h-4 text-action" aria-hidden="true" />
      ) : (
        <LinkIcon className="w-4 h-4" aria-hidden="true" />
      )}
      {feedback === 'copied'
        ? 'Kopiert!'
        : feedback === 'error'
          ? 'Kopieren fehlgeschlagen'
          : 'Link kopieren'}
    </Button>
  )
}
