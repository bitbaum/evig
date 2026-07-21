import Image from 'next/image'
import { Link } from '@/i18n/navigation'
import { Clock } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { BlogPost } from '@/lib/blog'
import { formatDate } from '@/lib/date-formats'
import { getReadingTime } from '@/lib/blog-utils'
import UnlistedBadge from './UnlistedBadge'
import BlogByline from './BlogByline'

interface BlogHeroProps {
  post: BlogPost
}

export default async function BlogHero({ post }: BlogHeroProps) {
  const t = await getTranslations('blog')
  const readingTime = getReadingTime(post.body)

  return (
    <Link href={`/blog/${post.slug}`} className="group block">
      <article className="grid items-center gap-8 lg:grid-cols-2">
        {/* Image */}
        {post.featuredImage ? (
          <div className="relative order-2 aspect-[16/10] overflow-hidden rounded-xl border border-subtle bg-surface-raised lg:order-1 lg:aspect-[4/3]">
            <Image
              src={post.featuredImage}
              alt={post.title}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
          </div>
        ) : (
          <div className="order-2 flex aspect-[16/10] items-center justify-center rounded-xl border border-subtle bg-surface-raised lg:order-1 lg:aspect-[4/3]">
            <span className="font-mono text-5xl font-semibold text-text-tertiary">R</span>
          </div>
        )}

        {/* Content */}
        <div className="order-1 lg:order-2">
          <div className="flex flex-wrap items-center gap-3">
            {post.category && <span className="ui-public-eyebrow">{post.category}</span>}
            {post.visibility === 'unlisted' && <UnlistedBadge />}
          </div>

          <h2 className="mt-4 text-3xl font-semibold leading-[1.08] tracking-[-0.01em] text-text-primary transition-colors group-hover:text-action sm:text-4xl lg:text-[2.75rem]">
            {post.title}
          </h2>

          {post.excerpt && (
            <p className="mt-4 line-clamp-3 text-lg leading-relaxed text-text-secondary">
              {post.excerpt}
            </p>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs uppercase tracking-[0.08em] text-text-tertiary">
            <BlogByline author={post.author} authorId={post.authorId} className="text-text-secondary" />
            <span aria-hidden="true">·</span>
            <time>{formatDate(post.publishedAt || post.createdAt)}</time>
            <span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" aria-hidden="true" />
              {readingTime} {t('minutesShort')}
            </span>
          </div>
        </div>
      </article>
    </Link>
  )
}
