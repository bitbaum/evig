'use client'

import { useState, useSyncExternalStore } from 'react'
import { useTranslations } from 'next-intl'
import { Link2, Check, Share2 } from 'lucide-react'
import { logger } from '@/lib/logger'
import Heading from '@/components/ui/Heading'
import { Button } from '@/components/ui/button'

interface ShareButtonsProps {
  url: string
  title: string
}

// navigator.share only exists on (mostly mobile) browsers. useSyncExternalStore
// gives an SSR-safe read: server snapshot is false, the client snapshot flips it
// after hydration without a setState-in-effect.
const noopSubscribe = () => () => {}
function useCanNativeShare(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => typeof navigator.share === 'function',
    () => false,
  )
}

export default function ShareButtons({ url, title }: ShareButtonsProps) {
  const t = useTranslations('components.shareButtons')
  const shareText = encodeURIComponent(`${title} - ${url}`)
  const [copied, setCopied] = useState(false)
  const canNativeShare = useCanNativeShare()

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      logger.warn('Clipboard write failed', { error })
    }
  }

  const handleNativeShare = async () => {
    try {
      await navigator.share({ title, url })
    } catch {
      // User dismissed the share sheet — not an error.
    }
  }

  const shareLinks = {
    mastodon: `https://mastodon.social/share?text=${shareText}`,
    x: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  }

  return (
    <div>
      <Heading level={3} className="text-lg font-semibold text-text-primary mb-4">{t('title')}</Heading>
      <div className="flex flex-wrap gap-3">
        {/* Copy link — the most-used share action */}
        <Button
          type="button"
          variant="secondary"
          onClick={handleCopy}
          className="min-h-11 gap-2"
          title={t('copyLink')}
        >
          {copied ? <Check className="w-4 h-4 text-action" aria-hidden="true" /> : <Link2 className="w-4 h-4" aria-hidden="true" />}
          {copied ? t('copied') : t('copyLink')}
        </Button>

        {/* Native share sheet (mobile) */}
        {canNativeShare && (
          <Button
            type="button"
            variant="secondary"
            onClick={handleNativeShare}
            className="min-h-11 gap-2"
            title={t('nativeShare')}
          >
            <Share2 className="w-4 h-4" aria-hidden="true" />
            {t('nativeShare')}
          </Button>
        )}

        {/* Mastodon */}
        <a
          href={shareLinks.mastodon}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-mastodon text-white rounded-lg hover:bg-brand-mastodon-hover transition-colors text-sm font-medium"
          title={t('shareMastodon')}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M23.268 5.313c-.35-2.578-2.617-4.61-5.304-5.004C17.51.242 15.792 0 11.813 0h-.03c-3.98 0-4.835.242-5.288.309C3.882.692 1.496 2.518.917 5.127.64 6.412.61 7.837.661 9.143c.074 1.874.088 3.745.26 5.611.118 1.24.325 2.47.62 3.68.55 2.237 2.777 4.098 4.96 4.857 2.336.792 4.849.923 7.256.38.265-.061.527-.132.786-.213.585-.184 1.27-.39 1.774-.753a.057.057 0 0 0 .023-.043v-1.809a.052.052 0 0 0-.02-.041.053.053 0 0 0-.046-.01 20.282 20.282 0 0 1-4.709.545c-2.73 0-3.463-1.284-3.674-1.818a5.593 5.593 0 0 1-.319-1.433.053.053 0 0 1 .066-.054c1.517.363 3.072.546 4.632.546.376 0 .75 0 1.125-.01 1.57-.044 3.224-.124 4.768-.422.038-.008.077-.015.11-.024 2.435-.464 4.753-1.92 4.989-5.604.008-.145.03-1.52.03-1.67.002-.512.167-3.63-.024-5.545zm-3.748 9.195h-2.561V8.29c0-1.309-.55-1.976-1.67-1.976-1.23 0-1.846.79-1.846 2.35v3.403h-2.546V8.663c0-1.56-.617-2.35-1.848-2.35-1.112 0-1.668.668-1.67 1.977v6.218H4.822V8.102c0-1.31.337-2.35 1.011-3.12.696-.77 1.608-1.164 2.74-1.164 1.311 0 2.302.5 2.962 1.498l.638 1.06.638-1.06c.66-.999 1.65-1.498 2.96-1.498 1.13 0 2.043.395 2.74 1.164.675.77 1.012 1.81 1.012 3.12z"/>
          </svg>
          Mastodon
        </a>

        {/* X (Twitter) */}
        <a
          href={shareLinks.x}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:opacity-90 transition-colors text-sm font-medium"
          title={t('shareX')}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
          </svg>
          X
        </a>

        {/* LinkedIn */}
        <a
          href={shareLinks.linkedin}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-linkedin text-white rounded-lg hover:bg-brand-linkedin-hover transition-colors text-sm font-medium"
          title={t('shareLinkedin')}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
          </svg>
          LinkedIn
        </a>

        {/* Facebook */}
        <a
          href={shareLinks.facebook}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-facebook text-white rounded-lg hover:bg-brand-facebook-hover transition-colors text-sm font-medium"
          title={t('shareFacebook')}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
          Facebook
        </a>
      </div>
      <p className="text-xs text-text-tertiary mt-3">
        💡 {t('mastodonHint')}
      </p>
    </div>
  )
}
