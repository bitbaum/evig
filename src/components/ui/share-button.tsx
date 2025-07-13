'use client'

import { Button } from './button'
import { Share2 } from 'lucide-react'
import { ReactNode } from 'react'

interface ShareButtonProps {
  className?: string
  text: string
  url: string
  children?: ReactNode
}

export function ShareButton({ className, text, url, children = 'Share' }: ShareButtonProps) {
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
      <Share2 className="mr-2 h-4 w-4" />
      {children}
    </Button>
  )
} 