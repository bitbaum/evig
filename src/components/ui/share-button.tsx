'use client'

import { Button } from './button'
import { Share2 } from 'lucide-react'
import { ReactNode } from 'react'

interface ShareButtonProps {
  className?: string
  text: string
  url: string
  children?: ReactNode
  platform?: 'twitter' | 'mastodon'
  mastodonInstance?: string // e.g. mastodon.social (optional, will prompt if not provided)
}

export function ShareButton({ className, text, url, children = 'Teilen', platform = 'twitter', mastodonInstance }: ShareButtonProps) {
  const handleShare = () => {
    if (typeof window === 'undefined') return

    if (platform === 'mastodon') {
      // If an instance is provided, use the share URL. Otherwise, try web+mastodon: protocol
      if (mastodonInstance) {
        const shareUrl = `https://${mastodonInstance}/share?text=${encodeURIComponent(`${text} ${url}`)}`
        window.open(shareUrl, '_blank')
        return
      }
      // Use the generic mastodon share intent which triggers instance picker in supporting browsers
      const generic = `https://mastodonshare.com/?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`
      window.open(generic, '_blank')
      return
    }

    // Default: X intent
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      '_blank'
    )
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