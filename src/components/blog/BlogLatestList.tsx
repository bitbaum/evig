import Image from 'next/image'
import Link from 'next/link'
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
                <div className="w-32 h-32 flex-shrink-0 overflow-hidden rounded-lg bg-gray-200 relative">
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
                <div className="w-32 h-32 flex-shrink-0 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
                  <span className="text-gray-400 text-2xl font-bold">R</span>
                </div>
              )}

              {/* Content */}
              <div className="flex-1 min-w-0">
                {/* Category */}
                {post.category && (
                  <span className="inline-block px-2 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded mb-2 uppercase tracking-wide">
                    {post.category}
                  </span>
                )}

                {/* Title */}
                <Heading level={3} className="text-lg font-bold text-gray-900 mb-2 leading-snug group-hover:text-primary-700 transition-colors line-clamp-2">
                  {post.title}
                </Heading>

                {/* Meta */}
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span className="font-semibold text-gray-700">{post.author}</span>
                  <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                  <time>{formatDate(post.publishedAt || post.createdAt)}</time>
                  <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
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
