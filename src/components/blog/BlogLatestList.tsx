import Image from 'next/image'
import { Link } from '@/i18n/navigation'
import { Clock } from 'lucide-react'
import { BlogPost } from '@/lib/blog'
import { formatDate } from '@/lib/date-formats'
import { getReadingTime } from '@/lib/blog-utils'
import Heading from '@/components/ui/Heading'

interface BlogLatestListProps {
  posts: BlogPost[]
}

export default function BlogLatestList({ posts }: BlogLatestListProps) {
  return (
    <div className="grid md:grid-cols-2 gap-6">
      {posts.map((post) => {
        const readingTime = getReadingTime(post.body)

        return (
          <Link key={post.slug} href={`/blog/${post.slug}`} className="group">
            <article className="flex gap-4">
              {/* Thumbnail */}
              {post.featuredImage ? (
                <div className="w-32 h-32 shrink-0 overflow-hidden rounded-lg bg-neutral-200 relative">
                  <Image
                    src={post.featuredImage}
                    alt={post.title}
                    fill
                    sizes="128px"
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    unoptimized
                  />
                </div>
              ) : (
                <div className="w-32 h-32 shrink-0 bg-surface-raised border rounded-lg flex items-center justify-center">
                  <span className="text-text-muted text-2xl font-bold">R</span>
                </div>
              )}

              {/* Content */}
              <div className="flex-1 min-w-0">
                {/* Category */}
                {post.category && (
                  <span className="inline-block px-2 py-1 bg-surface-raised text-text-secondary text-xs font-semibold rounded-sm mb-2 uppercase tracking-wide">
                    {post.category}
                  </span>
                )}

                {/* Title */}
                <Heading level={3} className="text-lg font-bold text-text-primary mb-2 leading-snug group-hover:text-action dark:group-hover:text-action transition-colors line-clamp-2">
                  {post.title}
                </Heading>

                {/* Meta */}
                <div className="flex items-center gap-3 text-xs text-text-tertiary">
                  <span className="font-semibold text-text-secondary">{post.author}</span>
                  <span className="w-1 h-1 bg-neutral-400 rounded-full"></span>
                  <time>{formatDate(post.publishedAt || post.createdAt)}</time>
                  <span className="w-1 h-1 bg-neutral-400 rounded-full"></span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {readingTime} min
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
