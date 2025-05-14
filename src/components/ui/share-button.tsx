'use client'

import { Button } from './button'

interface ShareButtonProps {
  className?: string
  text: string
  url: string
}

export function ShareButton({ className, text, url }: ShareButtonProps) {
  const handleShare = () => {
    if (typeof window !== 'undefined') {
      window.open(
        `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
        '_blank'
      )
    }
  }

  return (
    <Button
      variant="outline"
      className={className}
      onClick={handleShare}
    >
      Share
    </Button>
  )
} 