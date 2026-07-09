import Image from 'next/image'
import { Link } from '@/i18n/navigation'
import { Clock } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { BlogPost } from '@/lib/blog'
import { formatDate } from '@/lib/date-formats'
import { getReadingTime } from '@/lib/blog-utils'
import UnlistedBadge from './UnlistedBadge'

interface BlogLatestListProps {
  posts: BlogPost[]
}

export default async function BlogLatestList({ posts }: BlogLatestListProps) {
  const t = await getTranslations('blog')

  return (
    <div className="grid gap-x-8 gap-y-2 md:grid-cols-2">
      {posts.map((post) => {
        const readingTime = getReadingTime(post.body)

        return (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="group border-t border-subtle py-5 transition-colors first:border-t-0 md:[&:nth-child(2)]:border-t-0"
          >
            <article className="flex gap-5">
              {/* Thumbnail */}
              {post.featuredImage ? (
                <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg border border-subtle bg-surface-raised">
                  <Image
                    src={post.featuredImage}
                    alt={post.title}
                    fill
                    sizes="96px"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                </div>
              ) : (
                <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-lg border border-subtle bg-surface-raised">
                  <span className="font-mono text-xl font-semibold text-text-tertiary">R</span>
                </div>
              )}

              {/* Content */}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  {post.category && <span className="ui-public-eyebrow">{post.category}</span>}
                  {post.visibility === 'unlisted' && <UnlistedBadge />}
                </div>

                <h3 className="mt-2 line-clamp-2 text-lg font-semibold leading-snug tracking-[-0.01em] text-text-primary transition-colors group-hover:text-action">
                  {post.title}
                </h3>

                <div className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1 font-mono text-[11px] uppercase tracking-[0.08em] text-text-tertiary">
                  <time>{formatDate(post.publishedAt || post.createdAt)}</time>
                  <span aria-hidden="true">·</span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3 w-3" aria-hidden="true" />
                    {readingTime} {t('minutesShort')}
                  </span>
                </div>
              </div>
            </article>
          </Link>
        )
      })}
    </div>
  )
}
