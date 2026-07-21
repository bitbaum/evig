import Image from 'next/image'
import { Link } from '@/i18n/navigation'
import { Clock } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { BlogPost } from '@/lib/blog'
import { getReadingTime } from '@/lib/blog-utils'
import UnlistedBadge from './UnlistedBadge'
import BlogByline from './BlogByline'

interface BlogFeaturedGridProps {
  posts: BlogPost[]
}

export default async function BlogFeaturedGrid({ posts }: BlogFeaturedGridProps) {
  const t = await getTranslations('blog')

  return (
    <div className="grid gap-8 md:grid-cols-3">
      {posts.map((post) => {
        const readingTime = getReadingTime(post.body)

        return (
          <Link key={post.slug} href={`/blog/${post.slug}`} className="group">
            <article>
              {/* Image */}
              {post.featuredImage ? (
                <div className="relative mb-4 aspect-[16/10] overflow-hidden rounded-xl border border-subtle bg-surface-raised">
                  <Image
                    src={post.featuredImage}
                    alt={post.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                </div>
              ) : (
                <div className="mb-4 flex aspect-[16/10] items-center justify-center rounded-xl border border-subtle bg-surface-raised">
                  <span className="font-mono text-3xl font-semibold text-text-tertiary">R</span>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2.5">
                {post.category && <span className="ui-public-eyebrow">{post.category}</span>}
                {post.visibility === 'unlisted' && <UnlistedBadge />}
              </div>

              <h3 className="mt-3 line-clamp-3 text-xl font-semibold leading-snug tracking-[-0.01em] text-text-primary transition-colors group-hover:text-action">
                {post.title}
              </h3>

              {post.excerpt && (
                <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-text-secondary">
                  {post.excerpt}
                </p>
              )}

              <div className="mt-3 flex flex-wrap items-center gap-x-2.5 gap-y-1 font-mono text-[11px] uppercase tracking-[0.08em] text-text-tertiary">
                <BlogByline author={post.author} authorId={post.authorId} className="text-text-secondary" />
                <span aria-hidden="true">·</span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3 w-3" aria-hidden="true" />
                  {readingTime} {t('minutesShort')}
                </span>
              </div>
            </article>
          </Link>
        )
      })}
    </div>
  )
}
