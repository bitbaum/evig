import { Link } from '@/i18n/navigation'
import { ArrowLeft } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { BlogPost } from '@/lib/blog'
import { formatDate } from '@/lib/date-formats'
import { getReadingTime } from '@/lib/blog-utils'
import { ROUTES } from '@/config/routes'
import UnlistedBadge from './UnlistedBadge'

interface BlogPostHeaderProps {
  post: BlogPost
}

export default async function BlogPostHeader({ post }: BlogPostHeaderProps) {
  const t = await getTranslations('blog')
  const readingTime = getReadingTime(post.body)

  return (
    <header className="mx-auto max-w-[720px] px-4 pt-10 pb-8 sm:px-6 sm:pt-16">
      {/* Back link */}
      <Link
        href={ROUTES.public.blog}
        className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.14em] text-text-tertiary transition-colors hover:text-text-primary"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
        {t('back')}
      </Link>

      {/* Eyebrow: category + unlisted marker */}
      <div className="mt-10 flex flex-wrap items-center gap-3">
        {post.category && <span className="ui-public-eyebrow">{post.category}</span>}
        {post.visibility === 'unlisted' && <UnlistedBadge />}
      </div>

      {/* Title */}
      <h1 className="mt-4 text-4xl font-semibold leading-[1.04] tracking-[-0.02em] text-text-primary sm:text-5xl lg:text-[3.5rem]">
        {post.title}
      </h1>

      {/* Excerpt / lede */}
      {post.excerpt && (
        <p className="mt-6 max-w-[60ch] text-lg leading-relaxed text-text-secondary sm:text-xl">
          {post.excerpt}
        </p>
      )}

      {/* Meta */}
      <div className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-subtle pt-6 font-mono text-xs uppercase tracking-[0.08em] text-text-tertiary">
        <span className="text-text-secondary">{post.author}</span>
        <span aria-hidden="true">·</span>
        <time dateTime={post.publishedAt || post.createdAt}>
          {formatDate(post.publishedAt || post.createdAt)}
        </time>
        <span aria-hidden="true">·</span>
        <span>
          {readingTime} {t('minutesShort')}
        </span>
      </div>
    </header>
  )
}
