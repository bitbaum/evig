import Link from 'next/link'
import { BlogPost } from '@/lib/blog'
import { formatDate, getReadingTime } from '@/lib/blog-utils'
import { Clock } from 'lucide-react'

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
                <div className="aspect-[16/10] overflow-hidden rounded-lg bg-gray-200 mb-4">
                  <img
                    src={post.featuredImage}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
              ) : (
                <div className="aspect-[16/10] bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-gray-400 text-4xl font-bold">R</span>
                </div>
              )}

              {/* Category */}
              {post.category && (
                <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded mb-3 uppercase tracking-wide">
                  {post.category}
                </span>
              )}

              {/* Title */}
              <h3 className="text-xl font-bold text-gray-900 mb-2 leading-snug group-hover:text-primary-700 transition-colors line-clamp-3">
                {post.title}
              </h3>

              {/* Excerpt */}
              {post.excerpt && (
                <p className="text-gray-600 mb-3 line-clamp-2 text-sm">
                  {post.excerpt}
                </p>
              )}

              {/* Meta */}
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span className="font-semibold text-gray-700">{post.author}</span>
                <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
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
