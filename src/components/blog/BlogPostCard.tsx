import Link from 'next/link'
import { BlogPost } from '@/lib/blog'
import { formatDate } from '@/lib/blog-utils'

interface BlogPostCardProps {
  post: BlogPost
  featured?: boolean
}

export default function BlogPostCard({ post, featured = false }: BlogPostCardProps) {
  if (featured) {
    return (
      <Link href={`/blog/${post.slug}`} className="group block">
        <article className="grid md:grid-cols-2 gap-8 items-center">
          {/* Featured Image */}
          {post.featuredImage && (
            <div className="aspect-[16/10] overflow-hidden rounded-lg bg-gray-200">
              <img
                src={post.featuredImage}
                alt={post.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
          )}

          {/* Content */}
          <div className={post.featuredImage ? '' : 'md:col-span-2'}>
            {post.category && (
              <span className="inline-block px-3 py-1 bg-primary-100 text-primary-800 text-sm font-medium rounded-full mb-3">
                {post.category}
              </span>
            )}
            <h2 className="text-3xl font-bold text-gray-900 mb-3 group-hover:text-primary-700 transition-colors">
              {post.title}
            </h2>
            {post.excerpt && (
              <p className="text-lg text-gray-600 mb-4 line-clamp-3">
                {post.excerpt}
              </p>
            )}
            <div className="flex items-center gap-3 text-sm text-gray-500">
              <span className="font-medium">{post.author}</span>
              <span>·</span>
              <time>{formatDate(post.publishedAt || post.createdAt)}</time>
            </div>
          </div>
        </article>
      </Link>
    )
  }

  return (
    <Link href={`/blog/${post.slug}`} className="group block">
      <article>
        {/* Thumbnail */}
        {post.featuredImage && (
          <div className="aspect-[16/10] overflow-hidden rounded-lg bg-gray-200 mb-4">
            <img
              src={post.featuredImage}
              alt={post.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        )}

        {/* Category */}
        {post.category && (
          <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded mb-2">
            {post.category}
          </span>
        )}

        {/* Title */}
        <h2 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-primary-700 transition-colors line-clamp-2">
          {post.title}
        </h2>

        {/* Excerpt */}
        {post.excerpt && (
          <p className="text-gray-600 mb-3 line-clamp-2 text-sm">
            {post.excerpt}
          </p>
        )}

        {/* Meta */}
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>{post.author}</span>
          <span>·</span>
          <time>{formatDate(post.publishedAt || post.createdAt)}</time>
        </div>
      </article>
    </Link>
  )
}
