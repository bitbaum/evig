import Image from 'next/image'
import { Link } from '@/i18n/navigation'
import { Clock } from 'lucide-react'
import { BlogPost } from '@/lib/blog'
import { formatDate } from '@/lib/date-formats'
import { getReadingTime } from '@/lib/blog-utils'
import Heading from '@/components/ui/Heading'

interface BlogFeaturedGridProps {
  posts: BlogPost[]
}

export default function BlogFeaturedGrid({ posts }: BlogFeaturedGridProps) {
  return (
    <div className="grid md:grid-cols-3 gap-8">
      {posts.map((post) => {
        const readingTime = getReadingTime(post.body)

        return (
          <Link key={post.slug} href={`/blog/${post.slug}`} className="group">
            <article>
              {/* Image */}
              {post.featuredImage ? (
                <div className="aspect-[16/10] overflow-hidden rounded-lg bg-neutral-200 mb-4 relative">
                  <Image
                    src={post.featuredImage}
                    alt={post.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    unoptimized
                  />
                </div>
              ) : (
                <div className="aspect-[16/10] bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-white/[0.06] rounded-lg flex items-center justify-center mb-4">
                  <span className="text-neutral-400 text-4xl font-bold">R</span>
                </div>
              )}

              {/* Category */}
              {post.category && (
                <span className="inline-block px-2 py-1 bg-neutral-100 text-neutral-700 text-xs font-semibold rounded mb-3 uppercase tracking-wide">
                  {post.category}
                </span>
              )}

              {/* Title */}
              <Heading level={3} className="text-xl font-bold text-neutral-900 mb-2 leading-snug group-hover:text-primary-700 transition-colors line-clamp-3">
                {post.title}
              </Heading>

              {/* Excerpt */}
              {post.excerpt && (
                <p className="text-neutral-600 mb-3 line-clamp-2 text-sm">
                  {post.excerpt}
                </p>
              )}

              {/* Meta */}
              <div className="flex items-center gap-3 text-xs text-neutral-500">
                <span className="font-semibold text-neutral-700">{post.author}</span>
                <span className="w-1 h-1 bg-neutral-400 rounded-full"></span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {readingTime} min
                </span>
              </div>
            </article>
          </Link>
        )
      })}
    </div>
  )
}
